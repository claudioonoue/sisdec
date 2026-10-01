import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime } from './format';

describe('formatDateTime', () => {
  it('formata no padrão brasileiro, com data e hora', () => {
    // A asserção é sobre a forma, não sobre o valor: a hora exibida depende do fuso
    // de quem lê, e fixá-la amarraria o teste ao fuso da máquina que o roda.
    expect(formatDateTime('2026-09-29T12:00:00.000Z')).toMatch(
      /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}$/,
    );
  });

  it('devolve vazio para ausência, em vez de lançar', () => {
    expect(formatDateTime(null)).toBe('');
    expect(formatDateTime(undefined)).toBe('');
    expect(formatDateTime('')).toBe('');
  });

  it('devolve vazio para data inválida — não derruba a consulta', () => {
    expect(formatDateTime('ontem')).toBe('');
    expect(formatDateTime('2026-99-99')).toBe('');
  });
});

describe('formatDate', () => {
  it('omite a hora', () => {
    expect(formatDate('2026-09-29T12:00:00.000Z')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('também tolera ausência', () => {
    expect(formatDate(null)).toBe('');
  });
});
