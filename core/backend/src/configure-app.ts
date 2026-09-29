import { type INestApplication, ValidationPipe } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';

/**
 * Configuração compartilhada entre o bootstrap de produção e os testes e2e.
 * Existe para que o que é testado seja exatamente o que roda — sem a
 * configuração divergir entre main.ts e a suíte.
 */
export function configureApp(app: INestApplication): INestApplication {
  // Todas as rotas ficam sob /api/v1 (ver docs/backend/api.md).
  app.setGlobalPrefix('api/v1');

  // Apenas os dois portais podem consumir a API.
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) ?? true,
  });

  // Valida os DTOs de entrada e descarta campos não declarados.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Toda resposta de erro sai no formato { statusCode, message, error }.
  app.useGlobalFilters(new AllExceptionsFilter());

  // Log de método, rota, código e duração de cada requisição.
  app.useGlobalInterceptors(new LoggingInterceptor());

  return app;
}

/**
 * Devolve o envelope de erro padrão para caminhos que nenhuma rota atende.
 *
 * O Express trata a rota não encontrada antes de o Nest chegar ao filtro de
 * exceções, e responde uma página HTML. Sem isto, um portal que chamasse
 * `response.json()` em um endereço errado estouraria com erro de parse em vez
 * de exibir a mensagem prevista (RF-API-58).
 *
 * **Precisa ser chamado depois de `app.init()`** — e, no bootstrap, depois do
 * Swagger —, para que só receba o que as rotas já registradas não atenderam.
 */
export function useNotFoundFallback(app: INestApplication): INestApplication {
  app.use((request: Request, response: Response) => {
    response.status(404).json({
      statusCode: 404,
      message: `Cannot ${request.method} ${request.path}`,
      error: 'Not Found',
    });
  });

  return app;
}
