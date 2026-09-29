import type { ReactNode } from 'react';

export type AlertTone = 'error' | 'success' | 'warning' | 'info';

const TONE_CLASSES: Record<AlertTone, string> = {
  error: 'border-danger/40 bg-danger-soft text-danger',
  success: 'border-success/40 bg-success-soft text-success',
  warning: 'border-warning/40 bg-warning-soft text-warning',
  info: 'border-brand/30 bg-brand-soft text-brand-strong',
};

/**
 * Mensagem de erro, confirmação ou aviso.
 *
 * RNF-OP-35: o conteúdo é anunciado a leitores de tela. Erros usam
 * `role="alert"`, que interrompe a leitura corrente — apropriado para uma
 * operação recusada; os demais usam `aria-live="polite"`, que espera a pausa.
 *
 * RNF-OP-31: o tom nunca é a única pista. Cada mensagem traz texto, e as que
 * precisam de título o recebem por `title`.
 */
export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
}) {
  const isError = tone === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`rounded-md border px-4 py-3 text-sm ${TONE_CLASSES[tone]}`}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? 'mt-1' : undefined}>{children}</div>
    </div>
  );
}
