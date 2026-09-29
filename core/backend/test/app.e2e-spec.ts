import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { configureApp, useNotFoundFallback } from './../src/configure-app.js';

describe('Fundação da API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Mesma configuração do bootstrap de produção.
    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
    useNotFoundFallback(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health responde 200 com o banco disponível', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

    expect(response.body).toEqual({ status: 'ok', database: 'up' });
  });

  it('rota inexistente responde no formato de erro padronizado', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/nao-existe').expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      error: expect.any(String),
    });
    expect(response.body).toHaveProperty('message');
  });
});
