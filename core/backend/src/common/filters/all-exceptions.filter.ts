import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/** Corpo de erro padronizado da API (RF-API-58). */
interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

/**
 * Converte qualquer exceção no formato { statusCode, message, error }.
 * Erros não previstos viram 500 genérico: o detalhe vai para o log, nunca para
 * a resposta (RNF-API-17).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      // O ValidationPipe devolve um objeto; as demais exceções, uma string.
      const body: ErrorBody =
        typeof payload === 'string'
          ? { statusCode: status, message: payload, error: exception.name }
          : {
              statusCode: status,
              message: (payload as { message?: string | string[] }).message ?? exception.message,
              error: (payload as { error?: string }).error ?? exception.name,
            };

      response.status(status).json(body);
      return;
    }

    this.logger.error(
      `${request.method} ${request.url} — erro não tratado`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro interno do servidor',
      error: 'Internal Server Error',
    } satisfies ErrorBody);
  }
}
