import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Readable } from 'node:stream';
import { ACCEPTED_MIME_TYPES, MAX_FILES_PER_REQUEST } from '../../common/upload.constants.js';
import { attachmentUrl } from './attachment-url.js';
import { ReportStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AttachmentResponseDto } from './dto/attachment-response.dto.js';
import { detectImageMimeType, extensionFor } from './image-type.js';
import { STORAGE_SERVICE, type StorageService } from './storage/storage.service.js';

/** Arquivo recebido pelo multer, em memória. */
export interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  /**
   * Anexa fotos a uma ocorrência.
   *
   * Só é aceito enquanto a ocorrência está em `RECEIVED` — a janela entre o
   * registro pelo cidadão e o início da triagem. Sem esse limite, qualquer pessoa
   * que conhecesse o `id` poderia anexar arquivos a uma ocorrência de terceiros
   * indefinidamente, inclusive já concluída (RF-API-69).
   */
  async attachToReport(reportId: string, files: UploadedFile[]): Promise<AttachmentResponseDto[]> {
    if (files.length === 0) {
      throw new BadRequestException('Envie ao menos um arquivo no campo files');
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      throw new BadRequestException(
        `São aceitos no máximo ${MAX_FILES_PER_REQUEST} arquivos por requisição`,
      );
    }

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, status: true },
    });

    if (!report) {
      throw new NotFoundException('Ocorrência não encontrada');
    }

    if (report.status !== ReportStatus.RECEIVED) {
      throw new ConflictException(
        'Esta ocorrência já está em atendimento e não aceita novos anexos',
      );
    }

    // Todo o lote é conferido antes de qualquer gravação: um arquivo recusado no
    // meio não deve deixar os anteriores no disco.
    const verificados = files.map((file) => {
      const mimeType = detectImageMimeType(file.buffer);

      if (!mimeType) {
        throw new BadRequestException(
          `O arquivo "${file.originalname}" não é uma imagem ${ACCEPTED_MIME_TYPES.join(', ')} válida`,
        );
      }

      return { file, mimeType };
    });

    const criados: AttachmentResponseDto[] = [];

    for (const { file, mimeType } of verificados) {
      const { storedPath } = await this.storage.save(file.buffer, extensionFor(mimeType));

      const attachment = await this.prisma.attachment.create({
        data: {
          reportId: report.id,
          fileName: file.originalname,
          storedPath,
          mimeType,
          sizeInBytes: file.size,
        },
        select: { id: true, fileName: true },
      });

      criados.push({ ...attachment, url: attachmentUrl(attachment.id) });
    }

    return criados;
  }

  /** Conteúdo do anexo, em fluxo, com o tipo gravado no registro (RF-API-22). */
  async openForReading(
    id: string,
  ): Promise<{ stream: Readable; mimeType: string; fileName: string }> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      select: { storedPath: true, mimeType: true, fileName: true },
    });

    if (!attachment) {
      throw new NotFoundException('Anexo não encontrado');
    }

    return {
      stream: await this.storage.createReadStream(attachment.storedPath),
      mimeType: attachment.mimeType,
      fileName: attachment.fileName,
    };
  }
}
