import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ReportsManagementService } from './reports-management.service.js';

const COORD = { id: 'c1', name: 'Coord', email: 'c@x.y', role: 'COORDINATOR' as const };
const ADMIN = { id: 'ad1', name: 'Admin', email: 'a@x.y', role: 'ADMIN' as const };
const AGENTE = { id: 'ag1', name: 'Agente', email: 'g@x.y', role: 'AGENT' as const };
const OUTRO = { id: 'ag2', name: 'Outro', email: 'o@x.y', role: 'AGENT' as const };

describe('ReportsManagementService', () => {
  let service: ReportsManagementService;
  let report: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let reportUpdate: { create: ReturnType<typeof vi.fn> };
  let agent: { findUnique: ReturnType<typeof vi.fn> };

  /** Estado atual da ocorrência usada pelos testes. */
  function ocorrencia(status: string, assignedToId: string | null = null) {
    report.findUnique.mockResolvedValue({ id: 'r1', status, assignedToId });
  }

  beforeEach(async () => {
    report = { findUnique: vi.fn(), update: vi.fn().mockResolvedValue({ id: 'r1' }) };
    reportUpdate = { create: vi.fn().mockResolvedValue({ id: 'u1' }) };
    agent = { findUnique: vi.fn() };

    const prisma = {
      report,
      reportUpdate,
      agent,
      $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn({ report, reportUpdate })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsManagementService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ReportsManagementService);
  });

  describe('autorização por responsável (RF-API-68)', () => {
    it('recusa o agente que não é o responsável', async () => {
      ocorrencia('IN_PROGRESS', AGENTE.id);

      await expect(
        service.changeStatus('r1', { status: 'RESOLVED', comment: 'ok' } as never, OUTRO),
      ).rejects.toThrow(ForbiddenException);
      expect(report.update).not.toHaveBeenCalled();
    });

    it('aceita o agente responsável', async () => {
      ocorrencia('IN_PROGRESS', AGENTE.id);

      await service.changeStatus('r1', { status: 'RESOLVED', comment: 'ok' } as never, AGENTE);

      expect(report.update).toHaveBeenCalled();
    });

    it('recusa o agente quando a ocorrência não tem responsável', async () => {
      ocorrencia('IN_PROGRESS', null);

      await expect(
        service.changeStatus('r1', { status: 'RESOLVED', comment: 'ok' } as never, AGENTE),
      ).rejects.toThrow(ForbiddenException);
    });

    it('não aplica a restrição a coordenador e administrador', async () => {
      for (const quem of [COORD, ADMIN]) {
        ocorrencia('IN_PROGRESS', OUTRO.id);

        await service.changeStatus('r1', { status: 'CANCELLED', comment: 'ok' } as never, quem);
      }

      expect(report.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('transições (RF-API-39)', () => {
    it('recusa transição fora da tabela, dizendo o que seria possível', async () => {
      ocorrencia('RECEIVED');

      await expect(
        service.changeStatus('r1', { status: 'RESOLVED', comment: 'ok' } as never, COORD),
      ).rejects.toThrow(/RECEIVED/);
    });

    it('recusa mudar situação de ocorrência já encerrada', async () => {
      for (const final of ['RESOLVED', 'REJECTED', 'CANCELLED']) {
        ocorrencia(final);

        await expect(
          service.changeStatus('r1', { status: 'CANCELLED', comment: 'ok' } as never, ADMIN),
        ).rejects.toThrow(BadRequestException);
      }
    });

    it('exige comentário nas transições que encerram (RF-API-40)', async () => {
      ocorrencia('IN_PROGRESS');

      await expect(
        service.changeStatus('r1', { status: 'RESOLVED', comment: '   ' } as never, COORD),
      ).rejects.toThrow(/comment/);
    });

    it('recusa ao perfil sem permissão para aquela aresta', async () => {
      ocorrencia('RECEIVED');

      await expect(service.startTriage('r1', AGENTE)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('ponto único de mudança de situação (RF-API-42)', () => {
    it('grava a situação e o andamento na mesma transação (RNF-API-20)', async () => {
      ocorrencia('IN_PROGRESS', AGENTE.id);

      await service.changeStatus('r1', { status: 'RESOLVED', comment: 'feito' } as never, AGENTE);

      expect(reportUpdate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reportId: 'r1',
            agentId: AGENTE.id,
            fromStatus: 'IN_PROGRESS',
            toStatus: 'RESOLVED',
            comment: 'feito',
          }),
        }),
      );
    });

    it('preenche resolvedAt apenas na transição para RESOLVED (RF-API-41)', async () => {
      ocorrencia('IN_PROGRESS');
      await service.changeStatus('r1', { status: 'RESOLVED', comment: 'ok' } as never, COORD);
      expect(report.update.mock.calls[0][0].data.resolvedAt).toBeInstanceOf(Date);

      report.update.mockClear();
      ocorrencia('IN_PROGRESS');
      await service.changeStatus('r1', { status: 'CANCELLED', comment: 'ok' } as never, COORD);
      expect(report.update.mock.calls[0][0].data).not.toHaveProperty('resolvedAt');
    });

    it('responde 404 para ocorrência inexistente', async () => {
      report.findUnique.mockResolvedValue(null);

      await expect(service.startTriage('r9', COORD)).rejects.toThrow(NotFoundException);
    });
  });

  describe('triagem', () => {
    it('encaminha para IN_PROGRESS gravando tipo e prioridade', async () => {
      ocorrencia('TRIAGE');

      await service.concludeTriage(
        'r1',
        { outcome: 'ACCEPT', priority: 'HIGH', type: 'FIRE' } as never,
        COORD,
      );

      expect(report.update.mock.calls[0][0].data).toMatchObject({
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        type: 'FIRE',
      });
    });

    it('exige prioridade ao encaminhar', async () => {
      ocorrencia('TRIAGE');

      await expect(
        service.concludeTriage('r1', { outcome: 'ACCEPT' } as never, COORD),
      ).rejects.toThrow(/priority/);
    });

    it('não grava prioridade ao declarar improcedente', async () => {
      ocorrencia('TRIAGE');

      await service.concludeTriage(
        'r1',
        { outcome: 'REJECT', priority: 'HIGH', comment: 'não procede' } as never,
        COORD,
      );

      expect(report.update.mock.calls[0][0].data).toMatchObject({ status: 'REJECTED' });
      expect(report.update.mock.calls[0][0].data).not.toHaveProperty('priority');
    });
  });

  describe('atribuição', () => {
    it('recusa agente inativo (RF-API-38)', async () => {
      ocorrencia('IN_PROGRESS');
      agent.findUnique.mockResolvedValue({ id: 'ag1', name: 'X', active: false });

      await expect(
        service.assign('r1', { assignedToId: 'ag1' } as never, COORD),
      ).rejects.toThrow(BadRequestException);
    });

    it('responde 404 para agente inexistente', async () => {
      ocorrencia('IN_PROGRESS');
      agent.findUnique.mockResolvedValue(null);

      await expect(service.assign('r1', { assignedToId: 'ag9' } as never, COORD)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('registra a troca de responsável no histórico', async () => {
      ocorrencia('IN_PROGRESS');
      agent.findUnique.mockResolvedValue({ id: 'ag1', name: 'Ana Souza', active: true });

      await service.assign('r1', { assignedToId: 'ag1' } as never, COORD);

      expect(reportUpdate.create.mock.calls[0][0].data.comment).toContain('Ana Souza');
      expect(reportUpdate.create.mock.calls[0][0].data.visibleToCitizen).toBe(false);
    });
  });

  describe('observações no histórico', () => {
    it('trata como interna quando a visibilidade não é informada', async () => {
      ocorrencia('IN_PROGRESS');
      reportUpdate.create.mockResolvedValue({ id: 'u1' });

      await service.addUpdate('r1', { comment: 'anotação' } as never, AGENTE);

      expect(reportUpdate.create.mock.calls[0][0].data.visibleToCitizen).toBe(false);
    });
  });
});
