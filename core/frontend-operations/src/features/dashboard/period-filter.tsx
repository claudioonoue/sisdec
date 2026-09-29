'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

const FIELD = 'rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink';

/** Atalhos de período, em dias contados para trás a partir de hoje. */
const SHORTCUTS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
];

/**
 * Recorte do painel por período (RF-OP-14).
 *
 * Escreve na URL, como os filtros da lista: o painel é renderizado no servidor a
 * partir dela, e o recorte fica recarregável e compartilhável.
 */
export function PeriodFilter({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function apply(next: { from?: string; to?: string }) {
    const params = new URLSearchParams();
    const novoDe = next.from ?? from;
    const novoAte = next.to ?? to;
    if (novoDe) params.set('de', novoDe);
    if (novoAte) params.set('ate', novoAte);

    const search = params.toString();
    startTransition(() => router.replace(search ? `/?${search}` : '/', { scroll: false }));
  }

  function applyShortcut(days: number) {
    const hoje = new Date();
    const inicio = new Date(hoje.getTime() - days * 24 * 60 * 60 * 1000);
    const iso = (d: Date) => new Intl.DateTimeFormat('en-CA').format(d);
    apply({ from: iso(inicio), to: iso(hoje) });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
      <div>
        <label htmlFor="painel-de" className="block text-xs font-medium text-ink-muted">
          De
        </label>
        <input
          id="painel-de"
          type="date"
          value={from}
          onChange={(event) => apply({ from: event.target.value })}
          className={`${FIELD} mt-1`}
        />
      </div>

      <div>
        <label htmlFor="painel-ate" className="block text-xs font-medium text-ink-muted">
          até
        </label>
        <input
          id="painel-ate"
          type="date"
          value={to}
          onChange={(event) => apply({ to: event.target.value })}
          className={`${FIELD} mt-1`}
        />
      </div>

      <div className="flex items-center gap-2">
        {SHORTCUTS.map((shortcut) => (
          <button
            key={shortcut.days}
            type="button"
            onClick={() => applyShortcut(shortcut.days)}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
          >
            {shortcut.label}
          </button>
        ))}

        {from || to ? (
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-brand-strong hover:underline"
          >
            Todo o período
          </Link>
        ) : null}
      </div>

      <p aria-live="polite" className="ml-auto text-xs text-ink-muted">
        {pending ? 'Atualizando os indicadores…' : from || to ? 'Recorte aplicado' : ''}
      </p>
    </div>
  );
}
