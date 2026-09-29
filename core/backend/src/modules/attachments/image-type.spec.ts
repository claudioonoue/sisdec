import { detectImageMimeType, extensionFor } from './image-type.js';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP', 'ascii'),
]);

describe('detectImageMimeType', () => {
  it('reconhece os três formatos aceitos pela assinatura', () => {
    expect(detectImageMimeType(JPEG)).toBe('image/jpeg');
    expect(detectImageMimeType(PNG)).toBe('image/png');
    expect(detectImageMimeType(WEBP)).toBe('image/webp');
  });

  it('recusa conteúdo que não é imagem, ainda que o nome diga o contrário (RNF-API-13)', () => {
    expect(detectImageMimeType(Buffer.from('isto é um texto qualquer', 'utf8'))).toBeNull();
  });

  it('recusa formato de imagem não aceito — GIF e BMP', () => {
    expect(detectImageMimeType(Buffer.from('GIF89a', 'ascii'))).toBeNull();
    expect(detectImageMimeType(Buffer.from([0x42, 0x4d, 0x00, 0x00]))).toBeNull();
  });

  it('recusa PDF, que é o disfarce mais provável', () => {
    expect(detectImageMimeType(Buffer.from('%PDF-1.7', 'ascii'))).toBeNull();
  });

  it('recusa RIFF que não é WEBP — um WAV, por exemplo', () => {
    const wav = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.from([0x24, 0x00, 0x00, 0x00]),
      Buffer.from('WAVE', 'ascii'),
    ]);

    expect(detectImageMimeType(wav)).toBeNull();
  });

  it('recusa conteúdo vazio ou truncado, sem lançar', () => {
    expect(detectImageMimeType(Buffer.alloc(0))).toBeNull();
    expect(detectImageMimeType(Buffer.from([0xff, 0xd8]))).toBeNull();
    expect(detectImageMimeType(Buffer.from('RIFF', 'ascii'))).toBeNull();
  });
});

describe('extensionFor', () => {
  it('devolve a extensão canônica de cada formato', () => {
    expect(extensionFor('image/jpeg')).toBe('jpg');
    expect(extensionFor('image/png')).toBe('png');
    expect(extensionFor('image/webp')).toBe('webp');
  });

  it('lança para tipo sem extensão canônica', () => {
    expect(() => extensionFor('image/gif')).toThrow();
  });
});
