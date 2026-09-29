import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp, useNotFoundFallback } from './configure-app.js';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SISDEC — Sistema Integrado da Defesa Civil')
    .setDescription(
      'API de registro e acompanhamento de reclamações, sugestões e comunicações de risco à Defesa Civil.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  // Depois das rotas e do Swagger: só então o que sobra é de fato não encontrado.
  await app.init();
  useNotFoundFallback(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`API em http://localhost:${port}/api/v1`, 'Bootstrap');
}

await bootstrap();
