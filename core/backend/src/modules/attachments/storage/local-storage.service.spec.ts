import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../../config/env.validation.js';
import { LocalStorageService } from './local-storage.service.js';

function servico(baseDir: string) {
  return new LocalStorageService({ get: () => baseDir } as unknown as ConfigService<
    EnvironmentVariables,
    true
  >);
}

async function lerTudo(stream: import('node:stream').Readable): Promise<Buffer> {
  const partes: Buffer[] = [];
  for await (const parte of stream) partes.push(parte as Buffer);
  return Buffer.concat(partes);
}

describe('LocalStorageService', () => {
  let baseDir: string;
  let storage: LocalStorageService;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), 'sisdec-storage-'));
    storage = servico(baseDir);
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('grava o conteúdo e devolve um nome gerado, não o original (RNF-API-14)', async () => {
    const { storedPath } = await storage.save(Buffer.from('conteudo'), 'jpg');

    expect(storedPath).toMatch(/^[0-9a-f-]{36}\.jpg$/);
    expect(await readFile(join(baseDir, storedPath), 'utf8')).toBe('conteudo');
  });

  it('gera nome diferente para conteúdo idêntico', async () => {
    const um = await storage.save(Buffer.from('igual'), 'png');
    const outro = await storage.save(Buffer.from('igual'), 'png');

    expect(um.storedPath).not.toBe(outro.storedPath);
  });

  it('cria o diretório de destino quando ele não existe', async () => {
    const aninhado = join(baseDir, 'ainda', 'nao', 'existe');
    const { storedPath } = await servico(aninhado).save(Buffer.from('x'), 'webp');

    expect(await readFile(join(aninhado, storedPath), 'utf8')).toBe('x');
  });

  it('devolve o conteúdo em fluxo (RNF-API-06)', async () => {
    const { storedPath } = await storage.save(Buffer.from('imagem'), 'jpg');

    const stream = await storage.createReadStream(storedPath);

    expect(typeof stream.pipe).toBe('function');
    expect((await lerTudo(stream)).toString()).toBe('imagem');
  });

  describe('travessia de diretório', () => {
    it('recusa caminho que escapa do UPLOAD_DIR', async () => {
      const fora = join(baseDir, '..', 'segredo.txt');
      await writeFile(fora, 'nao deveria ser lido');

      for (const malicioso of ['../segredo.txt', '../../etc/passwd', '/etc/passwd']) {
        await expect(storage.createReadStream(malicioso)).rejects.toThrow(NotFoundException);
      }

      await rm(fora, { force: true });
    });

    it('recusa o próprio diretório base', async () => {
      await expect(storage.createReadStream('')).rejects.toThrow(NotFoundException);
    });
  });

  it('responde 404 quando o registro existe mas o arquivo não está no disco', async () => {
    await expect(storage.createReadStream('nao-existe.jpg')).rejects.toThrow(NotFoundException);
  });

  it('remove o arquivo e não reclama se ele já não existir', async () => {
    const { storedPath } = await storage.save(Buffer.from('x'), 'jpg');

    await storage.remove(storedPath);
    await expect(storage.createReadStream(storedPath)).rejects.toThrow(NotFoundException);
    await expect(storage.remove(storedPath)).resolves.toBeUndefined();
  });
});
