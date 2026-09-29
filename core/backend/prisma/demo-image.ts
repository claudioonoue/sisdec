import { crc32, deflateSync } from 'node:zlib';

/**
 * Gerador de imagens PNG para o seed de demonstração.
 *
 * As fotos precisam ser **bytes de imagem de verdade**: o envio de anexo confere
 * o tipo pela assinatura do arquivo (`RNF-API-13`), e um arquivo falso seria
 * recusado — como deve ser. Gerar aqui evita versionar binários no repositório
 * para algo que existe só para preencher a tela.
 *
 * São faixas de cor, não fotografias: o propósito é exercitar a miniatura, a
 * ampliação e a contagem de anexos, e uma imagem sintética deixa evidente que o
 * dado é de demonstração — uma foto realista convidaria a confundi-lo com real.
 */

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  const typed = Buffer.concat([Buffer.from(type, 'ascii'), data]);

  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typed));

  return Buffer.concat([length, typed, checksum]);
}

/**
 * PNG de `width` × `height` com duas faixas diagonais da cor informada, uma mais
 * clara que a outra — o bastante para as miniaturas se distinguirem entre si.
 */
export function bandedPng(width: number, height: number, color: Rgb): Uint8Array<ArrayBuffer> {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // 8 bits por canal
  header[9] = 2; // RGB, sem canal alfa
  // Bytes 10 a 12: compressão, filtro e entrelaçamento — os únicos valores que
  // o formato admite.

  const lighter = { r: lighten(color.r), g: lighten(color.g), b: lighten(color.b) };

  // Cada linha começa com o byte de filtro (0 = nenhum), seguido dos pixels.
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x += 1) {
      const banda = Math.floor((x + y) / 48) % 2 === 0 ? color : lighter;
      const at = 1 + x * 3;
      row[at] = banda.r;
      row[at + 1] = banda.g;
      row[at + 2] = banda.b;
    }
    rows.push(row);
  }

  const png = Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);

  // `Uint8Array` e não `Buffer`: um `Buffer` pode repousar sobre um
  // `SharedArrayBuffer`, que o `Blob` do envio não aceita. A cópia resolve o
  // tipo no ponto em que os bytes nascem, e não em cada uso.
  return new Uint8Array(png);
}

function lighten(channel: number): number {
  return Math.min(255, Math.round(channel + (255 - channel) * 0.35));
}
