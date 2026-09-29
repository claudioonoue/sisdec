import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { validateEnvironment } from './config/env.validation.js';
import { AgentsModule } from './modules/agents/agents.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
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
    AuthModule,
    HealthModule,
    MetadataModule,
    AgentsModule,
  ],
  providers: [
    // Autenticação e autorização são globais: o padrão é rota protegida, e uma
    // rota pública precisa se declarar com @Public(). Esquecer o decorador deixa
    // a rota fechada — o erro seguro (RNF-API-18).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // A ordem importa: o RolesGuard depende de request.user, preenchido pelo anterior.
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
