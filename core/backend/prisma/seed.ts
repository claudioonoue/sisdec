import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../src/common/password.ts';
import { AgentRole } from '../src/generated/prisma/enums.ts';
import { PrismaClient } from '../src/generated/prisma/client.ts';

/**
 * Dados iniciais: apenas o agente administrador do primeiro acesso (RF-API-51).
 *
 * Os tipos de ocorrência não são semeados — são um `enum` do PostgreSQL, criado
 * pela migração.
 *
 * Idempotente: rodar de novo não duplica nem sobrescreve a senha de um
 * administrador existente.
 */

const EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@sisdec.local';
const NAME = process.env.SEED_ADMIN_NAME ?? 'Administrador do SISDEC';
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'sisdec-admin';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL não definida — veja o .env.example');
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const existente = await prisma.agent.findUnique({
      where: { email: EMAIL.toLowerCase() },
      select: { id: true },
    });

    if (existente) {
      console.log(`Agente administrador já existe (${EMAIL}) — nada a fazer.`);
      return;
    }

    await prisma.agent.create({
      data: {
        name: NAME,
        email: EMAIL.toLowerCase(),
        passwordHash: await hashPassword(PASSWORD),
        role: AgentRole.ADMIN,
      },
    });

    console.log(`Agente administrador criado: ${EMAIL}`);

    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.warn(
        '\n  ATENÇÃO: senha padrão em uso. Troque-a no primeiro acesso, ou defina\n' +
          '  SEED_ADMIN_PASSWORD no .env antes de semear.\n',
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

await main();
