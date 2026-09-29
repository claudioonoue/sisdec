import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { configureApp, useNotFoundFallback } from './../src/configure-app.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

const MARCA = `e2e-reports-${Date.now()}`;

function corpoValido(extra: Record<string, unknown> = {}) {
  return {
    category: 'RISK_ALERT',
    type: 'DANGEROUS_TREE',
    description: `Árvore inclinada sobre a calçada. ${MARCA}`,
    address: 'Rua das Palmeiras, 120',
    district: 'Centro',
    ...extra,
  };
}

describe('Ocorrências — registro e consulta pública (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const protocolosCriados: string[] = [];

  async function registrar(corpo: Record<string, unknown>, esperado = 201) {
    const { body } = await request(app.getHttpServer())
      .post('/api/v1/reports')
      .send(corpo)
      .expect(esperado);

    if (esperado === 201) protocolosCriados.push(body.protocolNumber);
    return body;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
    useNotFoundFallback(app);
    // Um servidor de verdade em porta efêmera: o teste de concorrência abre 20
    // requisições ao mesmo tempo, e sem isso o supertest tentaria subir um
    // listener por requisição.
    await app.listen(0);
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // A limpeza usa o marcador gravado na descrição, e não a lista de protocolos:
    // se uma asserção falhar antes de a lista ser preenchida — como acontece
    // quando o teste de concorrência quebra —, os registros ficariam para trás.
    const ids = await prisma.report.findMany({
      where: { description: { contains: MARCA } },
      select: { id: true, citizenId: true },
    });
    await prisma.report.deleteMany({ where: { id: { in: ids.map((r) => r.id) } } });
    await prisma.citizen.deleteMany({
      where: { id: { in: ids.map((r) => r.citizenId).filter((id): id is string => id !== null) } },
    });
    await app.close();
  });

  describe('POST /reports', () => {
    it('registra sem autenticação e devolve protocolo, situação e data (RF-API-01)', async () => {
      const body = await registrar(corpoValido());

      expect(body).toEqual({
        id: expect.any(String),
        protocolNumber: expect.stringMatching(/^SISDEC-\d{4}-\d{6}$/),
        status: 'RECEIVED',
        createdAt: expect.any(String),
      });
    });

    it('usa o ano corrente no protocolo (RF-API-02)', async () => {
      const body = await registrar(corpoValido());

      expect(body.protocolNumber).toContain(`SISDEC-${new Date().getUTCFullYear()}-`);
    });

    it('registra como anônima quando citizen não vem (RF-API-04)', async () => {
      const body = await registrar(corpoValido());

      const gravada = await prisma.report.findUniqueOrThrow({
        where: { id: body.id },
        select: { citizenId: true, priority: true, resolvedAt: true },
      });

      expect(gravada.citizenId).toBeNull();
      // Prioridade só é definida na triagem (RF-API-06).
      expect(gravada.priority).toBeNull();
      expect(gravada.resolvedAt).toBeNull();
    });

    it('grava o cidadão quando informado, na mesma transação (RF-API-05)', async () => {
      const body = await registrar(
        corpoValido({ citizen: { name: 'Maria Silva', email: 'maria@exemplo.com', phone: '11999998888' } }),
      );

      const gravada = await prisma.report.findUniqueOrThrow({
        where: { id: body.id },
        select: { citizen: { select: { name: true, email: true, phone: true } } },
      });

      expect(gravada.citizen).toEqual({
        name: 'Maria Silva',
        email: 'maria@exemplo.com',
        phone: '11999998888',
      });
    });

    it('aceita cidadão apenas com nome', async () => {
      const body = await registrar(corpoValido({ citizen: { name: 'Só o Nome' } }));

      const gravada = await prisma.report.findUniqueOrThrow({
        where: { id: body.id },
        select: { citizen: { select: { name: true, email: true, phone: true } } },
      });

      expect(gravada.citizen).toEqual({ name: 'Só o Nome', email: null, phone: null });
    });

    it('grava as coordenadas quando informadas, e aceita a sua ausência', async () => {
      const comPonto = await registrar(corpoValido({ latitude: -23.5505, longitude: -46.6333 }));

      const gravada = await prisma.report.findUniqueOrThrow({
        where: { id: comPonto.id },
        select: { latitude: true, longitude: true },
      });

      expect(Number(gravada.latitude)).toBeCloseTo(-23.5505, 4);
      expect(Number(gravada.longitude)).toBeCloseTo(-46.6333, 4);
    });

    describe('validação (RF-API-07, RF-API-08)', () => {
      it('recusa campo obrigatório ausente, nomeando-o', async () => {
        const { body } = await request(app.getHttpServer())
          .post('/api/v1/reports')
          .send({ category: 'RISK_ALERT', type: 'DANGEROUS_TREE' })
          .expect(400);

        expect(JSON.stringify(body.message)).toContain('description');
      });

      it('recusa type e category fora da enumeração', async () => {
        await registrar(corpoValido({ type: 'METEORITO' }), 400);
        await registrar(corpoValido({ category: 'ELOGIO' }), 400);
      });

      it('recusa coordenada fora da faixa', async () => {
        await registrar(corpoValido({ latitude: 200, longitude: 0 }), 400);
      });

      it('recusa cidadão sem nome e e-mail inválido', async () => {
        await registrar(corpoValido({ citizen: { email: 'maria@exemplo.com' } }), 400);
        await registrar(corpoValido({ citizen: { name: 'Maria', email: 'nao-e-email' } }), 400);
      });

      it('descarta campos não declarados (RNF-API-09)', async () => {
        await registrar(corpoValido({ status: 'RESOLVED', priority: 'CRITICAL' }), 400);
      });
    });

    it('não gera protocolo repetido sob concorrência (RNF-API-19)', async () => {
      const respostas = await Promise.all(
        Array.from({ length: 20 }, () =>
          request(app.getHttpServer()).post('/api/v1/reports').send(corpoValido()),
        ),
      );

      const protocolos = respostas.map((r) => r.body.protocolNumber);
      protocolosCriados.push(...protocolos);

      expect(respostas.every((r) => r.status === 201)).toBe(true);
      expect(new Set(protocolos).size).toBe(20);
    });
  });

  describe('GET /reports/protocol/:protocolNumber', () => {
    let protocolo: string;
    let idOcorrencia: string;

    beforeAll(async () => {
      const body = await registrar(
        corpoValido({
          latitude: -23.5505,
          longitude: -46.6333,
          citizen: { name: 'Maria Silva', email: 'maria@exemplo.com', phone: '11999998888' },
        }),
      );
      protocolo = body.protocolNumber;
      idOcorrencia = body.id;
    });

    it('devolve a situação e os campos públicos (RF-API-13)', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/api/v1/reports/protocol/${protocolo}`)
        .expect(200);

      expect(body).toEqual({
        protocolNumber: protocolo,
        category: 'RISK_ALERT',
        type: 'DANGEROUS_TREE',
        status: 'RECEIVED',
        district: 'Centro',
        createdAt: expect.any(String),
        resolvedAt: null,
        updates: [],
        attachments: [],
      });
    });

    it('não devolve nada que identifique quem registrou (RF-API-14)', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/api/v1/reports/protocol/${protocolo}`)
        .expect(200);

      for (const campo of [
        'description',
        'address',
        'latitude',
        'longitude',
        'citizen',
        'citizenId',
        'assignedTo',
        'assignedToId',
        'id',
      ]) {
        expect(body).not.toHaveProperty(campo);
      }

      const serializado = JSON.stringify(body);
      expect(serializado).not.toContain('Maria Silva');
      expect(serializado).not.toContain('maria@exemplo.com');
      expect(serializado).not.toContain('11999998888');
      expect(serializado).not.toContain('Palmeiras');
    });

    it('não devolve a prioridade, que é interna (RF-API-65)', async () => {
      await prisma.report.update({ where: { id: idOcorrencia }, data: { priority: 'CRITICAL' } });

      const { body } = await request(app.getHttpServer())
        .get(`/api/v1/reports/protocol/${protocolo}`)
        .expect(200);

      expect(body).not.toHaveProperty('priority');
      expect(JSON.stringify(body)).not.toContain('CRITICAL');
    });

    it('aceita o protocolo em caixa baixa e com espaços (RF-CID-31)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/reports/protocol/${encodeURIComponent(`  ${protocolo.toLowerCase()} `)}`)
        .expect(200);
    });

    it('responde 404 para protocolo inexistente (RF-API-16)', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/reports/protocol/SISDEC-2026-999999')
        .expect(404);

      expect(body).toMatchObject({ statusCode: 404, error: 'Not Found' });
    });

    it('responde 404 para protocolo em formato inválido, sem erro interno', async () => {
      await request(app.getHttpServer()).get('/api/v1/reports/protocol/qualquer-coisa').expect(404);
    });
  });
});
