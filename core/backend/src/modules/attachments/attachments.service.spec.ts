import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AttachmentsService, type UploadedFile } from './attachments.service.js';
import { STORAGE_SERVICE } from './storage/storage.service.js';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function arquivo(nome: string, buffer: Buffer): UploadedFile {
  return { originalname: nome, buffer, size: buffer.length };
}

describe('AttachmentsService', () => {
  let service: AttachmentsService;
  let report: { findUnique: ReturnType<typeof vi.fn> };
  let attachment: { create: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
  let storage: {
    save: ReturnType<typeof vi.fn>;
    createReadStream: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    report = { findUnique: vi.fn().mockResolvedValue({ id: 'r1', status: 'RECEIVED' }) };
    attachment = {
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: `att-${data.fileName}`, fileName: data.fileName }),
      ),
      findUnique: vi.fn(),
    };
    storage = {
      save: vi.fn().mockResolvedValue({ storedPath: 'gerado.jpg' }),
      createReadStream: vi.fn().mockResolvedValue({ pipe: vi.fn() }),
      remove: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        { provide: PrismaService, useValue: { report, attachment } },
        { provide: STORAGE_SERVICE, useValue: storage },
      ],
    }).compile();

    service = module.get(AttachmentsService);
  });

  describe('attachToReport', () => {
    it('grava os anexos e devolve id, nome e URL servida pela API (RF-API-21)', async () => {
      const resultado = await service.attachToReport('r1', [arquivo('arvore.jpg', JPEG)]);

      expect(resultado).toEqual([
        { id: 'att-arvore.jpg', fileName: 'arvore.jpg', url: '/api/v1/attachments/att-arvore.jpg' },
      ]);
    });

    it('grava o tipo detectado pelo conteúdo, não o nome do arquivo', async () => {
      await service.attachToReport('r1', [arquivo('parece-jpeg.jpg', PNG)]);

      expect(attachment.create.mock.calls[0][0].data.mimeType).toBe('image/png');
      expect(storage.save).toHaveBeenCalledWith(PNG, 'png');
    });

    it('preserva o nome informado no registro, mas não o usa no disco (RNF-API-14)', async () => {
      await service.attachToReport('r1', [arquivo('../../etc/passwd', JPEG)]);

      expect(attachment.create.mock.calls[0][0].data.fileName).toBe('../../etc/passwd');
      // O nome no disco é decidido pelo storage, que recebe apenas conteúdo e extensão.
      expect(storage.save).toHaveBeenCalledWith(JPEG, 'jpg');
    });

    it('recusa arquivo que não é imagem aceita (RF-API-18)', async () => {
      await expect(
        service.attachToReport('r1', [arquivo('falso.jpg', Buffer.from('texto'))]),
      ).rejects.toThrow(BadRequestException);
    });

    it('não grava nada quando um arquivo do lote é recusado', async () => {
      await expect(
        service.attachToReport('r1', [
          arquivo('boa.jpg', JPEG),
          arquivo('ruim.jpg', Buffer.from('texto')),
        ]),
      ).rejects.toThrow(BadRequestException);

      expect(storage.save).not.toHaveBeenCalled();
      expect(attachment.create).not.toHaveBeenCalled();
    });

    it('recusa lote vazio e lote acima de cinco arquivos (RF-API-17)', async () => {
      await expect(service.attachToReport('r1', [])).rejects.toThrow(BadRequestException);

      const seis = Array.from({ length: 6 }, (_, i) => arquivo(`f${i}.jpg`, JPEG));
      await expect(service.attachToReport('r1', seis)).rejects.toThrow(BadRequestException);
    });

    it('responde 404 para ocorrência inexistente (RF-API-23)', async () => {
      report.findUnique.mockResolvedValue(null);

      await expect(service.attachToReport('r9', [arquivo('a.jpg', JPEG)])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('responde 409 quando a ocorrência já saiu de RECEIVED (RF-API-69)', async () => {
      for (const status of ['TRIAGE', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CANCELLED']) {
        report.findUnique.mockResolvedValue({ id: 'r1', status });

        await expect(service.attachToReport('r1', [arquivo('a.jpg', JPEG)])).rejects.toThrow(
          ConflictException,
        );
      }

      expect(storage.save).not.toHaveBeenCalled();
    });
  });

  describe('openForReading', () => {
    it('devolve fluxo, tipo e nome do registro', async () => {
      attachment.findUnique.mockResolvedValue({
        storedPath: 'gerado.jpg',
        mimeType: 'image/jpeg',
        fileName: 'arvore.jpg',
      });

      const resultado = await service.openForReading('att-1');

      expect(storage.createReadStream).toHaveBeenCalledWith('gerado.jpg');
      expect(resultado.mimeType).toBe('image/jpeg');
      expect(resultado.fileName).toBe('arvore.jpg');
    });

    it('responde 404 para anexo inexistente', async () => {
      attachment.findUnique.mockResolvedValue(null);

      await expect(service.openForReading('att-9')).rejects.toThrow(NotFoundException);
    });
  });
});
