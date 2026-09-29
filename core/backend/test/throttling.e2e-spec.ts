import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { configureApp, useNotFoundFallback } from './../src/configure-app.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

/**
 * Suíte dedicada ao limite de requisições (RNF-API-15). É a única que **não**
 * desliga o `ThrottlerGuard` — as outras o desligam para não depender de contagem
 * de requisições, que é estado compartilhado entre testes.
 */
const MARCA = `e2e-throttling-${Date.now()}`;

describe('Limite de requisições (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
    useNotFoundFallback(app);
    await app.listen(0);
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Pelo marcador, e não pelos protocolos coletados: vale mesmo se um teste falhar.
    await prisma.report.deleteMany({ where: { description: { contains: MARCA } } });
    await app.close();
  });

  it('limita o login a 5 tentativas por minuto, com 429 no envelope padrão', async () => {
    const credenciais = { email: 'nao-existe@exemplo.test', password: 'qualquer-senha' };
    const codigos: number[] = [];

    for (let i = 0; i < 7; i += 1) {
      const { status } = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(credenciais);
      codigos.push(status);
    }

    expect(codigos.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(codigos.slice(5)).toEqual([429, 429]);

    const bloqueado = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(credenciais)
      .expect(429);

    expect(bloqueado.body).toMatchObject({ statusCode: 429 });
    expect(bloqueado.headers['content-type']).toContain('application/json');
  });

  it('limita o registro de ocorrência a 10 por minuto', async () => {
    const corpo = {
      category: 'COMPLAINT',
      type: 'BLOCKED_DRAINAGE',
      description: `Bueiro obstruído na esquina, acumulando água. ${MARCA}`,
      address: 'Rua Teste, 1',
      district: 'Centro',
    };
    const codigos: number[] = [];

    for (let i = 0; i < 12; i += 1) {
      const resposta = await request(app.getHttpServer()).post('/api/v1/reports').send(corpo);
      codigos.push(resposta.status);
    }

    expect(codigos.filter((c) => c === 201)).toHaveLength(10);
    expect(codigos.filter((c) => c === 429)).toHaveLength(2);
  });

  it('não limita as rotas de leitura de metadados', async () => {
    for (let i = 0; i < 15; i += 1) {
      await request(app.getHttpServer()).get('/api/v1/metadata').expect(200);
    }
  });
});
