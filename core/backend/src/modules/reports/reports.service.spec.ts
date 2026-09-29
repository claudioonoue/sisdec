import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ReportsService } from './reports.service.js';

const DTO = {
  category: 'RISK_ALERT' as const,
  type: 'DANGEROUS_TREE' as const,
  description: 'Árvore inclinada sobre a calçada.',
  address: 'Rua das Palmeiras, 120',
  district: 'Centro',
};

describe('ReportsService', () => {
  let service: ReportsService;
  let report: {
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  let executeRaw: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    report = {
      create: vi.fn().mockResolvedValue({
        id: 'r1',
        protocolNumber: 'SISDEC-2026-000001',
        status: 'RECEIVED',
        createdAt: new Date(),
      }),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn(),
    };
    executeRaw = vi.fn().mockResolvedValue(1);

    const prisma = {
      report,
      $transaction: vi.fn(async (fn: (tx: unknown) => unknown) =>
        fn({ report, $executeRaw: executeRaw }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ReportsService);
  });

  describe('create', () => {
    it('começa a sequência em 000001 quando o ano não tem ocorrências', async () => {
      await service.create(DTO);

      const ano = new Date().getUTCFullYear();
      expect(report.create.mock.calls[0][0].data.protocolNumber).toBe(`SISDEC-${ano}-000001`);
    });

    it('continua a sequência a partir do último protocolo do ano', async () => {
      const ano = new Date().getUTCFullYear();
      report.findFirst.mockResolvedValue({ protocolNumber: `SISDEC-${ano}-000141` });

      await service.create(DTO);

      expect(report.create.mock.calls[0][0].data.protocolNumber).toBe(`SISDEC-${ano}-000142`);
    });

    it('toma o advisory lock antes de ler a sequência', async () => {
      await service.create(DTO);

      expect(executeRaw).toHaveBeenCalled();
      expect(executeRaw.mock.invocationCallOrder[0]).toBeLessThan(
        report.findFirst.mock.invocationCallOrder[0],
      );
    });

    it('grava status RECEIVED e nenhuma prioridade (RF-API-06)', async () => {
      await service.create(DTO);

      const { data } = report.create.mock.calls[0][0];
      expect(data.status).toBe('RECEIVED');
      expect(data).not.toHaveProperty('priority');
    });

    it('não cria cidadão quando citizen não vem (RF-API-04)', async () => {
      await service.create(DTO);

      expect(report.create.mock.calls[0][0].data).not.toHaveProperty('citizen');
    });

    it('cria o cidadão junto da ocorrência, na mesma operação (RNF-API-20)', async () => {
      await service.create({ ...DTO, citizen: { name: 'Maria Silva' } });

      expect(report.create.mock.calls[0][0].data.citizen).toEqual({
        create: { name: 'Maria Silva', email: undefined, phone: undefined },
      });
    });

    it('tenta o número seguinte quando há colisão de protocolo', async () => {
      report.create
        .mockRejectedValueOnce({ code: 'P2002', meta: { target: ['protocolNumber'] } })
        .mockResolvedValueOnce({
          id: 'r1',
          protocolNumber: 'SISDEC-2026-000002',
          status: 'RECEIVED',
          createdAt: new Date(),
        });

      await expect(service.create(DTO)).resolves.toMatchObject({
        protocolNumber: 'SISDEC-2026-000002',
      });
      expect(report.create).toHaveBeenCalledTimes(2);
    });

    it('não repete a tentativa em conflito de outra coluna', async () => {
      report.create.mockRejectedValue({ code: 'P2002', meta: { target: ['email'] } });

      await expect(service.create(DTO)).rejects.toMatchObject({ code: 'P2002' });
      expect(report.create).toHaveBeenCalledTimes(1);
    });

    it('propaga erro que não seja de unicidade, sem repetir', async () => {
      report.create.mockRejectedValue(new Error('conexão perdida'));

      await expect(service.create(DTO)).rejects.toThrow('conexão perdida');
      expect(report.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByProtocolNumber', () => {
    const encontrada = {
      protocolNumber: 'SISDEC-2026-000142',
      category: 'RISK_ALERT',
      type: 'DANGEROUS_TREE',
      status: 'IN_PROGRESS',
      district: 'Centro',
      createdAt: new Date(),
      resolvedAt: null,
      updates: [],
      attachments: [{ id: '9a1b' }],
    };

    it('normaliza o protocolo antes de consultar', async () => {
      report.findUnique.mockResolvedValue(encontrada);

      await service.findByProtocolNumber('  sisdec-2026-000142 ');

      expect(report.findUnique.mock.calls[0][0].where).toEqual({
        protocolNumber: 'SISDEC-2026-000142',
      });
    });

    it('seleciona apenas andamentos visíveis ao cidadão (RF-API-15)', async () => {
      report.findUnique.mockResolvedValue(encontrada);

      await service.findByProtocolNumber('SISDEC-2026-000142');

      const { select } = report.findUnique.mock.calls[0][0];
      expect(select.updates.where).toEqual({ visibleToCitizen: true });
    });

    it('não seleciona campo capaz de identificar quem registrou (RF-API-14)', async () => {
      report.findUnique.mockResolvedValue(encontrada);

      await service.findByProtocolNumber('SISDEC-2026-000142');

      const { select } = report.findUnique.mock.calls[0][0];
      for (const campo of ['description', 'address', 'latitude', 'longitude', 'citizen', 'citizenId', 'assignedToId', 'priority']) {
        expect(select).not.toHaveProperty(campo);
      }
      expect(select.updates.select).not.toHaveProperty('agentId');
      expect(select.updates.select).not.toHaveProperty('agent');
    });

    it('monta a URL do anexo servida pela própria API', async () => {
      report.findUnique.mockResolvedValue(encontrada);

      const resultado = await service.findByProtocolNumber('SISDEC-2026-000142');

      expect(resultado.attachments).toEqual([{ id: '9a1b', url: '/api/v1/attachments/9a1b' }]);
    });

    it('responde 404 quando o protocolo não existe (RF-API-16)', async () => {
      report.findUnique.mockResolvedValue(null);

      await expect(service.findByProtocolNumber('SISDEC-2026-999999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
