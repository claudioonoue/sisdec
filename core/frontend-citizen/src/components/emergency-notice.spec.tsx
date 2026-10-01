import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmergencyNotice } from './emergency-notice';

describe('EmergencyNotice', () => {
  it('oferece os dois números como link de discagem (RF-CID-02)', () => {
    render(<EmergencyNotice />);

    expect(screen.getByRole('button', { name: /199/ })).toHaveProperty(
      'href',
      expect.stringContaining('tel:199'),
    );
    expect(screen.getByRole('button', { name: /193/ })).toHaveProperty(
      'href',
      expect.stringContaining('tel:193'),
    );
  });

  it('não depende de cor: traz o rótulo em texto (RNF-CID-19)', () => {
    render(<EmergencyNotice />);

    expect(screen.getByRole('heading', { name: /emerg/i })).toBeDefined();
    expect(screen.getByText(/Defesa Civil/)).toBeDefined();
    expect(screen.getByText(/Bombeiros/)).toBeDefined();
  });

  it('diz que o sistema não substitui o atendimento emergencial', () => {
    render(<EmergencyNotice />);

    expect(screen.getByText(/não substitui/i)).toBeDefined();
  });

  it('a versão compacta mantém os telefones e dispensa o parágrafo', () => {
    render(<EmergencyNotice compact />);

    expect(screen.getByRole('button', { name: /199/ })).toBeDefined();
    expect(screen.queryByText(/não substitui/i)).toBeNull();
  });

  it('é uma região nomeada, para o leitor de tela anunciá-la (RNF-CID-20)', () => {
    const { container } = render(<EmergencyNotice />);
    const aside = container.querySelector('aside');

    expect(aside?.getAttribute('aria-labelledby')).toBe('aviso-emergencia');
    expect(container.querySelector('#aviso-emergencia')).not.toBeNull();
  });
});
