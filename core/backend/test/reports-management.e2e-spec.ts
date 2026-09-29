import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { hashPassword } from './../src/common/password.js';
import { configureApp, useNotFoundFallback } from './../src/configure-app.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

const MARCA = `e2e-gestao-${Date.now()}`;
const SENHA = 'senha-de-teste-123';
const email = (quem: string) => `${MARCA}-${quem}@exemplo.test`;

describe('Gestão de ocorrências (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: string;
  let coord: string;
  let agente: string;
  let outroAgente: string;
  let idAgente: string;
  let idOutroAgente: string;

  async function criarAgente(quem: string, role: 'ADMIN' | 'COORDINATOR' | 'AGENT') {
    const criado = await prisma.agent.create({
      data: { name: `Agente ${quem}`, email: email(quem), passwordHash: await hashPassword(SENHA), role },
      select: { id: true },
    });

    const { body } = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: email(quem), password: SENHA })
      .expect(200);

    return { id: criado.id, token: body.accessToken as string };
  }

  async function novaOcorrencia(extra: Record<string, unknown> = {}): Promise<string> {
    const { body } = await request(app.getHttpServer())
      .post('/api/v1/reports')
      .send({
        category: 'RISK_ALERT',
        type: 'DANGEROUS_TREE',
        description: `Árvore inclinada sobre a calçada. ${MARCA}`,
        address: 'Rua das Palmeiras, 120',
        district: 'Centro',
        ...extra,
      })
      .expect(201);

    return body.id;
  }

  /** Ocorrência levada até IN_PROGRESS pela triagem, como no fluxo real. */
  async function emAtendimento(): Promise<string> {
    const id = await novaOcorrencia();
    await request(app.getHttpServer())
      .patch(`/api/v1/reports/${id}/triage/start`)
      .set('Authorization', `Bearer ${coord}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/reports/${id}/triage`)
      .set('Authorization', `Bearer ${coord}`)
      .send({ outcome: 'ACCEPT', priority: 'HIGH' })
      .expect(200);
    return id;
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

    admin = (await criarAgente('admin', 'ADMIN')).token;
    coord = (await criarAgente('coord', 'COORDINATOR')).token;
    const a = await criarAgente('agente', 'AGENT');
    agente = a.token;
    idAgente = a.id;
    const b = await criarAgente('outro', 'AGENT');
    outroAgente = b.token;
    idOutroAgente = b.id;
  });

  afterAll(async () => {
    const reports = await prisma.report.findMany({
      where: { description: { contains: MARCA } },
      select: { id: true },
    });
    const ids = reports.map((r) => r.id);
    await prisma.reportUpdate.deleteMany({ where: { reportId: { in: ids } } });
    await prisma.report.deleteMany({ where: { id: { in: ids } } });
    await prisma.agent.deleteMany({ where: { email: { startsWith: MARCA } } });
    await app.close();
  });

  describe('GET /reports', () => {
    it('exige autenticação e devolve envelope paginado (RF-API-33)', async () => {
      await request(app.getHttpServer()).get('/api/v1/reports').expect(401);

      const { body } = await request(app.getHttpServer())
        .get('/api/v1/reports')
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      expect(body).toMatchObject({ page: 1, pageSize: 20, total: expect.any(Number) });
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('filtra por situação, tipo e bairro, combinando os critérios (RF-API-32)', async () => {
      await novaOcorrencia({ type: 'FLOODING', district: 'Vila Nova' });

      const { body } = await request(app.getHttpServer())
        .get('/api/v1/reports?status=RECEIVED&type=FLOODING&district=Vila Nova')
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      expect(body.data.length).toBeGreaterThan(0);
      for (const r of body.data) {
        expect(r.status).toBe('RECEIVED');
        expect(r.type).toBe('FLOODING');
      }
    });

    it('busca por protocolo', async () => {
      const id = await novaOcorrencia();
      const { protocolNumber } = await prisma.report.findUniqueOrThrow({
        where: { id },
        select: { protocolNumber: true },
      });

      const { body } = await request(app.getHttpServer())
        .get(`/api/v1/reports?search=${protocolNumber}`)
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0].protocolNumber).toBe(protocolNumber);
    });

    it('recusa filtro com valor fora da enumeração', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/reports?status=INVENTADO')
        .set('Authorization', `Bearer ${agente}`)
        .expect(400);
    });

    it('filtra apenas as ocorrências em aberto (RF-API-73)', async () => {
      const aberta = await novaOcorrencia();
      const encerrada = await emAtendimento();
      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${encerrada}/status`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ status: 'CANCELLED', comment: 'Duplicada de outro registro.' })
        .expect(200);

      const { body } = await request(app.getHttpServer())
        .get(`/api/v1/reports?pageSize=100&search=${MARCA}&open=true`)
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      const ids = body.data.map((r: { id: string }) => r.id);
      expect(ids).toContain(aberta);
      expect(ids).not.toContain(encerrada);
      for (const r of body.data) {
        expect(['RECEIVED', 'TRIAGE', 'IN_PROGRESS']).toContain(r.status);
      }
    });

    it('dá precedência ao status explícito sobre open', async () => {
      const id = await emAtendimento();
      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/status`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ status: 'RESOLVED', comment: 'Concluída.' })
        .expect(200);

      // Recorte contraditório: o mais específico vence, como no mapa.
      const { body } = await request(app.getHttpServer())
        .get(`/api/v1/reports?pageSize=100&search=${MARCA}&open=true&status=RESOLVED`)
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      expect(body.data.length).toBeGreaterThan(0);
      for (const r of body.data) expect(r.status).toBe('RESOLVED');
    });

    it('recusa open com valor que não seja true ou false', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/reports?open=talvez')
        .set('Authorization', `Bearer ${agente}`)
        .expect(400);
    });

    it('não devolve a descrição na listagem, que é enxuta', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/reports')
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      expect(body.data[0]).not.toHaveProperty('description');
    });

    describe('ordenação (RF-API-71)', () => {
      /** Protocolos da listagem, na ordem em que a API os devolveu. */
      async function listar(query: string): Promise<string[]> {
        const { body } = await request(app.getHttpServer())
          .get(`/api/v1/reports?pageSize=100&search=${MARCA}&${query}`)
          .set('Authorization', `Bearer ${agente}`)
          .expect(200);
        return body.data.map((r: { protocolNumber: string }) => r.protocolNumber);
      }

      it('ordena da mais recente para a mais antiga por padrão', async () => {
        await novaOcorrencia();
        await novaOcorrencia();

        const { body } = await request(app.getHttpServer())
          .get(`/api/v1/reports?pageSize=100&search=${MARCA}`)
          .set('Authorization', `Bearer ${agente}`)
          .expect(200);

        const datas = body.data.map((r: { createdAt: string }) => Date.parse(r.createdAt));
        expect(datas).toEqual([...datas].sort((a, b) => b - a));
      });

      it('inverte a ordem da data quando pedido', async () => {
        const decrescente = await listar('sort=createdAt&order=desc');
        const crescente = await listar('sort=createdAt&order=asc');

        expect(crescente).toEqual([...decrescente].reverse());
      });

      it('ordena por prioridade, da mais alta para a mais baixa', async () => {
        await emAtendimento(); // HIGH
        const critica = await novaOcorrencia();
        await request(app.getHttpServer())
          .patch(`/api/v1/reports/${critica}/triage/start`)
          .set('Authorization', `Bearer ${coord}`)
          .expect(200);
        await request(app.getHttpServer())
          .patch(`/api/v1/reports/${critica}/triage`)
          .set('Authorization', `Bearer ${coord}`)
          .send({ outcome: 'ACCEPT', priority: 'CRITICAL' })
          .expect(200);

        const { body } = await request(app.getHttpServer())
          .get(`/api/v1/reports?pageSize=100&search=${MARCA}&sort=priority&order=desc`)
          .set('Authorization', `Bearer ${agente}`)
          .expect(200);

        const ordem = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
        const postos = body.data
          .filter((r: { priority: string | null }) => r.priority !== null)
          .map((r: { priority: string }) => ordem.indexOf(r.priority));

        expect(postos).toEqual([...postos].sort((a, b) => a - b));
      });

      it('mantém as ocorrências sem prioridade no fim, nas duas direções', async () => {
        for (const order of ['desc', 'asc']) {
          const { body } = await request(app.getHttpServer())
            .get(`/api/v1/reports?pageSize=100&search=${MARCA}&sort=priority&order=${order}`)
            .set('Authorization', `Bearer ${agente}`)
            .expect(200);

          const semPrioridade: boolean[] = body.data.map(
            (r: { priority: string | null }) => r.priority === null,
          );
          const primeiraSemPrioridade = semPrioridade.indexOf(true);
          const depoisDela =
            primeiraSemPrioridade === -1 ? [] : semPrioridade.slice(primeiraSemPrioridade);

          // Nenhuma ocorrência classificada aparece depois de uma sem classificação.
          expect(depoisDela).not.toContain(false);
        }
      });

      it('pagina de forma estável, sem repetir nem pular ocorrências', async () => {
        // O desempate por id é o que garante isto quando há empate de prioridade.
        const pagina = async (page: number) => {
          const { body } = await request(app.getHttpServer())
            .get(`/api/v1/reports?pageSize=3&page=${page}&search=${MARCA}&sort=priority&order=desc`)
            .set('Authorization', `Bearer ${agente}`)
            .expect(200);
          return body.data.map((r: { id: string }) => r.id);
        };

        const todas = [...(await pagina(1)), ...(await pagina(2)), ...(await pagina(3))];
        expect(new Set(todas).size).toBe(todas.length);
      });

      it('recusa campo de ordenação fora da lista branca', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/reports?sort=description')
          .set('Authorization', `Bearer ${agente}`)
          .expect(400);

        await request(app.getHttpServer())
          .get('/api/v1/reports?sort=createdAt&order=aleatoria')
          .set('Authorization', `Bearer ${agente}`)
          .expect(400);
      });
    });
  });

  describe('GET /reports/:id', () => {
    it('devolve o detalhe com cidadão, histórico e anexos (RF-API-34)', async () => {
      const id = await novaOcorrencia({
        citizen: { name: 'Maria Silva', email: 'maria@exemplo.com' },
      });

      const { body } = await request(app.getHttpServer())
        .get(`/api/v1/reports/${id}`)
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      expect(body.description).toContain(MARCA);
      expect(body.citizen).toMatchObject({ name: 'Maria Silva', email: 'maria@exemplo.com' });
      expect(body.updates).toEqual([]);
      expect(body.attachments).toEqual([]);
    });

    it('sugere prioridade alta nos tipos de risco imediato à vida (RF-API-36)', async () => {
      const urgente = await novaOcorrencia({ type: 'FIRE' });
      const comum = await novaOcorrencia({ type: 'BLOCKED_DRAINAGE' });

      const a = await request(app.getHttpServer())
        .get(`/api/v1/reports/${urgente}`)
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);
      const b = await request(app.getHttpServer())
        .get(`/api/v1/reports/${comum}`)
        .set('Authorization', `Bearer ${agente}`)
        .expect(200);

      expect(a.body.suggestedPriority).toBe('HIGH');
      expect(b.body.suggestedPriority).toBeNull();
    });

    it('responde 404 para ocorrência inexistente', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/reports/6f1c4a7e-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${agente}`)
        .expect(404);
    });
  });

  describe('transições disponíveis no detalhe (RF-API-72)', () => {
    async function transicoesDe(id: string, token: string) {
      const { body } = await request(app.getHttpServer())
        .get(`/api/v1/reports/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      return body.availableTransitions as { to: string; owner: string; requiresComment: boolean }[];
    }

    it('oferece ao coordenador assumir a triagem de uma ocorrência recebida', async () => {
      const id = await novaOcorrencia();

      expect(await transicoesDe(id, coord)).toEqual([
        { to: 'TRIAGE', owner: 'triage/start', requiresComment: false },
      ]);
    });

    it('não oferece a triagem ao agente comum', async () => {
      const id = await novaOcorrencia();

      expect(await transicoesDe(id, agente)).toEqual([]);
    });

    it('oferece concluir e cancelar ao responsável, e nada a outro agente', async () => {
      const id = await emAtendimento();
      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/assign`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ assignedToId: idAgente })
        .expect(200);

      const doResponsavel = await transicoesDe(id, agente);
      expect(doResponsavel.map((t) => t.to).sort()).toEqual(['CANCELLED', 'RESOLVED']);
      expect(doResponsavel.every((t) => t.requiresComment)).toBe(true);

      expect(await transicoesDe(id, outroAgente)).toEqual([]);
    });

    /**
     * A propriedade que o Portal de Operações apoia: ele oferece exatamente o
     * que vem deste campo. Se a API aceitasse algo fora da lista, ou recusasse
     * algo dentro dela, a tela ofereceria um botão que não funciona — ou
     * esconderia uma ação legítima.
     */
    it('o que é oferecido é aceito, e o que não é oferecido é recusado', async () => {
      const id = await emAtendimento();
      const oferecidas = await transicoesDe(id, outroAgente);
      expect(oferecidas).toEqual([]);

      // Não oferecida ao agente que não é o responsável — e recusada.
      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/status`)
        .set('Authorization', `Bearer ${outroAgente}`)
        .send({ status: 'RESOLVED', comment: 'Tentativa de quem não é responsável.' })
        .expect(403);

      // Oferecida ao coordenador — e aceita.
      const doCoord = await transicoesDe(id, coord);
      expect(doCoord.map((t) => t.to).sort()).toEqual(['CANCELLED', 'RESOLVED']);

      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/status`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ status: 'RESOLVED', comment: 'Vistoria concluída no local.' })
        .expect(200);

      // Situação final: nada mais a oferecer.
      expect(await transicoesDe(id, coord)).toEqual([]);
    });

    it('não devolve assignedToId solto — o responsável já vem em assignedTo', async () => {
      const id = await emAtendimento();
      const { body } = await request(app.getHttpServer())
        .get(`/api/v1/reports/${id}`)
        .set('Authorization', `Bearer ${coord}`)
        .expect(200);

      expect(body).not.toHaveProperty('assignedToId');
      expect(body).toHaveProperty('assignedTo');
    });
  });

  describe('triagem em duas etapas', () => {
    it('leva RECEIVED a TRIAGE e depois a IN_PROGRESS (RF-API-60, RF-API-35)', async () => {
      const id = await novaOcorrencia();

      const assumida = await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/triage/start`)
        .set('Authorization', `Bearer ${coord}`)
        .expect(200);
      expect(assumida.body.status).toBe('TRIAGE');

      const concluida = await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/triage`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ outcome: 'ACCEPT', priority: 'CRITICAL', type: 'FALLEN_POLE' })
        .expect(200);

      expect(concluida.body).toMatchObject({
        status: 'IN_PROGRESS',
        priority: 'CRITICAL',
        type: 'FALLEN_POLE',
      });
    });

    it('declara improcedente a partir de TRIAGE, exigindo comentário (RF-API-66)', async () => {
      const id = await novaOcorrencia();
      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/triage/start`)
        .set('Authorization', `Bearer ${coord}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/triage`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ outcome: 'REJECT' })
        .expect(400);

      const { body } = await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/triage`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ outcome: 'REJECT', comment: 'Vistoria não confirmou o risco relatado.' })
        .expect(200);

      expect(body.status).toBe('REJECTED');
    });

    it('exige priority ao encaminhar', async () => {
      const id = await novaOcorrencia();
      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/triage/start`)
        .set('Authorization', `Bearer ${coord}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/triage`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ outcome: 'ACCEPT' })
        .expect(400);
    });

    it('recusa concluir a triagem de ocorrência que não está em TRIAGE', async () => {
      const id = await novaOcorrencia();

      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/triage`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ outcome: 'ACCEPT', priority: 'LOW' })
        .expect(400);
    });

    it('recusa assumir a triagem duas vezes', async () => {
      const id = await novaOcorrencia();
      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/triage/start`)
        .set('Authorization', `Bearer ${coord}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/triage/start`)
        .set('Authorization', `Bearer ${coord}`)
        .expect(400);
    });

    it('responde 403 ao perfil AGENT (RF-API-35)', async () => {
      const id = await novaOcorrencia();

      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/triage/start`)
        .set('Authorization', `Bearer ${agente}`)
        .expect(403);
    });
  });

  describe('atribuição de responsável', () => {
    it('lista agentes atribuíveis com id e nome, ao coordenador (RF-API-61)', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/reports/assignable-agents')
        .set('Authorization', `Bearer ${coord}`)
        .expect(200);

      expect(body.length).toBeGreaterThan(0);
      expect(Object.keys(body[0]).sort()).toEqual(['id', 'name']);
      expect(JSON.stringify(body)).not.toContain('@');
    });

    it('responde 403 ao perfil AGENT na lista de atribuíveis', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/reports/assignable-agents')
        .set('Authorization', `Bearer ${agente}`)
        .expect(403);
    });

    it('atribui e registra a troca no histórico (RF-API-37)', async () => {
      const id = await emAtendimento();

      const { body } = await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/assign`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ assignedToId: idAgente })
        .expect(200);

      expect(body.assignedTo).toMatchObject({ id: idAgente });

      const detalhe = await request(app.getHttpServer())
        .get(`/api/v1/reports/${id}`)
        .set('Authorization', `Bearer ${coord}`)
        .expect(200);

      expect(JSON.stringify(detalhe.body.updates)).toContain('Responsável definido');
    });

    it('recusa agente inativo (RF-API-38)', async () => {
      const id = await emAtendimento();
      const inativo = await prisma.agent.create({
        data: {
          name: 'Inativo',
          email: email('inativo'),
          passwordHash: await hashPassword(SENHA),
          role: 'AGENT',
          active: false,
        },
        select: { id: true },
      });

      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/assign`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ assignedToId: inativo.id })
        .expect(400);
    });
  });

  describe('mudança de situação', () => {
    it('conclui a ocorrência, preenchendo resolvedAt (RF-API-41)', async () => {
      const id = await emAtendimento();

      const { body } = await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/status`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ status: 'RESOLVED', comment: 'Árvore removida pela equipe de campo.' })
        .expect(200);

      expect(body.status).toBe('RESOLVED');

      const gravada = await prisma.report.findUniqueOrThrow({
        where: { id },
        select: { resolvedAt: true },
      });
      expect(gravada.resolvedAt).not.toBeNull();
    });

    it('exige comentário ao concluir e ao cancelar (RF-API-40)', async () => {
      const id = await emAtendimento();

      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/status`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ status: 'RESOLVED' })
        .expect(400);
    });

    it('recusa transição fora da tabela (RF-API-39)', async () => {
      const id = await novaOcorrencia();

      // RECEIVED direto para RESOLVED não existe no ciclo de vida.
      const { body } = await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/status`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ status: 'RESOLVED', comment: 'tentativa indevida' })
        .expect(400);

      expect(body.message).toContain('RECEIVED');
    });

    it('recusa reabrir ocorrência já concluída', async () => {
      const id = await emAtendimento();
      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/status`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ status: 'RESOLVED', comment: 'concluída' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/status`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ status: 'CANCELLED', comment: 'tentativa de reabrir' })
        .expect(400);
    });

    it('o agente só altera a ocorrência que lhe foi atribuída (RF-API-68)', async () => {
      const id = await emAtendimento();
      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/assign`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ assignedToId: idAgente })
        .expect(200);

      // O outro agente não é o responsável.
      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/status`)
        .set('Authorization', `Bearer ${outroAgente}`)
        .send({ status: 'RESOLVED', comment: 'não sou o responsável' })
        .expect(403);

      // O responsável consegue.
      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/status`)
        .set('Authorization', `Bearer ${agente}`)
        .send({ status: 'RESOLVED', comment: 'atendimento concluído' })
        .expect(200);
    });

    it('coordenador e administrador atuam em ocorrência de qualquer responsável', async () => {
      const id = await emAtendimento();
      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/assign`)
        .set('Authorization', `Bearer ${coord}`)
        .send({ assignedToId: idOutroAgente })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${id}/status`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ status: 'CANCELLED', comment: 'cancelada pela administração' })
        .expect(200);
    });
  });

  describe('histórico', () => {
    it('grava autor, transição e data a cada mudança (RNF-API-45)', async () => {
      const id = await emAtendimento();

      const { body } = await request(app.getHttpServer())
        .get(`/api/v1/reports/${id}`)
        .set('Authorization', `Bearer ${coord}`)
        .expect(200);

      expect(body.updates).toHaveLength(2);
      expect(body.updates[0]).toMatchObject({
        fromStatus: 'RECEIVED',
        toStatus: 'TRIAGE',
        agent: { name: 'Agente coord' },
      });
      expect(body.updates[1]).toMatchObject({ fromStatus: 'TRIAGE', toStatus: 'IN_PROGRESS' });
    });

    it('acrescenta observação com visibilidade escolhida (RF-API-43)', async () => {
      const id = await emAtendimento();

      const { body } = await request(app.getHttpServer())
        .post(`/api/v1/reports/${id}/updates`)
        .set('Authorization', `Bearer ${agente}`)
        .send({ comment: 'Equipe acionada para vistoria.', visibleToCitizen: true })
        .expect(201);

      expect(body).toMatchObject({
        comment: 'Equipe acionada para vistoria.',
        visibleToCitizen: true,
        agent: { name: 'Agente agente' },
      });
    });

    it('trata a observação como interna quando a visibilidade não é informada', async () => {
      const id = await emAtendimento();

      const { body } = await request(app.getHttpServer())
        .post(`/api/v1/reports/${id}/updates`)
        .set('Authorization', `Bearer ${agente}`)
        .send({ comment: 'Anotação interna.' })
        .expect(201);

      expect(body.visibleToCitizen).toBe(false);
    });

    it('a observação interna não aparece na consulta pública (RF-API-15)', async () => {
      const id = await emAtendimento();
      const { protocolNumber } = await prisma.report.findUniqueOrThrow({
        where: { id },
        select: { protocolNumber: true },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/reports/${id}/updates`)
        .set('Authorization', `Bearer ${agente}`)
        .send({ comment: 'SEGREDO-INTERNO', visibleToCitizen: false })
        .expect(201);

      const { body } = await request(app.getHttpServer())
        .get(`/api/v1/reports/protocol/${protocolNumber}`)
        .expect(200);

      expect(JSON.stringify(body)).not.toContain('SEGREDO-INTERNO');
      // E o nome do agente nunca aparece, mesmo nos andamentos visíveis.
      expect(JSON.stringify(body)).not.toContain('Agente');
    });
  });
});
