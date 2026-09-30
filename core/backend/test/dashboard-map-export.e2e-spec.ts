import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { hashPassword } from './../src/common/password.js';
import { configureApp, useNotFoundFallback } from './../src/configure-app.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

const MARCA = `e2e-painel-${Date.now()}`;
const SENHA = 'senha-de-teste-123';
const email = (quem: string) => `${MARCA}-${quem}@exemplo.test`;

describe('Painel, mapa e exportação (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let coord: string;
  let agente: string;

  async function token(quem: string, role: 'COORDINATOR' | 'AGENT') {
    await prisma.agent.create({
      data: { name: `Agente ${quem}`, email: email(quem), passwordHash: await hashPassword(SENHA), role },
    });
    const { body } = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: email(quem), password: SENHA })
      .expect(200);
    return body.accessToken as string;
  }

  async function criar(extra: Record<string, unknown> = {}) {
    const { body } = await request(app.getHttpServer())
      .post('/api/v1/reports')
      .send({
        category: 'RISK_ALERT',
        type: 'DANGEROUS_TREE',
        description: `Ocorrência de teste. ${MARCA}`,
        address: 'Rua das Palmeiras, 120',
        district: 'Centro',
        ...extra,
      })
      .expect(201);
    return body.id as string;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
    useNotFoundFallback(app);
    prisma = app.get(PrismaService);

    coord = await token('coord', 'COORDINATOR');
    agente = await token('agente', 'AGENT');

    // Base conhecida: 2 com ponto em Centro, 1 com ponto em Vila Nova, 2 sem ponto.
    await criar({ latitude: -23.55, longitude: -46.63 });
    await criar({ latitude: -23.56, longitude: -46.64 });
    await criar({ district: 'Vila Nova', type: 'FLOODING', latitude: -23.57, longitude: -46.65 });
    await criar();
    await criar({ district: 'Vila Nova' });
  });

  afterAll(async () => {
    const ids = (
      await prisma.report.findMany({
        where: { description: { contains: MARCA } },
        select: { id: true },
      })
    ).map((r) => r.id);
    await prisma.reportUpdate.deleteMany({ where: { reportId: { in: ids } } });
    await prisma.report.deleteMany({ where: { id: { in: ids } } });
    await prisma.agent.deleteMany({ where: { email: { startsWith: MARCA } } });
    await app.close();
  });

  describe('GET /reports/map', () => {
    it('exige autenticação', async () => {
      await request(app.getHttpServer()).get('/api/v1/reports/map').expect(401);
    });

    it('devolve só as que têm coordenadas e conta as omitidas (RF-API-67)', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/reports/map?search=' + MARCA)
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      expect(body.data).toHaveLength(3);
      expect(body.omittedWithoutCoordinates).toBe(2);
      expect(body.truncated).toBe(false);
      for (const ponto of body.data) {
        expect(typeof ponto.latitude).toBe('number');
        expect(typeof ponto.longitude).toBe('number');
      }
    });

    it('devolve formato enxuto, sem descrição nem endereço', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/reports/map?search=' + MARCA)
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      expect(Object.keys(body.data[0]).sort()).toEqual([
        'id',
        'latitude',
        'longitude',
        'priority',
        'protocolNumber',
        'status',
        'type',
      ]);
    });

    it('aceita os mesmos filtros da listagem', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/api/v1/reports/map?search=${MARCA}&type=FLOODING`)
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0].type).toBe('FLOODING');
    });

    it('não aceita paginação, que o teto de pageSize tornaria insuficiente', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/reports/map?pageSize=10')
        .set('Authorization', `Bearer ${agente}`)
        .expect(400);
    });

    it('sem filtro de situação, traz apenas as abertas', async () => {
      const id = await criar({ latitude: -23.58, longitude: -46.66 });
      await prisma.report.update({ where: { id }, data: { status: 'RESOLVED' } });

      const { body } = await request(app.getHttpServer())
        .get('/api/v1/reports/map?search=' + MARCA)
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      expect(body.data.map((r: { id: string }) => r.id)).not.toContain(id);

      const comFiltro = await request(app.getHttpServer())
        .get(`/api/v1/reports/map?search=${MARCA}&status=RESOLVED`)
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      expect(comFiltro.body.data.map((r: { id: string }) => r.id)).toContain(id);
    });
  });

  describe('GET /reports/export', () => {
    it('responde CSV com cabeçalho em pt-BR, restrito a coordenador (RF-API-70)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/reports/export')
        .set('Authorization', `Bearer ${agente}`)
        .expect(403);

      const resposta = await request(app.getHttpServer())
        .get('/api/v1/reports/export?search=' + MARCA)
        .set('Authorization', `Bearer ${coord}`)
        .expect(200);

      expect(resposta.headers['content-type']).toContain('text/csv');
      expect(resposta.headers['content-disposition']).toContain('attachment');

      const linhas = resposta.text.replace(/^﻿/, '').trim().split('\n');
      expect(linhas[0]).toBe(
        'Protocolo;Categoria;Tipo;Situacao;Prioridade;Bairro;Endereco;Responsavel;Registrada em;Resolvida em',
      );
      expect(linhas).toHaveLength(7);
    });

    /**
     * O CSV é aberto por um agente, e é interface como qualquer tela: o
     * `RNF-OP-09` proíbe mostrar-lhe os valores em inglês da API. O cabeçalho já
     * vinha em pt-BR desde B6; as linhas, não.
     */
    it('traz os dados em pt-BR, não os valores da enumeração', async () => {
      const resposta = await request(app.getHttpServer())
        .get(`/api/v1/reports/export?search=${MARCA}`)
        .set('Authorization', `Bearer ${coord}`)
        .expect(200);

      const corpo = resposta.text;
      for (const valor of ['RISK_ALERT', 'DANGEROUS_TREE', 'RECEIVED', 'IN_PROGRESS', 'HIGH']) {
        expect(corpo).not.toContain(valor);
      }

      expect(corpo).toContain('Comunicação de risco');
      expect(corpo).toContain('Árvore em situação de perigo');
      expect(corpo).toContain('Recebida');
    });

    it('nomeia a ausência de prioridade em vez de deixar a célula vazia', async () => {
      // Célula vazia se confunde com dado faltando; a ocorrência apenas não
      // passou pela triagem ainda.
      const resposta = await request(app.getHttpServer())
        .get(`/api/v1/reports/export?search=${MARCA}&status=RECEIVED`)
        .set('Authorization', `Bearer ${coord}`)
        .expect(200);

      expect(resposta.text).toContain('Sem triagem');
    });

    it('escapa campo que contém o separador', async () => {
      await criar({ district: 'Bairro; com ponto e vírgula' });

      const resposta = await request(app.getHttpServer())
        .get('/api/v1/reports/export?search=' + MARCA)
        .set('Authorization', `Bearer ${coord}`)
        .expect(200);

      expect(resposta.text).toContain('"Bairro; com ponto e vírgula"');
    });

    it('respeita os filtros da listagem', async () => {
      const resposta = await request(app.getHttpServer())
        .get(`/api/v1/reports/export?search=${MARCA}&type=FLOODING`)
        .set('Authorization', `Bearer ${coord}`)
        .expect(200);

      expect(resposta.text.trim().split('\n')).toHaveLength(2);
    });
  });

  describe('painel', () => {
    async function summary(query = '') {
      const { body } = await request(app.getHttpServer())
        .get(`/api/v1/dashboard/summary${query}`)
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);
      return body;
    }

    /** Total de ocorrências críticas em uma das listas por prioridade. */
    function criticas(linhas: Array<{ key: string; total: number }>): number {
      return linhas.find((i) => i.key === 'CRITICAL')?.total ?? 0;
    }

    it('GET /dashboard/summary devolve totais por situação, prioridade e tipo', async () => {
      await request(app.getHttpServer()).get('/api/v1/dashboard/summary').expect(401);

      const { body } = await request(app.getHttpServer())
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      expect(body).toMatchObject({
        open: expect.any(Number),
        total: expect.any(Number),
        byStatus: expect.any(Array),
        byPriority: expect.any(Array),
        byType: expect.any(Array),
      });
      expect(body.byStatus.reduce((s: number, i: { total: number }) => s + i.total, 0)).toBe(
        body.total,
      );
    });

    it('conta as sem prioridade em vez de deixá-las sumir do total', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      expect(body.byPriority.some((i: { key: string }) => i.key === 'SEM_PRIORIDADE')).toBe(true);
      expect(body.byPriority.reduce((s: number, i: { total: number }) => s + i.total, 0)).toBe(
        body.total,
      );
    });

    /**
     * O painel destaca o que ainda exige atenção (RF-OP-10). Somar as já
     * concluídas nesse número inflaria justamente o indicador que o agente usa
     * para decidir o que fazer agora — daí `openByPriority` existir separado.
     */
    it('separa a prioridade das ocorrências em aberto das concluídas (RF-API-73)', async () => {
      const id = await criar({ type: 'FIRE' });
      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/triage/start`)
        .set('Authorization', `Bearer ${coord}`)
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/triage`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ outcome: 'ACCEPT', priority: 'CRITICAL' })
        .expect(200);

      const antes = await summary();
      expect(criticas(antes.openByPriority)).toBe(criticas(antes.byPriority));

      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/status`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ status: 'RESOLVED', comment: 'Atendimento concluído.' })
        .expect(200);

      const depois = await summary();
      // A concluída sai do recorte em aberto, mas continua no total.
      expect(criticas(depois.openByPriority)).toBe(criticas(antes.openByPriority) - 1);
      expect(criticas(depois.byPriority)).toBe(criticas(antes.byPriority));
    });

    it('o total em aberto fecha com a soma de openByPriority', async () => {
      const body = await summary();

      expect(body.openByPriority.reduce((s: number, i: { total: number }) => s + i.total, 0)).toBe(
        body.open,
      );
    });

    it('GET /dashboard/by-district agrupa por bairro, do maior para o menor', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/dashboard/by-district')
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      const centro = body.find((i: { key: string }) => i.key === 'Centro');
      expect(centro.total).toBeGreaterThanOrEqual(3);
      for (let i = 1; i < body.length; i += 1) {
        expect(body[i - 1].total).toBeGreaterThanOrEqual(body[i].total);
      }
    });

    it('GET /dashboard/timeline agrupa por dia', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/dashboard/timeline')
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      expect(body.length).toBeGreaterThan(0);
      expect(body[0].key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof body[0].total).toBe('number');
    });

    it('aceita recorte por período nos três endpoints (RF-API-55)', async () => {
      const futuro = '2099-01-01T00:00:00.000Z';

      for (const rota of ['summary', 'by-district', 'timeline']) {
        const { body } = await request(app.getHttpServer())
          .get(`/api/v1/dashboard/${rota}?from=${futuro}`)
          .set('Authorization', `Bearer ${agente}`)
          .expect(200);

        if (rota === 'summary') expect(body.total).toBe(0);
        else expect(body).toEqual([]);
      }
    });

    it('recusa data em formato inválido', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/dashboard/summary?from=ontem')
        .set('Authorization', `Bearer ${agente}`)
        .expect(400);
    });
  });
});
