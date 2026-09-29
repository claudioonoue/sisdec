import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Alert } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { ApiError, userMessageFor } from '@/lib/api-error';
import { type DashboardPeriod, getByDistrict, getSummary, getTimeline } from '@/lib/dashboard';
import { labelFor } from '@/lib/enum-label';
import { getMetadata } from '@/lib/metadata';
import { requireAgent } from '@/lib/session';
import { NO_PRIORITY_KEY } from '@/types/dashboard';
import { CountBars, type CountBarRow } from '@/features/dashboard/count-bars';
import { HeadlineCards } from '@/features/dashboard/headline-cards';
import { PeriodFilter } from '@/features/dashboard/period-filter';
import { TimelineChart } from '@/features/dashboard/timeline-chart';
import type { RawSearchParams } from '@/features/reports/report-query';

export const metadata: Metadata = {
  title: 'Painel — SISDEC Operações',
};

/** Tipos exibidos na distribuição; o resto vira uma linha de resumo. */
const TOP_TYPES = 6;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const agent = await requireAgent();

  const period: DashboardPeriod = {
    from: single(params.de),
    to: single(params.ate),
  };
  // O recorte do painel acompanha os links para a lista, de modo que o número
  // no cartão e o total na lista sejam o mesmo número (RF-OP-13).
  const periodSearch = [
    period.from ? `de=${period.from}` : '',
    period.to ? `ate=${period.to}` : '',
  ]
    .filter(Boolean)
    .join('&');

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bom trabalho, ${agent.name.split(' ')[0]}`}
        description="Panorama das ocorrências da Defesa Civil."
      />

      <PeriodFilter from={period.from ?? ''} to={period.to ?? ''} />

      <Suspense key={periodSearch} fallback={<PanelSkeleton />}>
        <DashboardContent period={period} periodSearch={periodSearch} />
      </Suspense>
    </div>
  );
}

async function DashboardContent({
  period,
  periodSearch,
}: {
  period: DashboardPeriod;
  periodSearch: string;
}) {
  const prefix = periodSearch ? `&${periodSearch}` : '';

  let summary;
  let districts;
  let timeline;
  let portalMetadata;

  try {
    [summary, districts, timeline, portalMetadata] = await Promise.all([
      getSummary(period),
      getByDistrict(period),
      getTimeline(period),
      getMetadata(),
    ]);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return (
      <Alert tone="error" title="Não foi possível carregar os indicadores">
        {userMessageFor(error)}
      </Alert>
    );
  }

  const statusRows: CountBarRow[] = summary.byStatus.map((row) => ({
    key: row.key,
    label: labelFor(portalMetadata.reportStatuses, row.key as never),
    total: row.total,
    href: `/ocorrencias?situacao=${row.key}${prefix}`,
  }));

  const priorityRows: CountBarRow[] = summary.byPriority.map((row) => ({
    key: row.key,
    // `SEM_PRIORIDADE` é chave do painel, não valor da enumeração: não tem
    // rótulo nos metadados, e as ocorrências ali só esperam a triagem.
    label:
      row.key === NO_PRIORITY_KEY
        ? 'Aguardando triagem'
        : labelFor(portalMetadata.priorities, row.key as never),
    total: row.total,
    // A API não tem filtro para "sem prioridade" — ela é a ausência de um valor,
    // não um valor. Um link para as recebidas daria um número diferente do
    // exibido, porque a prioridade só é definida ao concluir a triagem e as
    // ocorrências em triagem também estão sem ela.
    href: row.key === NO_PRIORITY_KEY ? undefined : `/ocorrencias?prioridade=${row.key}${prefix}`,
    note:
      row.key === NO_PRIORITY_KEY
        ? 'Ocorrências que ainda não tiveram a triagem concluída — a lista não tem um recorte equivalente.'
        : undefined,
  }));

  const typeRows: CountBarRow[] = summary.byType.slice(0, TOP_TYPES).map((row) => ({
    key: row.key,
    label: labelFor(portalMetadata.reportTypes, row.key as never),
    total: row.total,
    href: `/ocorrencias?tipo=${row.key}${prefix}`,
  }));

  const districtRows: CountBarRow[] = districts.map((row) => ({
    key: row.key,
    label: row.key,
    total: row.total,
    href: `/ocorrencias?bairro=${encodeURIComponent(row.key)}${prefix}`,
  }));

  const outrosTipos = summary.byType.length - typeRows.length;

  return (
    <div className="space-y-6">
      <HeadlineCards
        summary={summary}
        metadata={portalMetadata}
        periodSearch={prefix}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Por situação">
          <CountBars rows={statusRows} />
        </Panel>

        <Panel title="Por prioridade">
          <CountBars rows={priorityRows} />
        </Panel>

        <Panel
          title="Por tipo"
          note={outrosTipos > 0 ? `Exibindo os ${TOP_TYPES} mais frequentes de ${summary.byType.length} tipos com registros.` : undefined}
        >
          <CountBars rows={typeRows} />
        </Panel>

        <Panel title="Por bairro">
          <CountBars rows={districtRows} />
        </Panel>
      </div>

      <Panel title="Volume de registros por dia">
        <TimelineChart points={timeline} />
      </Panel>
    </div>
  );
}

function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
      {note ? <p className="mt-0.5 text-xs text-ink-muted">{note}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function PanelSkeleton() {
  return (
    <div role="status" aria-label="Carregando os indicadores" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-surface-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-lg bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}

function single(value: string | string[] | undefined): string | undefined {
  const one = Array.isArray(value) ? value[0] : value;
  return one?.trim() || undefined;
}
