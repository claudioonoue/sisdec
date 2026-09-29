import { readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { configureApp, useNotFoundFallback } from './../src/configure-app.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

const MARCA = `e2e-attachments-${Date.now()}`;

// Imagens mínimas, válidas pela assinatura — o que a API verifica.
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 1)]);
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64, 2),
]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x40, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP', 'ascii'),
  Buffer.alloc(64, 3),
]);

describe('Anexos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const gravadosEmDisco: string[] = [];

  async function novaOcorrencia(): Promise<string> {
    const { body } = await request(app.getHttpServer())
      .post('/api/v1/reports')
      .send({
        category: 'RISK_ALERT',
        type: 'DANGEROUS_TREE',
        description: `Árvore inclinada sobre a calçada. ${MARCA}`,
        address: 'Rua das Palmeiras, 120',
        district: 'Centro',
      })
      .expect(201);

    return body.id;
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
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    const reports = await prisma.report.findMany({
      where: { description: { contains: MARCA } },
      select: { id: true, attachments: { select: { storedPath: true } } },
    });

    for (const r of reports) {
      for (const a of r.attachments) gravadosEmDisco.push(a.storedPath);
    }

    await prisma.attachment.deleteMany({ where: { reportId: { in: reports.map((r) => r.id) } } });
    await prisma.report.deleteMany({ where: { id: { in: reports.map((r) => r.id) } } });

    // Os arquivos gravados no disco também saem: a suíte não deve deixar lixo em UPLOAD_DIR.
    const baseDir = resolve(process.env.UPLOAD_DIR ?? './uploads');
    for (const nome of gravadosEmDisco) {
      await rm(resolve(baseDir, nome), { force: true });
    }

    await app.close();
  });

  describe('POST /reports/:id/attachments', () => {
    it('aceita os três formatos e devolve id, nome e URL (RF-API-17, RF-API-21)', async () => {
      const id = await novaOcorrencia();

      const { body } = await request(app.getHttpServer())
        .post(`/api/v1/reports/${id}/attachments`)
        .attach('files', JPEG, 'arvore.jpg')
        .attach('files', PNG, 'calcada.png')
        .attach('files', WEBP, 'muro.webp')
        .expect(201);

      expect(body).toHaveLength(3);
      for (const anexo of body) {
        expect(anexo).toEqual({
          id: expect.any(String),
          fileName: expect.any(String),
          url: `/api/v1/attachments/${anexo.id}`,
        });
      }
    });

    it('grava o tipo detectado pelo conteúdo, ignorando o nome e o Content-Type enviados', async () => {
      const id = await novaOcorrencia();

      const { body } = await request(app.getHttpServer())
        .post(`/api/v1/reports/${id}/attachments`)
        // Um PNG apresentado como .jpg e image/jpeg.
        .attach('files', PNG, { filename: 'disfarcado.jpg', contentType: 'image/jpeg' })
        .expect(201);

      const gravado = await prisma.attachment.findUniqueOrThrow({
        where: { id: body[0].id },
        select: { mimeType: true, fileName: true, storedPath: true, sizeInBytes: true },
      });

      expect(gravado.mimeType).toBe('image/png');
      expect(gravado.fileName).toBe('disfarcado.jpg');
      // O nome no disco é gerado pela aplicação (RNF-API-14).
      expect(gravado.storedPath).toMatch(/^[0-9a-f-]{36}\.png$/);
      expect(gravado.sizeInBytes).toBe(PNG.length);
    });

    it('recusa .txt renomeado para .jpg (RNF-API-13)', async () => {
      const id = await novaOcorrencia();

      const { body } = await request(app.getHttpServer())
        .post(`/api/v1/reports/${id}/attachments`)
        .attach('files', Buffer.from('isto é um texto, não uma imagem'), {
          filename: 'malicioso.jpg',
          contentType: 'image/jpeg',
        })
        .expect(400);

      expect(JSON.stringify(body.message)).toContain('malicioso.jpg');
      expect(await prisma.attachment.count({ where: { reportId: id } })).toBe(0);
    });

    it('recusa formato de imagem não aceito, como GIF', async () => {
      const id = await novaOcorrencia();

      await request(app.getHttpServer())
        .post(`/api/v1/reports/${id}/attachments`)
        .attach('files', Buffer.from('GIF89a........', 'ascii'), 'animado.gif')
        .expect(400);
    });

    it('não grava nenhum arquivo quando um do lote é recusado', async () => {
      const id = await novaOcorrencia();

      await request(app.getHttpServer())
        .post(`/api/v1/reports/${id}/attachments`)
        .attach('files', JPEG, 'boa.jpg')
        .attach('files', Buffer.from('texto'), 'ruim.jpg')
        .expect(400);

      expect(await prisma.attachment.count({ where: { reportId: id } })).toBe(0);
    });

    it('recusa o sexto arquivo da requisição (RF-API-17)', async () => {
      const id = await novaOcorrencia();

      let envio = request(app.getHttpServer()).post(`/api/v1/reports/${id}/attachments`);
      for (let i = 0; i < 6; i += 1) envio = envio.attach('files', JPEG, `f${i}.jpg`);

      const { status } = await envio;
      expect(status).toBe(400);
      expect(await prisma.attachment.count({ where: { reportId: id } })).toBe(0);
    });

    it('recusa requisição sem arquivo', async () => {
      const id = await novaOcorrencia();

      await request(app.getHttpServer()).post(`/api/v1/reports/${id}/attachments`).expect(400);
    });

    it('responde 404 para ocorrência inexistente e 400 para id não-UUID', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/reports/6f1c4a7e-0000-4000-8000-000000000000/attachments')
        .attach('files', JPEG, 'a.jpg')
        .expect(404);

      await request(app.getHttpServer())
        .post('/api/v1/reports/nao-e-uuid/attachments')
        .attach('files', JPEG, 'a.jpg')
        .expect(400);
    });

    it('responde 409 depois de a ocorrência sair de RECEIVED (RF-API-69)', async () => {
      const id = await novaOcorrencia();
      await prisma.report.update({ where: { id }, data: { status: 'IN_PROGRESS' } });

      const { body } = await request(app.getHttpServer())
        .post(`/api/v1/reports/${id}/attachments`)
        .attach('files', JPEG, 'tardio.jpg')
        .expect(409);

      expect(body).toMatchObject({ statusCode: 409, error: 'Conflict' });
    });
  });

  describe('GET /attachments/:id', () => {
    it('devolve o conteúdo com o Content-Type correto, sem autenticação (RF-API-22)', async () => {
      const id = await novaOcorrencia();
      const { body: anexos } = await request(app.getHttpServer())
        .post(`/api/v1/reports/${id}/attachments`)
        .attach('files', PNG, 'calcada.png')
        .expect(201);

      const resposta = await request(app.getHttpServer())
        .get(`/api/v1/attachments/${anexos[0].id}`)
        .expect(200);

      expect(resposta.headers['content-type']).toContain('image/png');
      expect(resposta.headers['content-disposition']).toContain('calcada.png');
      expect(Buffer.from(resposta.body)).toEqual(PNG);
    });

    it('a URL devolvida no envio é a que serve o conteúdo', async () => {
      const id = await novaOcorrencia();
      const { body: anexos } = await request(app.getHttpServer())
        .post(`/api/v1/reports/${id}/attachments`)
        .attach('files', JPEG, 'arvore.jpg')
        .expect(201);

      await request(app.getHttpServer()).get(anexos[0].url).expect(200);
    });

    it('responde 404 para anexo inexistente e 400 para id não-UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/attachments/6f1c4a7e-0000-4000-8000-000000000000')
        .expect(404);
      await request(app.getHttpServer()).get('/api/v1/attachments/nao-e-uuid').expect(400);
    });
  });

  describe('integração com a consulta por protocolo', () => {
    it('os anexos aparecem na consulta pública, com a URL da API', async () => {
      const { body: criada } = await request(app.getHttpServer())
        .post('/api/v1/reports')
        .send({
          category: 'RISK_ALERT',
          type: 'FALLEN_POLE',
          description: `Poste caído na esquina, fiação exposta. ${MARCA}`,
          address: 'Rua Teste, 50',
          district: 'Centro',
        })
        .expect(201);

      const { body: anexos } = await request(app.getHttpServer())
        .post(`/api/v1/reports/${criada.id}/attachments`)
        .attach('files', JPEG, 'poste.jpg')
        .expect(201);

      const { body: publica } = await request(app.getHttpServer())
        .get(`/api/v1/reports/protocol/${criada.protocolNumber}`)
        .expect(200);

      expect(publica.attachments).toEqual([
        { id: anexos[0].id, url: `/api/v1/attachments/${anexos[0].id}` },
      ]);
      // Nem o nome do arquivo escapa na consulta pública: ele pode conter dado do cidadão.
      expect(JSON.stringify(publica)).not.toContain('poste.jpg');
    });
  });

  it('não deixa arquivo órfão em UPLOAD_DIR quando o envio é recusado', async () => {
    const baseDir = resolve(process.env.UPLOAD_DIR ?? './uploads');
    const antes = await readdir(baseDir).catch(() => []);

    const id = await novaOcorrencia();
    await request(app.getHttpServer())
      .post(`/api/v1/reports/${id}/attachments`)
      .attach('files', Buffer.from('texto'), 'ruim.jpg')
      .expect(400);

    expect(await readdir(baseDir).catch(() => [])).toEqual(antes);
  });
});
