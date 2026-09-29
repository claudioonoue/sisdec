'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { signIn } from './actions';
import { initialSignInState } from './sign-in-state';

const FIELD_CLASSES =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70';

/**
 * Formulário de autenticação (RF-OP-01).
 *
 * O estado vem da Server Action: o e-mail digitado volta na recusa
 * (RNF-OP-06) e o botão fica bloqueado durante o envio (RNF-OP-28).
 */
export function LoginForm({ destination }: { destination: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialSignInState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="destino" value={destination} />

      {/* RNF-OP-35: a recusa é anunciada a leitores de tela pelo Alert. */}
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <div className="space-y-1.5">
        {/* RNF-OP-33: todo campo tem rótulo associado pelo `htmlFor`. */}
        <label htmlFor="email" className="block text-sm font-medium text-ink">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={state.email}
          required
          className={FIELD_CLASSES}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-ink">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={FIELD_CLASSES}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
