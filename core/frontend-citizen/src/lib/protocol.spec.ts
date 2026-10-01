import { describe, expect, it } from 'vitest';
import { looksLikeProtocol, normalizeProtocol, protocolInputError } from './protocol';

describe('normalizeProtocol', () => {
  it('sobe a caixa e remove espaços nas pontas', () => {
    expect(normalizeProtocol('  sisdec-2026-000142  ')).toBe('SISDEC-2026-000142');
  });

  it('remove espaços internos, que aparecem ao copiar de um papel', () => {
    expect(normalizeProtocol('SISDEC- 2026 -000142')).toBe('SISDEC-2026-000142');
  });

  it('remove caracteres de controle, que viriam de uma cópia suja', () => {
    expect(normalizeProtocol('SISDEC-2026-000142\u0000\n')).toBe('SISDEC-2026-000142');
  });

  it('é idempotente', () => {
    const uma = normalizeProtocol(' sisdec-2026-000142 ');
    expect(normalizeProtocol(uma)).toBe(uma);
  });
});

describe('looksLikeProtocol', () => {
  it('aceita o formato da API', () => {
    expect(looksLikeProtocol('SISDEC-2026-000142')).toBe(true);
    expect(looksLikeProtocol('  sisdec-2026-000001 ')).toBe(true);
  });

  it('recusa formatos próximos mas errados', () => {
    for (const invalido of [
      'SISDEC-2026-12',
      'SISDEC-26-000142',
      'SISDEC-2026',
      'ABC-2026-000142',
      '2026-000142',
      '',
    ]) {
      expect(looksLikeProtocol(invalido)).toBe(false);
    }
  });
});

describe('protocolInputError', () => {
  it('pede o número quando o campo está vazio', () => {
    expect(protocolInputError('')).toMatch(/Informe o número/);
    expect(protocolInputError('   ')).toMatch(/Informe o número/);
  });

  it('mostra a forma esperada quando o número está malformado', () => {
    const erro = protocolInputError('123');

    expect(erro).toMatch(/formato esperado/);
    expect(erro).toContain('SISDEC-2026-000123');
  });

  it('não reclama de um protocolo válido', () => {
    expect(protocolInputError(' sisdec-2026-000142 ')).toBeNull();
  });

  it('distingue campo vazio de formato errado — são problemas diferentes', () => {
    expect(protocolInputError('')).not.toBe(protocolInputError('abc'));
  });
});
