import Link from 'next/link';
import type { PortalMetadata } from '@/types/metadata';
import type { ReportListItem, ReportSortField } from '@/types/report';
import { labelFor } from '@/lib/enum-label';
import { formatDateTime } from '@/lib/format';
import { PriorityBadge, StatusBadge } from './report-badges';
import { type ReportFilters, reportDetailHref, reportsHref } from './report-query';

/**
 * Lista de ocorrências em **tabela semântica** (RNF-OP-34): `<th scope="col">`
 * em cada coluna, para que um leitor de tela anuncie o cabeçalho junto da célula.
 *
 * Em telas estreitas as colunas menos decisivas somem em vez de provocar rolagem
 * horizontal (RNF-OP-40): ficam protocolo, tipo, situação e prioridade.
 */
export function ReportsTable({
  reports,
  metadata,
  filters,
}: {
  reports: ReportListItem[];
  metadata: PortalMetadata;
  filters: ReportFilters;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          Ocorrências registradas, com protocolo, tipo, categoria, situação, prioridade, bairro,
          responsável e data de registro.
        </caption>
        <thead>
          <tr className="border-b border-border bg-surface-muted text-left">
            <Th>Protocolo</Th>
            <Th>Tipo</Th>
            <Th className="hidden lg:table-cell">Categoria</Th>
            <Th>Situação</Th>
            <SortableTh field="priority" filters={filters}>
              Prioridade
            </SortableTh>
            <Th className="hidden lg:table-cell">Bairro</Th>
            <Th className="hidden xl:table-cell">Responsável</Th>
            <SortableTh field="createdAt" filters={filters} className="hidden md:table-cell">
              Registrada em
            </SortableTh>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
              <td className="px-4 py-3">
                <Link
                  href={reportDetailHref(report.id, filters)}
                  className="font-medium text-brand-strong hover:underline"
                >
                  {report.protocolNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink">{labelFor(metadata.reportTypes, report.type)}</td>
              <td className="hidden px-4 py-3 text-ink-muted lg:table-cell">
                {labelFor(metadata.reportCategories, report.category)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={report.status} metadata={metadata} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={report.priority} metadata={metadata} />
              </td>
              <td className="hidden px-4 py-3 text-ink-muted lg:table-cell">{report.district}</td>
              <td className="hidden px-4 py-3 text-ink-muted xl:table-cell">
                {report.assignedTo?.name ?? 'Sem responsável'}
              </td>
              <td className="hidden whitespace-nowrap px-4 py-3 text-ink-muted md:table-cell">
                {formatDateTime(report.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={`px-4 py-2.5 text-xs font-semibold text-ink-muted ${className}`}>
      {children}
    </th>
  );
}

/**
 * Cabeçalho que ordena (RF-OP-19). A ordenação é da API — o portal só troca o
 * endereço, porque ordenar a página corrente reordenaria vinte linhas em vez da
 * lista (`RNF-OP-20`).
 *
 * `aria-sort` informa o estado a leitores de tela; a seta é reforço visual.
 */
function SortableTh({
  field,
  filters,
  className = '',
  children,
}: {
  field: ReportSortField;
  filters: ReportFilters;
  className?: string;
  children: React.ReactNode;
}) {
  const active = filters.sort === field;
  const nextOrder = active && filters.order === 'desc' ? 'asc' : 'desc';
  const direction = filters.order === 'asc' ? 'crescente' : 'decrescente';

  return (
    <th
      scope="col"
      aria-sort={active ? (filters.order === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`px-4 py-2.5 text-xs font-semibold text-ink-muted ${className}`}
    >
      <Link
        href={reportsHref({ ...filters, sort: field, order: nextOrder, page: 1 })}
        scroll={false}
        className="inline-flex items-center gap-1 hover:text-ink"
      >
        {children}
        <span aria-hidden="true" className={active ? 'text-brand-strong' : 'text-border-strong'}>
          {active ? (filters.order === 'asc' ? '↑' : '↓') : '↕'}
        </span>
        <span className="sr-only">
          {active ? `— ordenado em ordem ${direction}. Acionar inverte a ordem.` : '— ordenar por esta coluna'}
        </span>
      </Link>
    </th>
  );
}
