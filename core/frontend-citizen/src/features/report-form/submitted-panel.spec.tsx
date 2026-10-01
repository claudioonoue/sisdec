import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubmittedPanel } from './submitted-panel';

const PROTOCOLO = 'SISDEC-2026-000142';

describe('SubmittedPanel', () => {
  it('mostra o protocolo em destaque', () => {
    render(<SubmittedPanel protocolNumber={PROTOCOLO} />);

    expect(screen.getByText(PROTOCOLO)).toBeDefined();
  });

  it('avisa que o protocolo é a única forma de acompanhar', () => {
    render(<SubmittedPanel protocolNumber={PROTOCOLO} />);

    expect(screen.getByText(/única forma/i)).toBeDefined();
  });

  it('leva ao acompanhamento já com o protocolo preenchido', () => {
    render(<SubmittedPanel protocolNumber={PROTOCOLO} />);

    const link = screen.getByRole('link', { name: /acompanhar/i });
    expect(link.getAttribute('href')).toContain(encodeURIComponent(PROTOCOLO));
  });

  it('mostra o protocolo mesmo quando as fotos falharam (RF-CID-24)', () => {
    render(
      <SubmittedPanel
        protocolNumber={PROTOCOLO}
        warning="A sua ocorrência foi registrada, mas não conseguimos enviar as fotos."
      />,
    );

    expect(screen.getByText(PROTOCOLO)).toBeDefined();
    expect(screen.getByRole('alert').textContent).toMatch(/registrada/);
  });

  it('não mostra aviso quando o envio foi completo', () => {
    render(<SubmittedPanel protocolNumber={PROTOCOLO} />);

    expect(screen.queryByRole('alert')).toBeNull();
  });
});
