import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { STEPS } from './draft';
import { StepProgress } from './step-progress';

describe('StepProgress', () => {
  it('diz a etapa atual em texto, não só por cor (RNF-CID-19)', () => {
    render(<StepProgress current={0} />);

    expect(screen.getByText(/Etapa 1 de 5/)).toBeDefined();
    expect(screen.getByText(/O que aconteceu/)).toBeDefined();
  });

  it('acompanha a etapa, do começo ao fim', () => {
    for (let step = 0; step < STEPS.length; step += 1) {
      const { unmount } = render(<StepProgress current={step} />);

      expect(screen.getByText(new RegExp(`Etapa ${step + 1} de ${STEPS.length}`))).toBeDefined();
      unmount();
    }
  });

  it('anuncia a mudança de etapa a quem usa leitor de tela (RNF-CID-18)', () => {
    const { container } = render(<StepProgress current={2} />);

    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain('Etapa 3 de 5');
  });

  it('esconde a barra decorativa do leitor de tela', () => {
    const { container } = render(<StepProgress current={1} />);

    expect(container.querySelector('ol')?.getAttribute('aria-hidden')).toBe('true');
  });
});
