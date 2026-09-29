/**
 * Verificação do tipo de imagem pelos **bytes iniciais do arquivo**, e não pelo
 * `Content-Type` declarado nem pela extensão do nome — ambos são escolhidos por
 * quem envia (RNF-API-13).
 */

import { isAcceptedMimeType } from '../../common/upload.constants.js';

/** Assinaturas dos formatos aceitos. */
const SIGNATURES: ReadonlyArray<{ mimeType: string; matches: (bytes: Buffer) => boolean }> = [
  {
    mimeType: 'image/jpeg',
    matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mimeType: 'image/png',
    matches: (b) =>
      b.length >= 8 &&
      b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mimeType: 'image/webp',
    // RIFF....WEBP — o tamanho ocupa os bytes 4 a 7.
    matches: (b) =>
      b.length >= 12 &&
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

/**
 * Tipo real do conteúdo, ou `null` quando não é nenhum dos formatos aceitos —
 * inclusive quando o arquivo se apresenta como imagem mas não é uma.
 */
export function detectImageMimeType(content: Buffer): string | null {
  return SIGNATURES.find(({ matches }) => matches(content))?.mimeType ?? null;
}

/**
 * Extensão canônica do formato. Usada para nomear o arquivo gravado: o nome
 * original nunca chega ao disco (RNF-API-14).
 */
export function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      throw new Error(`Tipo sem extensão canônica: ${mimeType}`);
  }
}

export { isAcceptedMimeType };
