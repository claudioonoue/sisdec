import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Único ponto de acesso ao banco. A conexão acompanha o ciclo de vida do Nest.
 *
 * O Prisma 7 exige um driver adapter explícito; a URL vem do ambiente já
 * validado na inicialização, e não diretamente de process.env.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    super({
      adapter: new PrismaPg({
        connectionString: config.get('DATABASE_URL', { infer: true }),
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conectado ao PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Verificação usada por GET /health. Devolve false em vez de lançar, para que
   * a indisponibilidade do banco vire uma resposta e não derrube o processo
   * (RNF-API-24).
   */
  async isReachable(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error(
        `Banco de dados inacessível: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
      );
      return false;
    }
  }
}
