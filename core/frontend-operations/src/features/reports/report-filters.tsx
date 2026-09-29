'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AgentSummary } from '@/types/report';
import { useMetadata } from '@/features/metadata/metadata-provider';
import {
  type ReportFilters,
  activeFilterCount,
  reportsHref,
} from './report-query';

const FIELD =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink disabled:opacity-60';
const LABEL = 'block text-xs font-medium text-ink-muted';

/** Espera entre a última tecla e a requisição (RNF-OP-21). */
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Filtros da lista de ocorrências (RF-OP-16, RF-OP-17).
 *
 * Escreve na URL em vez de guardar estado: é dali que a tela do servidor lê o
 * recorte, e é o que torna a lista filtrada recarregável e compartilhável
 * (RF-OP-21). Os rótulos das enumerações vêm dos metadados — o formulário não
 * conhece nenhum valor da API (RNF-OP-45).
 */
export function ReportFiltersForm({
  filters,
  assignableAgents,
  districts,
  currentAgentId,
}: {
  filters: ReportFilters;
  assignableAgents: AgentSummary[];
  districts: string[];
  currentAgentId: string;
}) {
  const metadata = useMetadata();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.search);

  // A busca é o único campo que não espera o envio: ela dispara sozinha depois
  // da pausa na digitação. Os demais aplicam no `change`, que já é um gesto.
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchFromUrl = useRef(filters.search);

  useEffect(() => {
    // A URL mudou por fora (voltar do detalhe, limpar filtros): o campo segue a
    // URL, em vez de manter o que o agente havia digitado numa tela anterior.
    if (searchFromUrl.current !== filters.search) {
      searchFromUrl.current = filters.search;
      setSearch(filters.search);
    }
  }, [filters.search]);

  useEffect(() => () => clearTimeout(debounce.current ?? undefined), []);

  function apply(changes: Partial<ReportFilters>) {
    // Qualquer mudança de recorte volta para a primeira página: manter a página
    // 7 num recorte com duas páginas mostraria uma lista vazia sem explicação.
    startTransition(() => {
      router.replace(reportsHref({ ...filters, ...changes, page: 1 }), { scroll: false });
    });
  }

  function onSearchChange(value: string) {
    setSearch(value);
    clearTimeout(debounce.current ?? undefined);
    debounce.current = setTimeout(() => {
      searchFromUrl.current = value;
      apply({ search: value });
    }, SEARCH_DEBOUNCE_MS);
  }

  const active = activeFilterCount(filters);
  const mine = filters.assignedToId === currentAgentId;

  return (
    <section aria-labelledby="filtros" className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="filtros" className="text-sm font-semibold text-ink">
          Filtros
          {active > 0 ? (
            <span className="ml-2 font-normal text-ink-muted">
              ({active} {active === 1 ? 'ativo' : 'ativos'})
            </span>
          ) : null}
        </h2>

        <div className="flex items-center gap-2">
          {/*
            O recorte "em aberto" é para onde o painel aponta (RF-OP-13), e
            precisa ser visível e removível também aqui — senão o agente chega
            por um indicador e não entende por que a lista está menor.
          */}
          <button
            type="button"
            aria-pressed={filters.open}
            onClick={() => apply({ open: !filters.open })}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              filters.open
                ? 'border-brand bg-brand-soft text-brand-strong'
                : 'border-border text-ink-muted hover:border-border-strong hover:text-ink'
            }`}
          >
            Em aberto
          </button>

          {/* RF-OP-20: atalho para as ocorrências do próprio agente. */}
          <button
            type="button"
            aria-pressed={mine}
            onClick={() => apply({ assignedToId: mine ? '' : currentAgentId })}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              mine
                ? 'border-brand bg-brand-soft text-brand-strong'
                : 'border-border text-ink-muted hover:border-border-strong hover:text-ink'
            }`}
          >
            Minhas ocorrências
          </button>

          {active > 0 ? (
            <Link
              href={reportsHref({ sort: filters.sort, order: filters.order })}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-brand-strong hover:underline"
            >
              Limpar filtros
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label htmlFor="busca" className={LABEL}>
            Buscar por protocolo ou descrição
          </label>
          <input
            id="busca"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="SISDEC-2026-000123 ou parte do relato"
            className={`${FIELD} mt-1`}
          />
        </div>

        <Select
          id="situacao"
          label="Situação"
          value={filters.status}
          options={metadata.reportStatuses}
          onChange={(status) => apply({ status })}
        />

        <Select
          id="prioridade"
          label="Prioridade"
          value={filters.priority}
          options={metadata.priorities}
          onChange={(priority) => apply({ priority })}
        />

        <Select
          id="categoria"
          label="Categoria"
          value={filters.category}
          options={metadata.reportCategories}
          onChange={(category) => apply({ category })}
        />

        <Select
          id="tipo"
          label="Tipo"
          value={filters.type}
          options={metadata.reportTypes}
          onChange={(type) => apply({ type })}
        />

        <div>
          <label htmlFor="bairro" className={LABEL}>
            Bairro
          </label>
          <input
            id="bairro"
            list="bairros"
            defaultValue={filters.district}
            onChange={(event) => apply({ district: event.target.value })}
            className={`${FIELD} mt-1`}
          />
          <datalist id="bairros">
            {districts.map((district) => (
              <option key={district} value={district} />
            ))}
          </datalist>
        </div>

        {/*
          O responsável só aparece para quem pode obter a lista de agentes:
          GET /reports/assignable-agents é restrito a coordenador e administrador.
          Para o agente comum, o recorte equivalente é "Minhas ocorrências".
        */}
        {assignableAgents.length > 0 ? (
          <div>
            <label htmlFor="responsavel" className={LABEL}>
              Responsável
            </label>
            <select
              id="responsavel"
              value={filters.assignedToId}
              onChange={(event) => apply({ assignedToId: event.target.value })}
              className={`${FIELD} mt-1`}
            >
              <option value="">Todos</option>
              {assignableAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label htmlFor="de" className={LABEL}>
            Registradas de
          </label>
          <input
            id="de"
            type="date"
            value={filters.from}
            onChange={(event) => apply({ from: event.target.value })}
            className={`${FIELD} mt-1`}
          />
        </div>

        <div>
          <label htmlFor="ate" className={LABEL}>
            até
          </label>
          <input
            id="ate"
            type="date"
            value={filters.to}
            onChange={(event) => apply({ to: event.target.value })}
            className={`${FIELD} mt-1`}
          />
        </div>
      </div>

      {/* RF-OP-58: a busca em curso é anunciada, e não só sugerida pelo atraso. */}
      <p aria-live="polite" className="mt-3 h-4 text-xs text-ink-muted">
        {pending ? 'Atualizando a lista…' : ''}
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
}: {
  id: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
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
        <option value="">Todas</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
