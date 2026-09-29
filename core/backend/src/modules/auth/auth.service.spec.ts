import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { hashPassword } from '../../common/password.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

const SENHA = 'senha-do-agente';

async function agenteAtivo(extra: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    name: 'Ana Souza',
    email: 'ana@exemplo.gov.br',
    role: 'COORDINATOR' as const,
    active: true,
    passwordHash: await hashPassword(SENHA),
    ...extra,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let findUnique: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    findUnique = vi.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: { agent: { findUnique } } },
        { provide: JwtService, useValue: { signAsync: vi.fn().mockResolvedValue('token-jwt') } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('login', () => {
    it('devolve token e dados do agente quando as credenciais conferem', async () => {
      findUnique.mockResolvedValue(await agenteAtivo());

      const resultado = await service.login({ email: 'ana@exemplo.gov.br', password: SENHA });

      expect(resultado.accessToken).toBe('token-jwt');
      expect(resultado.agent).toEqual({
        id: 'a1',
        name: 'Ana Souza',
        email: 'ana@exemplo.gov.br',
        role: 'COORDINATOR',
      });
    });

    it('nunca devolve o passwordHash (RNF-API-08)', async () => {
      findUnique.mockResolvedValue(await agenteAtivo());

      const resultado = await service.login({ email: 'ana@exemplo.gov.br', password: SENHA });

      expect(JSON.stringify(resultado)).not.toContain('passwordHash');
      expect(resultado.agent).not.toHaveProperty('passwordHash');
    });

    it('procura o e-mail em minúsculas', async () => {
      findUnique.mockResolvedValue(await agenteAtivo());

      await service.login({ email: 'ANA@Exemplo.Gov.BR', password: SENHA });

      expect(findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'ana@exemplo.gov.br' } }),
      );
    });

    it('usa a mesma mensagem para senha errada, e-mail inexistente e conta desativada (RF-API-26)', async () => {
      const mensagens: string[] = [];

      for (const agente of [
        await agenteAtivo(),
        null,
        await agenteAtivo({ active: false }),
      ]) {
        findUnique.mockResolvedValue(agente);
        const senha = agente === null || agente.active === false ? SENHA : 'errada';

        await service
          .login({ email: 'ana@exemplo.gov.br', password: senha })
          .catch((erro: UnauthorizedException) => mensagens.push(erro.message));
      }

      expect(mensagens).toHaveLength(3);
      expect(new Set(mensagens).size).toBe(1);
    });

    it('recusa agente desativado (RF-API-27)', async () => {
      findUnique.mockResolvedValue(await agenteAtivo({ active: false }));

      await expect(service.login({ email: 'ana@exemplo.gov.br', password: SENHA })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('resolveAgentFromToken', () => {
    const payload = { sub: 'a1', email: 'ana@exemplo.gov.br', role: 'COORDINATOR' as const };

    it('resolve o agente ativo', async () => {
      findUnique.mockResolvedValue({
        id: 'a1',
        name: 'Ana Souza',
        email: 'ana@exemplo.gov.br',
        role: 'COORDINATOR',
        active: true,
      });

      await expect(service.resolveAgentFromToken(payload)).resolves.toEqual({
        id: 'a1',
        name: 'Ana Souza',
        email: 'ana@exemplo.gov.br',
        role: 'COORDINATOR',
      });
    });

    it('recusa token de agente desativado depois da emissão — revogação imediata', async () => {
      findUnique.mockResolvedValue({
        id: 'a1',
        name: 'Ana Souza',
        email: 'ana@exemplo.gov.br',
        role: 'COORDINATOR',
        active: false,
      });

      await expect(service.resolveAgentFromToken(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('recusa token de agente que não existe mais', async () => {
      findUnique.mockResolvedValue(null);

      await expect(service.resolveAgentFromToken(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('não seleciona o passwordHash do banco', async () => {
      findUnique.mockResolvedValue({
        id: 'a1',
        name: 'Ana',
        email: 'a@b.c',
        role: 'AGENT',
        active: true,
      });

      await service.resolveAgentFromToken(payload);

      const { select } = findUnique.mock.calls[0][0];
      expect(select).not.toHaveProperty('passwordHash');
    });
  });
});
