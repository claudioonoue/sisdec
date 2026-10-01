import type { ReactNode } from 'react';

/**
 * Campo de formulário com rótulo associado e erro anunciado.
 *
 * RNF-CID-16: todo campo tem `label` ligado por `htmlFor`. RNF-CID-05: o erro
 * aparece junto do campo, e não num resumo no topo. `aria-describedby` e
 * `aria-invalid` fazem o leitor de tela anunciá-lo ao chegar no campo.
 */
export function Field({
  id,
  label,
  error,
  hint,
  optional = false,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: (props: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  }) => ReactNode;
}) {
  const hintId = hint ? `${id}-ajuda` : undefined;
  const errorId = error ? `${id}-erro` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-semibold">
        {label}
        {optional ? (
          <span className="ml-2 text-sm font-normal text-ink-muted">(opcional)</span>
        ) : null}
      </label>

      {hint ? (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}

      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}

      {error ? (
        <p id={errorId} role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Classes do controle, reunidas para que os campos não divirjam entre etapas. */
export const CONTROL_CLASS =
  'w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-ink ' +
  'aria-invalid:border-danger aria-invalid:border-2';
