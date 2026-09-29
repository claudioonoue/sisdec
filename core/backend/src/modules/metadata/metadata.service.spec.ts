import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { ACCEPTED_MIME_TYPES, MAX_FILES_PER_REQUEST } from '../../common/upload.constants.js';
import {
  ReportCategory,
  ReportStatus,
  ReportType,
} from '../../generated/prisma/enums.js';
import { MetadataService } from './metadata.service.js';
import { URGENT_REPORT_TYPES } from './metadata.labels.js';

describe('MetadataService', () => {
  let service: MetadataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetadataService,
        { provide: ConfigService, useValue: { get: vi.fn().mockReturnValue(10) } },
      ],
    }).compile();

    service = module.get(MetadataService);
  });

  describe('exaustividade das enumerações', () => {
    it('devolve todos os tipos de ocorrência do enum, sem sobra nem falta', () => {
      const devolvidos = service.getReportTypes().map((item) => item.value);

      expect(devolvidos).toEqual(Object.values(ReportType));
    });

    it('devolve todas as categorias do enum', () => {
      expect(service.getReportCategories().map((i) => i.value)).toEqual(
        Object.values(ReportCategory),
      );
    });

    it('devolve todas as situações do enum', () => {
      expect(service.getReportStatuses().map((i) => i.value)).toEqual(Object.values(ReportStatus));
    });

    it('não devolve nenhum rótulo vazio ou igual ao próprio valor', () => {
      const todos = [
        ...service.getReportTypes(),
        ...service.getReportCategories(),
        ...service.getReportStatuses(),
      ];

      for (const { value, label } of todos) {
        expect(label.trim()).not.toBe('');
        expect(label).not.toBe(value);
      }
    });
  });

  describe('marcação de urgência (RF-API-11)', () => {
    it('marca urgent exatamente nos cinco tipos de risco imediato à vida', () => {
      const urgentes = service
        .getReportTypes()
        .filter((item) => item.urgent)
        .map((item) => item.value);

      expect(urgentes.sort()).toEqual([...URGENT_REPORT_TYPES].sort());
      expect(urgentes).toHaveLength(5);
    });

    it('marca FIRE como urgente e FLOODING como não urgente', () => {
      const porValor = new Map(service.getReportTypes().map((i) => [i.value, i.urgent]));

      expect(porValor.get(ReportType.FIRE)).toBe(true);
      expect(porValor.get(ReportType.FLOODING)).toBe(false);
    });
  });

  describe('limites de upload (RF-API-64)', () => {
    it('lê o tamanho máximo da configuração, em vez de repeti-lo', async () => {
      const module = await Test.createTestingModule({
        providers: [
          MetadataService,
          { provide: ConfigService, useValue: { get: vi.fn().mockReturnValue(25) } },
        ],
      }).compile();

      expect(module.get(MetadataService).getUploadLimits().maxSizeMb).toBe(25);
    });

    it('publica os mesmos limites que a API aplica', () => {
      expect(service.getUploadLimits()).toEqual({
        maxFiles: MAX_FILES_PER_REQUEST,
        maxSizeMb: 10,
        acceptedMimeTypes: [...ACCEPTED_MIME_TYPES],
      });
    });
  });

  it('monta a resposta pública com as quatro seções do contrato', () => {
    expect(Object.keys(service.getPublicMetadata()).sort()).toEqual([
      'reportCategories',
      'reportStatuses',
      'reportTypes',
      'upload',
    ]);
  });

  it('não expõe prioridades nem perfis, que são de uso interno', () => {
    expect(service.getPublicMetadata()).not.toHaveProperty('priorities');
    expect(service.getPublicMetadata()).not.toHaveProperty('agentRoles');
  });
});
