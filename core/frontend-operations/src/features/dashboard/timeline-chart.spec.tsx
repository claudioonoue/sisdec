import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimelineChart } from './timeline-chart';

const PONTOS = [
  { key: '2026-09-01', total: 3 },
  { key: '2026-09-02', total: 7 },
  { key: '2026-09-03', total: 1 },
];

describe('TimelineChart', () => {
  it('desenha uma barra por dia', () => {
    const { container } = render(<TimelineChart points={PONTOS} />);

    expect(container.querySelectorAll('rect')).toHaveLength(PONTOS.length);
  });

  /**
   * Este teste existe por um defeito que aconteceu: o React 19 trata `<title>`
   * como elemento especial e **descarta o conteúdo** quando recebe vários
   * filhos. O gráfico saiu com catorze `<title></title>` vazios, e `tsc`, lint e
   * build passaram limpos — nada acusa, porque o elemento existe.
   */
  it('dá a cada barra um valor legível ao passar o ponteiro', () => {
    const { container } = render(<TimelineChart points={PONTOS} />);

    const titulos = [...container.querySelectorAll('rect > title')];
    expect(titulos).toHaveLength(PONTOS.length);

    for (const titulo of titulos) {
      expect(titulo.textContent?.trim()).not.toBe('');
    }

    expect(titulos[1].textContent).toContain('7 ocorrências');
    // Singular quando é uma só — o número sozinho não diz do que se trata.
    expect(titulos[2].textContent).toContain('1 ocorrência');
  });

  it('descreve o gráfico inteiro para quem não o enxerga', () => {
    render(<TimelineChart points={PONTOS} />);

    const grafico = screen.getByRole('img');
    expect(grafico.getAttribute('aria-label')).toContain('Maior volume: 7');
  });

  it('oferece os mesmos números em tabela, não só na forma das barras', () => {
    // RNF-OP-31: nada é transmitido apenas pela cor ou pela forma.
    render(<TimelineChart points={PONTOS} />);

    const tabela = screen.getByRole('table');
    expect(tabela.querySelectorAll('tbody tr')).toHaveLength(PONTOS.length);
  });

  it('diz que não há registros em vez de desenhar um gráfico vazio', () => {
    render(<TimelineChart points={[]} />);

    expect(screen.getByText(/Nenhum registro no período/)).toBeDefined();
    expect(screen.queryByRole('img')).toBeNull();
  });
});
