import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AgentsService } from './agents.service.js';
import { AGENT_PUBLIC_SELECT } from './dto/agent-response.dto.js';

describe('AgentsService', () => {
  let service: AgentsService;
  let agent: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    agent = {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({ id: 'a1' }),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: 'a1' }),
      update: vi.fn().mockResolvedValue({ id: 'a1', active: false }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentsService, { provide: PrismaService, useValue: { agent } }],
    }).compile();

    service = module.get(AgentsService);
  });

  it('a seleção pública não inclui passwordHash (RNF-API-08)', () => {
    expect(AGENT_PUBLIC_SELECT).not.toHaveProperty('passwordHash');
  });

  describe('findAll', () => {
    it('pagina e seleciona apenas os campos públicos', async () => {
      const query = Object.assign(new PaginationQueryDto(), { page: 2, pageSize: 20 });

      await service.findAll(query);

      expect(agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ select: AGENT_PUBLIC_SELECT, skip: 20, take: 20 }),
      );
    });
  });

  describe('create', () => {
    const dto = {
      name: 'Ana',
      email: 'ANA@Exemplo.Gov.BR',
      password: 'senha-forte-123',
      role: 'COORDINATOR' as const,
    };

    it('grava o e-mail em minúsculas e a senha apenas como hash', async () => {
      await service.create(dto);

      const { data } = agent.create.mock.calls[0][0];
      expect(data.email).toBe('ana@exemplo.gov.br');
      expect(data).not.toHaveProperty('password');
      expect(data.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(data.passwordHash).not.toContain('senha-forte-123');
    });

    it('traduz a violação de unicidade em 409 (RF-API-47)', async () => {
      agent.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('não engole erros de outra natureza', async () => {
      agent.create.mockRejectedValue(new Error('conexão perdida'));

      await expect(service.create(dto)).rejects.toThrow('conexão perdida');
    });
  });

  describe('update', () => {
    it('só altera os campos informados', async () => {
      await service.update('a1', { name: 'Ana Maria' });

      const { data } = agent.update.mock.calls[0][0];
      expect(data).toEqual({ name: 'Ana Maria' });
    });

    it('substitui a senha por um novo hash quando informada', async () => {
      await service.update('a1', { password: 'outra-senha-123' });

      const { data } = agent.update.mock.calls[0][0];
      expect(data.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(data).not.toHaveProperty('password');
    });

    it('responde 404 quando o agente não existe', async () => {
      agent.findUnique.mockResolvedValue(null);

      await expect(service.update('inexistente', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('desativa em vez de excluir (RF-API-49)', async () => {
      await service.deactivate('a1', 'admin-1');

      expect(agent.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'a1' }, data: { active: false } }),
      );
    });

    it('impede o administrador de desativar a própria conta (RF-OP-54)', async () => {
      await expect(service.deactivate('admin-1', 'admin-1')).rejects.toThrow(ForbiddenException);
      expect(agent.update).not.toHaveBeenCalled();
    });

    it('responde 404 quando o agente não existe', async () => {
      agent.findUnique.mockResolvedValue(null);

      await expect(service.deactivate('inexistente', 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });
});
