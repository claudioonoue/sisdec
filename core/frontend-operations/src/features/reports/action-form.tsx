'use client';

import { useActionState, useEffect, useRef, type ReactNode } from 'react';
import { Alert } from '@/components/ui/alert';
import { type ActionState, initialActionState } from './action-state';

/**
 * Casca comum das ações de atendimento.
 *
 * Concentra o que todas as ações precisam fazer igual, e que erraríamos de
 * formas diferentes se cada formulário resolvesse por conta:
 *
 * - **RNF-OP-28** — o botão é bloqueado durante a requisição, para que dois
 *   acionamentos não registrem dois andamentos;
 * - **RNF-OP-07** — as ações difíceis de reverter pedem confirmação, e o texto
 *   da pergunta é de quem chama, porque só ele sabe o que está em jogo;
 * - **RNF-OP-35** — o resultado é anunciado a leitores de tela pelo `Alert`;
 * - **RNF-OP-08** — o sucesso é confirmado visualmente, e não deduzido da tela
 *   ter mudado.
 */
export function ActionForm({
  action,
  reportId,
  submitLabel,
  pendingLabel,
  confirmation,
  tone = 'default',
  disabled = false,
  children,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  reportId: string;
  submitLabel: string;
  pendingLabel: string;
  /** Pergunta de confirmação. Sem ela, a ação é executada direto. */
  confirmation?: string;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  children?: ReactNode | ((state: ActionState) => ReactNode);
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Depois de uma ação aceita, o formulário volta ao início — o comentário do
    // andamento anterior não deve ficar no campo, convidando a reenviá-lo.
    if (state.status === 'success') form.current?.reset();
  }, [state.status]);

  return (
    <form
      ref={form}
      action={formAction}
      onSubmit={(event) => {
        if (confirmation && !window.confirm(confirmation)) event.preventDefault();
      }}
      className="space-y-3"
    >
      <input type="hidden" name="reportId" value={reportId} />

      {typeof children === 'function' ? children(state) : children}

      {state.message ? (
        <Alert tone={state.status === 'error' ? 'error' : 'success'}>{state.message}</Alert>
      ) : null}

      <button
        type="submit"
        disabled={pending || disabled}
        className={`w-full rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          tone === 'danger'
            ? 'bg-danger text-white hover:brightness-110'
            : 'bg-brand text-white hover:bg-brand-strong'
        }`}
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
