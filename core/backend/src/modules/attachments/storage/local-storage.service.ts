import { createReadStream } from 'node:fs';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../../config/env.validation.js';
import type { StorageService, StoredFile } from './storage.service.js';

/**
 * Implementação usada no trabalho: grava em `UPLOAD_DIR`.
 *
 * Este é o **único** arquivo do projeto que acessa o disco. Uma futura
 * `S3StorageService` implementa a mesma interface, e a escolha é feita uma só vez
 * no provider do módulo.
 */
@Injectable()
export class LocalStorageService implements StorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly baseDir: string;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.baseDir = resolve(config.get('UPLOAD_DIR', { infer: true }));
  }

  async save(content: Buffer, extension: string): Promise<StoredFile> {
    await mkdir(this.baseDir, { recursive: true });

    // O nome é gerado pela aplicação. O nome original enviado nunca chega ao
    // disco: além de poder conter `../`, ele carrega dado do cidadão no próprio
    // nome do arquivo (RNF-API-14).
    const storedPath = `${randomUUID()}.${extension}`;

    await writeFile(this.absolutePathOf(storedPath), content, { flag: 'wx' });

    return { storedPath };
  }

  async createReadStream(storedPath: string): Promise<Readable> {
    const absolute = this.absolutePathOf(storedPath);

    try {
      await stat(absolute);
    } catch {
      // O registro existe no banco mas o arquivo não está no disco. Vira 404, e
      // não erro interno: do ponto de vista de quem consulta, o anexo não está lá.
      this.logger.error(`Anexo ausente no disco: ${storedPath}`);
      throw new NotFoundException('Anexo não encontrado');
    }

    return createReadStream(absolute);
  }

  async remove(storedPath: string): Promise<void> {
    await unlink(this.absolutePathOf(storedPath)).catch(() => undefined);
  }

  /**
   * Resolve o caminho dentro de `UPLOAD_DIR` e recusa qualquer coisa que escape
   * dele. Os nomes são gerados por esta classe, então a travessia não deveria ser
   * possível — a verificação existe porque `storedPath` vem do banco, e um valor
   * plantado ali não deve virar leitura arbitrária de arquivo.
   */
  private absolutePathOf(storedPath: string): string {
    const absolute = resolve(join(this.baseDir, storedPath));
    const dentro = relative(this.baseDir, absolute);

    if (dentro.startsWith('..') || isAbsolute(dentro) || dentro === '') {
      throw new NotFoundException('Anexo não encontrado');
    }

    return absolute;
  }
}
