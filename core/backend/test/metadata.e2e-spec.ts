import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { configureApp, useNotFoundFallback } from './../src/configure-app.js';

describe('Metadados públicos (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
    useNotFoundFallback(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /metadata', () => {
    it('responde sem autenticação (RF-API-62)', async () => {
      const { body } = await request(app.getHttpServer()).get('/api/v1/metadata').expect(200);

      expect(body.reportTypes).toHaveLength(14);
      expect(body.reportCategories).toHaveLength(4);
      expect(body.reportStatuses).toHaveLength(6);
    });

    it('devolve value, label e urgent em cada tipo', async () => {
      const { body } = await request(app.getHttpServer()).get('/api/v1/metadata').expect(200);

      expect(body.reportTypes).toContainEqual({
        value: 'FLOODING',
        label: 'Alagamento ou enchente',
        urgent: false,
      });
      expect(body.reportTypes).toContainEqual({
        value: 'FIRE',
        label: 'Incêndio em edificação',
        urgent: true,
      });
    });

    it('inclui a situação TRIAGE, alcançável pela triagem em duas etapas', async () => {
      const { body } = await request(app.getHttpServer()).get('/api/v1/metadata').expect(200);

      expect(body.reportStatuses).toContainEqual({ value: 'TRIAGE', label: 'Em triagem' });
    });

    it('publica os limites de upload', async () => {
      const { body } = await request(app.getHttpServer()).get('/api/v1/metadata').expect(200);

      expect(body.upload).toEqual({
        maxFiles: 5,
        maxSizeMb: expect.any(Number),
        acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
    });

    it('não expõe enumerações de uso interno', async () => {
      const { body } = await request(app.getHttpServer()).get('/api/v1/metadata').expect(200);

      expect(body).not.toHaveProperty('priorities');
      expect(body).not.toHaveProperty('agentRoles');
    });
  });

  describe('GET /report-types', () => {
    it('devolve exatamente o conteúdo de metadata.reportTypes (RF-API-10)', async () => {
      const atalho = await request(app.getHttpServer()).get('/api/v1/report-types').expect(200);
      const completo = await request(app.getHttpServer()).get('/api/v1/metadata').expect(200);

      expect(atalho.body).toEqual(completo.body.reportTypes);
    });
  });
});
