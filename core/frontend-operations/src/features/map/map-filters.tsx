'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useMetadata } from '@/features/metadata/metadata-provider';
import { type ReportFilters, activeFilterCount, buildReportSearch } from '@/features/reports/report-query';

const FIELD = 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink';
const LABEL = 'block text-xs font-medium text-ink-muted';

/**
 * Filtros do mapa (RF-OP-44): situação, tipo, prioridade e período.
 *
 * Reaproveitam o mesmo módulo de recorte da listagem — os nomes dos parâmetros
 * são os mesmos, então um recorte montado aqui abre na lista e vice-versa. Não
 * há filtro de bairro nem busca: no mapa, o recorte geográfico é a própria
 * visão, e uma busca por protocolo levaria a um ponto só.
 */
export function MapFilters({ filters }: { filters: ReportFilters }) {
  const metadata = useMetadata();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function apply(changes: Partial<ReportFilters>) {
    const proximos = { ...filters, ...changes, page: 1 };
    startTransition(() => router.replace(`/mapa${buildReportSearch(proximos)}`, { scroll: false }));
  }

  const ativos = activeFilterCount(filters);

  return (
    <section aria-labelledby="filtros-mapa" className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="filtros-mapa" className="text-sm font-semibold text-ink">
          Filtros
          {ativos > 0 ? (
            <span className="ml-2 font-normal text-ink-muted">
              ({ativos} {ativos === 1 ? 'ativo' : 'ativos'})
            </span>
          ) : null}
        </h2>

        {ativos > 0 ? (
          <Link href="/mapa" className="text-sm font-medium text-brand-strong hover:underline">
            Limpar filtros
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          id="mapa-situacao"
          label="Situação"
          value={filters.status}
          options={metadata.reportStatuses}
          onChange={(status) => apply({ status })}
          allLabel="Abertas"
        />

        <Select
          id="mapa-prioridade"
          label="Prioridade"
          value={filters.priority}
          options={metadata.priorities}
          onChange={(priority) => apply({ priority })}
        />

        <Select
          id="mapa-tipo"
          label="Tipo"
          value={filters.type}
          options={metadata.reportTypes}
          onChange={(type) => apply({ type })}
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="mapa-de" className={LABEL}>
              De
            </label>
            <input
              id="mapa-de"
              type="date"
              value={filters.from}
              onChange={(event) => apply({ from: event.target.value })}
              className={`${FIELD} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="mapa-ate" className={LABEL}>
              até
            </label>
            <input
              id="mapa-ate"
              type="date"
              value={filters.to}
              onChange={(event) => apply({ to: event.target.value })}
              className={`${FIELD} mt-1`}
            />
          </div>
        </div>
      </div>

      <p aria-live="polite" className="mt-3 h-4 text-xs text-ink-muted">
        {pending ? 'Atualizando o mapa…' : ''}
      </p>
    </section>
  );
}

function Select({
  id,
  label,
  value,
  options,
  onChange,
  allLabel = 'Todas',
}: {
  id: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  allLabel?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${FIELD} mt-1`}
      >
        {/*
          Sem filtro de situação a API devolve só as abertas — o rótulo diz isso
          em vez de "Todas", que prometeria um recorte que a rota não faz.
        */}
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
