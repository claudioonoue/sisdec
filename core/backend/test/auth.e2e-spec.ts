import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { hashPassword } from './../src/common/password.js';
import { configureApp, useNotFoundFallback } from './../src/configure-app.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

/**
 * Prefixo exclusivo desta suíte. Permite limpar exatamente o que ela criou,
 * sem depender do estado do banco nem atrapalhar os dados do seed (RNF-API-37).
 */
const PREFIXO = `e2e-auth-${Date.now()}`;
const SENHA = 'senha-de-teste-123';
const email = (quem: string) => `${PREFIXO}-${quem}@exemplo.test`;

describe('Autenticação e agentes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenAdmin: string;
  let tokenAgente: string;
  let idAdmin: string;

  async function criarAgente(quem: string, role: 'ADMIN' | 'COORDINATOR' | 'AGENT') {
    return prisma.agent.create({
      data: {
        name: `Agente ${quem}`,
        email: email(quem),
        passwordHash: await hashPassword(SENHA),
        role,
      },
      select: { id: true, email: true },
    });
  }

  async function logar(quem: string): Promise<string> {
    const { body } = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: email(quem), password: SENHA })
      .expect(200);

    return body.accessToken;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // O limite de requisições tem suíte própria (throttling.e2e-spec.ts). Aqui
      // ele é desligado: esta suíte faz mais logins do que o limite permite, e
      // afrouxá-lo em produção para acomodar teste seria o compromisso errado.
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
    useNotFoundFallback(app);
    prisma = app.get(PrismaService);

    const admin = await criarAgente('admin', 'ADMIN');
    idAdmin = admin.id;
    await criarAgente('agente', 'AGENT');

    tokenAdmin = await logar('admin');
    tokenAgente = await logar('agente');
  });

  afterAll(async () => {
    await prisma.agent.deleteMany({ where: { email: { startsWith: PREFIXO } } });
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('devolve token e os dados do agente, sem passwordHash', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: email('admin'), password: SENHA })
        .expect(200);

      expect(body.accessToken).toEqual(expect.any(String));
      expect(body.agent).toMatchObject({ email: email('admin'), role: 'ADMIN' });
      expect(JSON.stringify(body)).not.toContain('passwordHash');
    });

    it('aceita o e-mail com qualquer caixa', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: email('admin').toUpperCase(), password: SENHA })
        .expect(200);
    });

    it('responde 401 sem distinguir senha errada de e-mail inexistente (RF-API-26)', async () => {
      const senhaErrada = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: email('admin'), password: 'errada' })
        .expect(401);

      const inexistente = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: email('nao-existe'), password: SENHA })
        .expect(401);

      expect(senhaErrada.body.message).toBe(inexistente.body.message);
    });

    it('recusa corpo inválido com 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nao-e-email', password: '' })
        .expect(400);
    });
  });

  describe('GET /auth/me', () => {
    it('devolve o agente autenticado', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(body).toEqual({
        id: idAdmin,
        name: 'Agente admin',
        email: email('admin'),
        role: 'ADMIN',
      });
    });

    it('responde 401 sem token e com token inválido (RF-API-30)', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer nao-e-um-token')
        .expect(401);
    });
  });

  describe('autorização por perfil', () => {
    it('rotas públicas seguem acessíveis sem token', async () => {
      await request(app.getHttpServer()).get('/api/v1/health').expect(200);
      await request(app.getHttpServer()).get('/api/v1/metadata').expect(200);
      await request(app.getHttpServer()).get('/api/v1/report-types').expect(200);
    });

    it('GET /metadata/internal exige token e aceita qualquer perfil (RF-API-63)', async () => {
      await request(app.getHttpServer()).get('/api/v1/metadata/internal').expect(401);

      const { body } = await request(app.getHttpServer())
        .get('/api/v1/metadata/internal')
        .set('Authorization', `Bearer ${tokenAgente}`)
        .expect(200);

      expect(body.priorities).toHaveLength(4);
      expect(body.agentRoles).toHaveLength(3);
    });

    it('GET /agents responde 403 ao perfil AGENT e 200 ao ADMIN (RF-API-31)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/agents')
        .set('Authorization', `Bearer ${tokenAgente}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/agents')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
    });
  });

  describe('gestão de agentes', () => {
    it('cadastra agente normalizando o e-mail e sem devolver passwordHash', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/v1/agents')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          name: 'Novo Coordenador',
          email: email('coord').toUpperCase(),
          password: SENHA,
          role: 'COORDINATOR',
        })
        .expect(201);

      expect(body.email).toBe(email('coord'));
      expect(body.active).toBe(true);
      expect(body).not.toHaveProperty('passwordHash');
    });

    it('responde 409 ao repetir o e-mail (RF-API-47)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/agents')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ name: 'Outro', email: email('coord'), password: SENHA, role: 'AGENT' })
        .expect(409);
    });

    it('nenhum item da listagem traz passwordHash (RNF-API-08)', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/agents')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(JSON.stringify(body)).not.toContain('passwordHash');
      expect(body).toMatchObject({ page: 1, pageSize: 20 });
    });

    it('recusa pageSize acima do teto (RNF-API-03)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/agents?pageSize=101')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(400);
    });

    it('impede o administrador de desativar a própria conta', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/agents/${idAdmin}/deactivate`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(403);
    });

    it('desativa o agente e revoga o token já emitido na mesma hora', async () => {
      const alvo = await prisma.agent.findUniqueOrThrow({
        where: { email: email('agente') },
        select: { id: true },
      });

      // O token ainda funciona antes da desativação.
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenAgente}`)
        .expect(200);

      const { body } = await request(app.getHttpServer())
        .patch(`/api/v1/agents/${alvo.id}/deactivate`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(body.active).toBe(false);

      // E deixa de funcionar imediatamente, sem esperar a expiração.
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenAgente}`)
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: email('agente'), password: SENHA })
        .expect(401);
    });

    it('responde 404 ao alterar agente inexistente', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/agents/6f1c4a7e-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ name: 'X' })
        .expect(404);
    });

    it('responde 400 quando o id não é UUID', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/agents/nao-e-uuid')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ name: 'X' })
        .expect(400);
    });
  });
});
