import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Field } from './field';

describe('Field', () => {
  it('associa o rótulo ao controle (RNF-CID-16)', () => {
    render(
      <Field id="district" label="Bairro">
        {(props) => <input {...props} />}
      </Field>,
    );

    expect(screen.getByLabelText('Bairro')).toBeDefined();
  });

  it('marca o campo como inválido e anuncia o erro junto dele', () => {
    render(
      <Field id="district" label="Bairro" error="Informe o bairro.">
        {(props) => <input {...props} />}
      </Field>,
    );

    const campo = screen.getByLabelText('Bairro');
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    expect(campo.getAttribute('aria-describedby')).toContain('district-erro');
    expect(screen.getByRole('alert').textContent).toBe('Informe o bairro.');
  });

  it('não marca como inválido quando não há erro', () => {
    render(
      <Field id="district" label="Bairro">
        {(props) => <input {...props} />}
      </Field>,
    );

    expect(screen.getByLabelText('Bairro').getAttribute('aria-invalid')).toBe('false');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('liga a dica ao campo, para o leitor de tela anunciá-la', () => {
    render(
      <Field id="address" label="Endereço" hint="Rua e número.">
        {(props) => <input {...props} />}
      </Field>,
    );

    expect(screen.getByLabelText('Endereço').getAttribute('aria-describedby')).toContain(
      'address-ajuda',
    );
  });

  it('referencia dica e erro ao mesmo tempo quando ambos existem', () => {
    render(
      <Field id="email" label="E-mail" hint="Usamos só para dúvidas." error="Confira o e-mail.">
        {(props) => <input {...props} />}
      </Field>,
    );

    const descrito = screen.getByLabelText(/E-mail/).getAttribute('aria-describedby');
    expect(descrito).toContain('email-ajuda');
    expect(descrito).toContain('email-erro');
  });

  it('sinaliza o campo opcional em texto (RNF-CID-04)', () => {
    render(
      <Field id="phone" label="Telefone" optional>
        {(props) => <input {...props} />}
      </Field>,
    );

    expect(screen.getByText('(opcional)')).toBeDefined();
  });
});
