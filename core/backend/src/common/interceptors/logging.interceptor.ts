import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Registra método, rota, código de resposta e duração de cada requisição
 * (RNF-API-39). Deliberadamente não registra corpo, cabeçalho nem parâmetro de
 * consulta: é por aí que senha, token e dado pessoal vazariam para o log
 * (RNF-API-41).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const { method, url } = http.getRequest<Request>();
    const startedAt = Date.now();

    const registrar = (): void => {
      const { statusCode } = http.getResponse<Response>();
      // A rota entra sem query string, que pode carregar termo de busca.
      const rota = url.split('?')[0];
      this.logger.log(`${method} ${rota} ${statusCode} — ${Date.now() - startedAt}ms`);
    };

    return next.handle().pipe(tap({ next: registrar, error: registrar }));
  }
}
