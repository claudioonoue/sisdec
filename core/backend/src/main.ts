import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp, useNotFoundFallback } from './configure-app.js';
import { buildSwaggerDocument } from './swagger-document.js';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));

  SwaggerModule.setup('api/docs', app, buildSwaggerDocument(app));

  // Depois das rotas e do Swagger: só então o que sobra é de fato não encontrado.
  await app.init();
  useNotFoundFallback(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`API em http://localhost:${port}/api/v1`, 'Bootstrap');
}

await bootstrap();
