import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SiteHeader } from './site-header';

describe('SiteHeader', () => {
  it('dá acesso às orientações de qualquer tela (RF-CID-04)', () => {
    render(<SiteHeader />);

    expect(screen.getByRole('link', { name: 'Orientações' }).getAttribute('href')).toBe(
      '/orientacoes',
    );
  });

  it('o nome acessível do link de início não tem palavras coladas', () => {
    // O defeito que este teste impede: montar o nome juntando texto visível com
    // um `sr-only` fazia o JSX colapsar o espaço, e o leitor de tela anunciava
    // "SISDEC— início".
    render(<SiteHeader />);

    const link = screen.getByRole('link', { name: /início/i });
    expect(link.getAttribute('href')).toBe('/');
    expect(link.getAttribute('aria-label')).toBe('SISDEC — ir para o início');
  });
});
