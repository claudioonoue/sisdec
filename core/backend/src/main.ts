import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SISDEC — Sistema Integrado da Defesa Civil')
    .setDescription(
      'API de registro e acompanhamento de reclamações, sugestões e comunicações de risco à Defesa Civil.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
