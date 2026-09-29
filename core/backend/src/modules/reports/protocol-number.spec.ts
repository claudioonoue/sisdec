import {
  formatProtocolNumber,
  normalizeProtocolNumber,
  protocolPrefixForYear,
  sequenceOf,
} from './protocol-number.js';

describe('formatProtocolNumber', () => {
  it('monta o formato SISDEC-AAAA-NNNNNN com zeros à esquerda', () => {
    expect(formatProtocolNumber(2026, 142)).toBe('SISDEC-2026-000142');
    expect(formatProtocolNumber(2026, 1)).toBe('SISDEC-2026-000001');
  });

  it('não trunca quando a sequência passa de seis dígitos', () => {
    expect(formatProtocolNumber(2026, 1234567)).toBe('SISDEC-2026-1234567');
  });
});

describe('protocolPrefixForYear', () => {
  it('devolve o prefixo de busca do ano', () => {
    expect(protocolPrefixForYear(2026)).toBe('SISDEC-2026-');
  });
});

describe('sequenceOf', () => {
  it('extrai a sequência', () => {
    expect(sequenceOf('SISDEC-2026-000142')).toBe(142);
  });

  it('devolve 0 para valor fora do formato, sem lançar', () => {
    for (const invalido of ['', 'SISDEC-2026', 'ABC-2026-000001', 'SISDEC-2026-12']) {
      expect(sequenceOf(invalido)).toBe(0);
    }
  });
});

describe('normalizeProtocolNumber', () => {
  it('aceita caixa baixa, espaços em volta e espaços internos', () => {
    expect(normalizeProtocolNumber('  sisdec-2026-000142  ')).toBe('SISDEC-2026-000142');
    expect(normalizeProtocolNumber('SISDEC- 2026 -000142')).toBe('SISDEC-2026-000142');
  });

  it('é idempotente', () => {
    const uma = normalizeProtocolNumber(' sisdec-2026-000142 ');
    expect(normalizeProtocolNumber(uma)).toBe(uma);
  });
});
