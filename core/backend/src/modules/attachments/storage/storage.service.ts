import type { Readable } from 'node:stream';

/** Token de injeção da implementação escolhida por `STORAGE_DRIVER`. */
export const STORAGE_SERVICE = Symbol('StorageService');

export interface StoredFile {
  /** Identificador do arquivo no armazenamento. Opaco para o resto do sistema. */
  storedPath: string;
}

/**
 * Fronteira do armazenamento de anexos.
 *
 * Nenhum service fora deste módulo conhece caminho de arquivo, `fs` ou SDK de
 * nuvem: o resto do sistema enxerga apenas `storedPath` e a URL devolvida pela
 * API. É o que mantém viável a troca por S3 sem tocar nas regras de negócio
 * (decisão 07 da arquitetura).
 */
export interface StorageService {
  /** Grava o conteúdo e devolve o identificador do arquivo. */
  save(content: Buffer, extension: string): Promise<StoredFile>;

  /**
   * Abre o conteúdo para leitura **em fluxo**.
   *
   * Devolve um stream, e não um `Buffer`: servir um anexo não deve carregar o
   * arquivo inteiro na memória da API (RNF-API-06).
   */
  createReadStream(storedPath: string): Promise<Readable>;

  /**
   * Remove o arquivo. Nenhum endpoint desta versão o utiliza — existe para que a
   * troca por S3 não exija alterar a interface.
   */
  remove(storedPath: string): Promise<void>;
}
