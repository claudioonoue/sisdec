import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatFileSize, toDateInputValue } from './format';

/**
 * As datas chegam da API em ISO 8601 UTC e são formatadas no servidor, depois
 * reaproveitadas na hidratação. O fuso é fixado justamente para que os dois
 * lados produzam o mesmo texto — um servidor em UTC e um navegador em
 * `America/Sao_Paulo` fariam a hora mudar sozinha ao carregar a página.
 */
describe('formatação de datas', () => {
  it('exibe data e hora em pt-BR, no fuso do sistema', () => {
    // 2026-09-29T18:20:00Z é 15:20 em America/Sao_Paulo (UTC-3).
    expect(formatDateTime('2026-09-29T18:20:00.000Z')).toBe('29/09/2026, 15:20');
  });

  it('converte o dia corretamente quando o fuso muda a data', () => {
    // 01:00 UTC ainda é o dia anterior no Brasil — o erro clássico de exibir
    // o registro como se fosse de outro dia.
    expect(formatDate('2026-09-30T01:00:00.000Z')).toBe('29/09/2026');
  });

  it('não quebra com data ausente', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(toDateInputValue(null)).toBe('');
  });

  it('devolve para o campo de data o formato que ele espera', () => {
    expect(toDateInputValue('2026-09-29T18:20:00.000Z')).toBe('2026-09-29');
  });
});

describe('formatFileSize', () => {
  it('usa a unidade adequada ao tamanho', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2,0 kB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5,0 MB');
  });

  it('usa vírgula decimal, como o resto da interface', () => {
    expect(formatFileSize(1536)).toBe('1,5 kB');
  });

  it('não passa de MB, que é o teto dos anexos', () => {
    expect(formatFileSize(3 * 1024 * 1024 * 1024)).toContain('MB');
  });
});
