import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Conferência de contraste dos tokens de cor (RNF-CID-14).
 *
 * Roda sobre o próprio `globals.css`: é a fonte de verdade, e um ajuste de matiz
 * feito ali passa a ser medido aqui — em vez de depender de alguém lembrar de
 * repetir a medição à mão.
 */

// Resolvido a partir da raiz do projeto: sob o Vitest, `import.meta.url` não é
// uma URL de arquivo.
const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');

function token(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!match) throw new Error(`token --color-${name} não encontrado em globals.css`);
  return match[1];
}

/** Luminância relativa, conforme a WCAG 2.1. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function ratio(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Pares texto/fundo efetivamente usados nas telas da etapa C1. */
const PARES: ReadonlyArray<[string, string, string]> = [
  ['ink', 'surface', 'texto principal'],
  ['ink', 'surface-muted', 'texto sobre o fundo da página'],
  ['ink-muted', 'surface', 'texto secundário'],
  ['brand', 'surface', 'links e títulos de ação'],
  ['brand', 'brand-soft', 'cartão de acompanhar, ao passar o mouse'],
  ['emergency', 'surface', 'título do aviso de emergência'],
  ['emergency', 'emergency-soft', 'aviso de emergência sobre o seu fundo'],
  ['danger', 'surface', 'mensagem de falha'],
  ['danger', 'danger-soft', 'mensagem de falha sobre o seu fundo'],
  ['ink', 'emergency-soft', 'parágrafo dentro do aviso'],
];

describe('contraste dos tokens (WCAG 2.1 AA)', () => {
  for (const [fg, bg, onde] of PARES) {
    it(`${fg} sobre ${bg} — ${onde}`, () => {
      expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('o branco sobre os fundos sólidos de botão também passa', () => {
    for (const fundo of ['brand', 'brand-strong', 'emergency']) {
      expect(ratio('#ffffff', token(fundo))).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('regras globais de acessibilidade', () => {
  it('define o anel de foco uma única vez, em :focus-visible (RNF-CID-15)', () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:/);
  });

  it('garante área de toque de 44 px nos controles (RNF-CID-07)', () => {
    expect(css).toMatch(/min-height:\s*44px/);
    expect(css).toMatch(/min-width:\s*44px/);
  });
});
