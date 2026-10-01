import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { EnumOption } from '@/types/metadata';
import type { ReportStatus } from '@/types/enums';
import { ReportTimeline } from './report-timeline';

const STATUSES: EnumOption<ReportStatus>[] = [
  { value: 'RECEIVED', label: 'Recebida' },
  { value: 'TRIAGE', label: 'Em triagem' },
  { value: 'IN_PROGRESS', label: 'Em atendimento' },
  { value: 'RESOLVED', label: 'Resolvida' },
];

describe('ReportTimeline', () => {
  it('explica a ausência de andamentos, em vez de mostrar lista vazia', () => {
    render(<ReportTimeline updates={[]} statuses={STATUSES} />);

    expect(screen.getByText(/Ainda não há andamentos/)).toBeDefined();
  });

  it('usa o rótulo em pt-BR servido pela API (RF-CID-41)', () => {
    render(
      <ReportTimeline
        updates={[{ toStatus: 'IN_PROGRESS', comment: null, createdAt: '2026-09-29T12:00:00Z' }]}
        statuses={STATUSES}
      />,
    );

    expect(screen.getByText(/em atendimento/)).toBeDefined();
    // O valor em inglês nunca aparece na tela.
    expect(screen.queryByText(/IN_PROGRESS/)).toBeNull();
  });

  it('mostra o comentário do andamento', () => {
    render(
      <ReportTimeline
        updates={[
          { toStatus: null, comment: 'Equipe acionada para vistoria.', createdAt: '2026-09-29T12:00:00Z' },
        ]}
        statuses={STATUSES}
      />,
    );

    expect(screen.getByText('Equipe acionada para vistoria.')).toBeDefined();
  });

  it('aguenta andamento sem situação e sem comentário, sem quebrar', () => {
    render(
      <ReportTimeline
        updates={[{ toStatus: null, comment: null, createdAt: '2026-09-29T12:00:00Z' }]}
        statuses={STATUSES}
      />,
    );

    expect(screen.getByRole('listitem')).toBeDefined();
  });

  it('é uma lista ordenada, na ordem em que a API devolve', () => {
    render(
      <ReportTimeline
        updates={[
          { toStatus: 'TRIAGE', comment: null, createdAt: '2026-09-28T12:00:00Z' },
          { toStatus: 'IN_PROGRESS', comment: null, createdAt: '2026-09-29T12:00:00Z' },
        ]}
        statuses={STATUSES}
      />,
    );

    const itens = screen.getAllByRole('listitem');
    expect(itens).toHaveLength(2);
    expect(itens[0].textContent).toMatch(/em triagem/);
    expect(itens[1].textContent).toMatch(/em atendimento/);
  });

  it('não exibe nome de agente — a API não o devolve, e a tela não o inventa', () => {
    const { container } = render(
      <ReportTimeline
        updates={[
          { toStatus: 'RESOLVED', comment: 'Árvore removida.', createdAt: '2026-09-29T12:00:00Z' },
        ]}
        statuses={STATUSES}
      />,
    );

    expect(container.textContent).not.toMatch(/agente|responsável|por /i);
  });

  it('cai no próprio valor quando a API não conhece a situação', () => {
    render(
      <ReportTimeline
        updates={[{ toStatus: 'CANCELLED', comment: null, createdAt: '2026-09-29T12:00:00Z' }]}
        statuses={STATUSES}
      />,
    );

    // CANCELLED não está na lista deste teste: melhor exibir o valor do que vazio.
    expect(screen.getByText(/cancelled/i)).toBeDefined();
  });
});
