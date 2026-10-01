import { describe, expect, it } from 'vitest';
import type { UploadLimits } from '@/types/metadata';
import { describeAcceptedTypes, formatFileSize, selectPhotos } from './photos';

const LIMITS: UploadLimits = {
  maxFiles: 5,
  maxSizeMb: 10,
  acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

function arquivo(name: string, type: string, megabytes = 0.5): File {
  const bytes = Math.round(megabytes * 1024 * 1024);
  return new File([new Uint8Array(bytes)], name, { type });
}

describe('selectPhotos', () => {
  it('aceita imagem dentro dos limites publicados pela API', () => {
    const { accepted, rejected } = selectPhotos([], [arquivo('arvore.jpg', 'image/jpeg')], LIMITS);

    expect(accepted).toHaveLength(1);
    expect(rejected).toEqual([]);
  });

  it('aceita os três formatos que a API aceita', () => {
    const { accepted } = selectPhotos(
      [],
      [
        arquivo('a.jpg', 'image/jpeg'),
        arquivo('b.png', 'image/png'),
        arquivo('c.webp', 'image/webp'),
      ],
      LIMITS,
    );

    expect(accepted).toHaveLength(3);
  });

  it('recusa formato que a API não aceita, dizendo quais valem (RF-CID-16)', () => {
    const { accepted, rejected } = selectPhotos([], [arquivo('x.gif', 'image/gif')], LIMITS);

    expect(accepted).toEqual([]);
    expect(rejected[0].reason).toContain('JPEG');
    expect(rejected[0].reason).toContain('WEBP');
  });

  it('recusa arquivo acima do tamanho máximo, citando o limite', () => {
    const { rejected } = selectPhotos([], [arquivo('grande.jpg', 'image/jpeg', 11)], LIMITS);

    expect(rejected[0].reason).toContain('10 MB');
  });

  it('aceita arquivo exatamente no limite', () => {
    const { accepted } = selectPhotos([], [arquivo('limite.jpg', 'image/jpeg', 10)], LIMITS);

    expect(accepted).toHaveLength(1);
  });

  it('conta o limite por ocorrência, não por seleção', () => {
    const jaEscolhidas = [
      arquivo('1.jpg', 'image/jpeg'),
      arquivo('2.jpg', 'image/jpeg'),
      arquivo('3.jpg', 'image/jpeg'),
      arquivo('4.jpg', 'image/jpeg'),
    ];

    const { accepted, rejected } = selectPhotos(
      jaEscolhidas,
      [arquivo('5.jpg', 'image/jpeg'), arquivo('6.jpg', 'image/jpeg')],
      LIMITS,
    );

    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toContain('5 fotos');
  });

  it('recusa a mesma foto escolhida duas vezes', () => {
    const ja = [arquivo('arvore.jpg', 'image/jpeg')];

    const { accepted, rejected } = selectPhotos(ja, [arquivo('arvore.jpg', 'image/jpeg')], LIMITS);

    expect(accepted).toEqual([]);
    expect(rejected[0].reason).toMatch(/já foi escolhida/);
  });

  it('não confunde arquivos de mesmo nome e tamanhos diferentes', () => {
    const ja = [arquivo('foto.jpg', 'image/jpeg', 1)];

    const { accepted } = selectPhotos(ja, [arquivo('foto.jpg', 'image/jpeg', 2)], LIMITS);

    expect(accepted).toHaveLength(1);
  });

  it('avalia cada arquivo do lote, sem parar no primeiro recusado', () => {
    const { accepted, rejected } = selectPhotos(
      [],
      [arquivo('ruim.gif', 'image/gif'), arquivo('boa.jpg', 'image/jpeg')],
      LIMITS,
    );

    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });

  it('nomeia o arquivo recusado, para a pessoa saber qual foi', () => {
    const { rejected } = selectPhotos([], [arquivo('documento.pdf', 'application/pdf')], LIMITS);

    expect(rejected[0].fileName).toBe('documento.pdf');
  });

  it('respeita limites diferentes dos que a API usa hoje', () => {
    const outros: UploadLimits = { maxFiles: 1, maxSizeMb: 1, acceptedMimeTypes: ['image/png'] };

    const { accepted, rejected } = selectPhotos(
      [],
      [arquivo('a.jpg', 'image/jpeg'), arquivo('b.png', 'image/png', 2)],
      outros,
    );

    expect(accepted).toEqual([]);
    expect(rejected).toHaveLength(2);
  });
});

describe('describeAcceptedTypes', () => {
  it('lista os formatos em texto legível', () => {
    expect(describeAcceptedTypes(LIMITS)).toBe('JPEG, PNG ou WEBP');
  });

  it('não usa conjunção quando há só um formato', () => {
    expect(describeAcceptedTypes({ ...LIMITS, acceptedMimeTypes: ['image/png'] })).toBe('PNG');
  });
});

describe('formatFileSize', () => {
  it('usa MB com vírgula decimal acima de 1 MB', () => {
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1,5 MB');
  });

  it('usa KB abaixo de 1 MB', () => {
    expect(formatFileSize(300 * 1024)).toBe('300 KB');
  });

  it('nunca mostra 0 KB para arquivo minúsculo', () => {
    expect(formatFileSize(10)).toBe('1 KB');
  });
});
