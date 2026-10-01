import { describe, expect, it } from 'vitest';
import type { UploadLimits } from '@/types/metadata';
import {
  MAX_SIDE,
  alreadySmallEnough,
  isWorthCompressing,
  targetDimensions,
} from './image-compression';

const LIMITS: UploadLimits = {
  maxFiles: 5,
  maxSizeMb: 10,
  acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

describe('targetDimensions', () => {
  it('reduz pelo maior lado, preservando a proporção', () => {
    expect(targetDimensions(4000, 3000)).toEqual({ width: 1920, height: 1440 });
    expect(targetDimensions(3000, 4000)).toEqual({ width: 1440, height: 1920 });
  });

  it('não amplia imagem já pequena — aumentar não acrescenta informação', () => {
    expect(targetDimensions(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it('deixa intacta a imagem exatamente no limite', () => {
    expect(targetDimensions(MAX_SIDE, 1080)).toEqual({ width: MAX_SIDE, height: 1080 });
  });

  it('nunca devolve dimensão zero, por mais extremo que seja o formato', () => {
    const { width, height } = targetDimensions(10000, 1);

    expect(width).toBe(MAX_SIDE);
    expect(height).toBeGreaterThanOrEqual(1);
  });

  it('aguenta dimensão zero sem dividir por zero', () => {
    expect(targetDimensions(0, 0)).toEqual({ width: 0, height: 0 });
  });

  it('respeita um limite diferente', () => {
    expect(targetDimensions(2000, 1000, 1000)).toEqual({ width: 1000, height: 500 });
  });
});

describe('isWorthCompressing', () => {
  it('aceita quando a redução é significativa', () => {
    expect(isWorthCompressing(4_000_000, 800_000)).toBe(true);
  });

  it('recusa quando o resultado ficou maior — acontece com PNG pequeno', () => {
    expect(isWorthCompressing(100_000, 140_000)).toBe(false);
  });

  it('recusa ganho irrelevante, que não paga o risco de recodificar', () => {
    expect(isWorthCompressing(100_000, 98_000)).toBe(false);
  });

  it('recusa resultado vazio, que indica falha na codificação', () => {
    expect(isWorthCompressing(100_000, 0)).toBe(false);
  });
});

describe('alreadySmallEnough', () => {
  it('dispensa a redução de arquivo bem abaixo do limite', () => {
    expect(alreadySmallEnough({ size: 1 * 1024 * 1024 }, LIMITS)).toBe(true);
  });

  it('reduz arquivo próximo do limite', () => {
    expect(alreadySmallEnough({ size: 9 * 1024 * 1024 }, LIMITS)).toBe(false);
  });

  it('acompanha o limite que a API publica, em vez de um valor fixo', () => {
    const apertado: UploadLimits = { ...LIMITS, maxSizeMb: 2 };

    expect(alreadySmallEnough({ size: 1.5 * 1024 * 1024 }, apertado)).toBe(false);
    expect(alreadySmallEnough({ size: 1.5 * 1024 * 1024 }, LIMITS)).toBe(true);
  });
});
