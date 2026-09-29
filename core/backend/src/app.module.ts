import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/env.validation.js';
import { HealthModule } from './modules/health/health.module.js';
import { MetadataModule } from './modules/metadata/metadata.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Falha na inicialização quando o ambiente está incompleto (RNF-API-33).
      validate: validateEnvironment,
    }),
    PrismaModule,
    HealthModule,
    MetadataModule,
  ],
})
export class AppModule {}
