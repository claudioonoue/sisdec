import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { STATUS_EXPLANATION, StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it('exibe o rótulo em texto, não só a cor (RNF-CID-19)', () => {
    render(<StatusBadge status="IN_PROGRESS" label="Em atendimento" />);

    expect(screen.getByText('Em atendimento')).toBeDefined();
  });

  it('usa o rótulo recebido, sem traduzir por conta própria', () => {
    render(<StatusBadge status="RESOLVED" label="Resolvida" />);

    expect(screen.getByText('Resolvida')).toBeDefined();
  });

  it('não quebra com situação fora do mapa de cores', () => {
    expect(() =>
      render(<StatusBadge status={'INVENTADA' as 'RECEIVED'} label="Inventada" />),
    ).not.toThrow();
  });
});

describe('STATUS_EXPLANATION', () => {
  it('explica todas as seis situações do ciclo de vida', () => {
    for (const status of [
      'RECEIVED',
      'TRIAGE',
      'IN_PROGRESS',
      'RESOLVED',
      'REJECTED',
      'CANCELLED',
    ] as const) {
      expect(STATUS_EXPLANATION[status].length).toBeGreaterThan(20);
    }
  });

  it('nenhuma explicação cita valor em inglês nem jargão', () => {
    for (const texto of Object.values(STATUS_EXPLANATION)) {
      expect(texto).not.toMatch(/RECEIVED|TRIAGE|IN_PROGRESS|RESOLVED|REJECTED|CANCELLED|status/);
    }
  });

  it('a improcedência remete ao histórico, onde está o motivo', () => {
    expect(STATUS_EXPLANATION.REJECTED).toMatch(/histórico/);
  });
});
