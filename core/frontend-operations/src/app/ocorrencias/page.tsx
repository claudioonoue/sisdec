import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Alert } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { getAssignableAgents, getDistricts } from '@/lib/agents';
import { ApiError, userMessageFor } from '@/lib/api-error';
import { getMetadata } from '@/lib/metadata';
import { PAGE_SIZE, listReports } from '@/lib/reports';
import { requireAgent } from '@/lib/session';
import { ReportFiltersForm } from '@/features/reports/report-filters';
import {
  type RawSearchParams,
  activeFilterCount,
  parseReportFilters,
  reportsHref,
  toApiQuery,
} from '@/features/reports/report-query';
import { ReportsPagination } from '@/features/reports/reports-pagination';
import { ReportsTable } from '@/features/reports/reports-table';

export const metadata: Metadata = {
  title: 'Ocorrências — SISDEC Operações',
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const agent = await requireAgent();
  const filters = parseReportFilters(params);

  const [portalMetadata, assignableAgents, districts] = await Promise.all([
    getMetadata(),
    getAssignableAgents(),
    getDistricts(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ocorrências"
        description="Registros recebidos pela Defesa Civil, com filtros e acesso ao atendimento."
      />

      <ReportFiltersForm
        filters={filters}
        assignableAgents={assignableAgents}
        districts={districts}
        currentAgentId={agent.id}
      />

      {/*
        A busca fica dentro de um Suspense com chave: trocar o recorte troca a
        chave, o esqueleto reaparece e a tabela anterior não fica no lugar
        fingindo ser o novo resultado (RF-OP-58).
      */}
      <Suspense key={JSON.stringify(filters)} fallback={<TableSkeleton />}>
        <ReportsResult filters={filters} metadata={portalMetadata} />
      </Suspense>
    </div>
  );
}

async function ReportsResult({
  filters,
  metadata: portalMetadata,
}: {
  filters: ReturnType<typeof parseReportFilters>;
  metadata: Awaited<ReturnType<typeof getMetadata>>;
}) {
  let page;
  try {
    page = await listReports(toApiQuery(filters));
  } catch (error) {
    // Recorte recusado pela API (data malformada na URL, valor fora da
    // enumeração) não pode derrubar a tela: os filtros continuam à vista para o
    // agente corrigir (RNF-OP-05).
    if (!(error instanceof ApiError)) throw error;
    return (
      <Alert tone="error" title="Não foi possível carregar a lista">
        {userMessageFor(error)}
      </Alert>
    );
  }

  if (page.data.length === 0) {
    return <EmptyState filters={filters} total={page.total} />;
  }

  return (
    <div className="space-y-4">
      <ReportsTable reports={page.data} metadata={portalMetadata} filters={filters} />
      <ReportsPagination
        filters={filters}
        total={page.total}
        page={page.page}
        pageSize={page.pageSize || PAGE_SIZE}
      />
    </div>
  );
}

/**
 * RF-OP-22: lista vazia explica o motivo, em vez de uma tabela sem linhas.
 *
 * São três motivos diferentes, e confundi-los engana o agente. O terceiro —
 * página além da última — parece o segundo se olharmos só para `data`, mas o
 * recorte tem resultados: eles estão em outra página. Acontece ao abrir um link
 * compartilhado cujo recorte encolheu desde então.
 */
function EmptyState({
  filters,
  total,
}: {
  filters: ReturnType<typeof parseReportFilters>;
  total: number;
}) {
  if (total > 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong bg-surface p-10 text-center">
        <p className="font-medium text-ink">Esta página não existe neste recorte</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
          O recorte atual tem {total} {total === 1 ? 'ocorrência' : 'ocorrências'}, mas nenhuma na
          página {filters.page}.
        </p>
        <Link
          href={reportsHref({ ...filters, page: 1 })}
          className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          Ir para a primeira página
        </Link>
      </div>
    );
  }

  const hasFilters = activeFilterCount(filters) > 0;

  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-surface p-10 text-center">
      <p className="font-medium text-ink">
        {hasFilters
          ? 'Nenhuma ocorrência atende aos filtros aplicados'
          : 'Nenhuma ocorrência registrada ainda'}
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
        {hasFilters
          ? 'Tente ampliar o recorte — remover a situação, alargar o período ou limpar a busca.'
          : 'Assim que a população registrar uma ocorrência pelo Portal do Cidadão, ela aparece aqui.'}
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando as ocorrências"
      className="space-y-2 rounded-lg border border-border bg-surface p-4"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-9 animate-pulse rounded bg-surface-muted" />
      ))}
    </div>
  );
}
