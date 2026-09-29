import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountBars } from './count-bars';

describe('CountBars', () => {
  it('leva cada linha à lista já recortada (RF-OP-13)', () => {
    render(
      <CountBars
        rows={[{ key: 'RECEIVED', label: 'Recebida', total: 4, href: '/ocorrencias?situacao=X' }]}
      />,
    );

    expect(screen.getByRole('link', { name: /Recebida/ }).getAttribute('href')).toBe(
      '/ocorrencias?situacao=X',
    );
  });

  /**
   * A API não tem filtro para ausência de prioridade. Um link para as recebidas
   * mostraria um número diferente do exibido — as em triagem também estão sem
   * prioridade —, e link que leva a outro recorte é pior do que link nenhum.
   */
  it('não faz link da linha sem recorte equivalente', () => {
    render(
      <CountBars
        rows={[{ key: 'SEM_PRIORIDADE', label: 'Aguardando triagem', total: 7, note: 'motivo' }]}
      />,
    );

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Aguardando triagem')).toBeDefined();
    expect(screen.getByText('7')).toBeDefined();
  });

  it('exibe o número de cada linha como texto, não só como barra', () => {
    // RNF-OP-31: a barra é magnitude; o número é o dado.
    render(
      <CountBars
        rows={[
          { key: 'a', label: 'Centro', total: 12, href: '/a' },
          { key: 'b', label: 'Vila Nova', total: 3, href: '/b' },
        ]}
      />,
    );

    expect(screen.getByText('12')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });

  it('explica a lista vazia em vez de não mostrar nada', () => {
    render(<CountBars rows={[]} />);

    expect(screen.getByText(/Nenhuma ocorrência no período/)).toBeDefined();
  });
});
