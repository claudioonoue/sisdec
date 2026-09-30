import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { MapPanel, type MapPoint } from '@/components/map/map-panel';
import { Alert } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { ApiError, userMessageFor } from '@/lib/api-error';
import { labelFor } from '@/lib/enum-label';
import { getMetadata } from '@/lib/metadata';
import { listReportsForMap } from '@/lib/reports';
import { requireAgent } from '@/lib/session';
import { NO_PRIORITY_SHAPE, PRIORITY_SHAPE, PRIORITY_TONE } from '@/types/display';
import type { MapReport } from '@/types/report';
import type { PortalMetadata } from '@/types/metadata';
import { MapFallbackList } from '@/features/map/map-fallback-list';
import { MapFilters } from '@/features/map/map-filters';
import { MapLegend, toneHex } from '@/features/map/map-legend';
import {
  type RawSearchParams,
  parseReportFilters,
  reportsHref,
  toApiQuery,
} from '@/features/reports/report-query';

export const metadata: Metadata = {
  title: 'Mapa — SISDEC Operações',
};

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  await requireAgent();
  const filters = parseReportFilters(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapa de ocorrências"
        description="Distribuição geográfica das ocorrências abertas."
        actions={
          <Link
            href={reportsHref(filters)}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-border-strong"
          >
            Ver como lista
          </Link>
        }
      />

      <MapFilters filters={filters} />

      <Suspense key={JSON.stringify(filters)} fallback={<MapSkeleton />}>
        <MapContent filters={filters} />
      </Suspense>
    </div>
  );
}

async function MapContent({ filters }: { filters: ReturnType<typeof parseReportFilters> }) {
  let response;
  let portalMetadata;

  try {
    [response, portalMetadata] = await Promise.all([
      listReportsForMap(toApiQuery(filters)),
      getMetadata(),
    ]);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return (
      <Alert tone="error" title="Não foi possível carregar o mapa">
        {userMessageFor(error)}
      </Alert>
    );
  }

  const points: MapPoint[] = response.data.map((report) => toMapPoint(report, portalMetadata));

  return (
    <div className="space-y-4">
      {/* RF-OP-65: o mapa não está mostrando tudo, e o agente precisa saber. */}
      {response.truncated ? (
        <Alert tone="warning" title="O mapa não está exibindo todas as ocorrências do recorte">
          O teto de pontos da consulta foi atingido. Estreite os filtros — por situação, tipo,
          prioridade ou período — para ver o recorte completo.
        </Alert>
      ) : null}

      {/* RF-OP-45: as sem coordenadas não somem em silêncio. */}
      {response.omittedWithoutCoordinates > 0 ? (
        <Alert tone="info">
          {response.omittedWithoutCoordinates}{' '}
          {response.omittedWithoutCoordinates === 1
            ? 'ocorrência do recorte não aparece no mapa'
            : 'ocorrências do recorte não aparecem no mapa'}{' '}
          por não ter coordenadas — o registro foi feito sem marcar o ponto.{' '}
          <Link href={reportsHref(filters)} className="font-medium underline">
            Veja o recorte completo na lista
          </Link>
          .
        </Alert>
      ) : null}

      {points.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-surface p-10 text-center">
          <p className="font-medium text-ink">Nenhuma ocorrência com coordenadas neste recorte</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
            Amplie os filtros, ou confira na lista as ocorrências registradas sem marcação de
            ponto no mapa.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-muted">
            {points.length === 1
              ? '1 ocorrência no mapa'
              : `${points.length} ocorrências no mapa`}
          </p>

          <MapPanel
            points={points}
            height="60vh"
            label={`Mapa com ${points.length} ocorrências. A lista equivalente está logo abaixo.`}
          />
        </>
      )}

      <MapLegend metadata={portalMetadata} />
      <MapFallbackList points={response.data} metadata={portalMetadata} />
    </div>
  );
}

/**
 * Traduz a ocorrência para o vocabulário do componente de mapa: cor, forma e
 * textos já em pt-BR. O `<ReportMap>` não conhece prioridade nem situação — é o
 * que permite trocá-lo sem tocar no domínio.
 */
function toMapPoint(report: MapReport, metadata: PortalMetadata): MapPoint {
  const prioridade = report.priority
    ? labelFor(metadata.priorities, report.priority)
    : 'Sem triagem';
  const situacao = labelFor(metadata.reportStatuses, report.status);
  const tipo = labelFor(metadata.reportTypes, report.type);

  return {
    id: report.id,
    latitude: report.latitude,
    longitude: report.longitude,
    color: report.priority ? toneHex(PRIORITY_TONE[report.priority]) : toneHex('neutral'),
    shape: report.priority ? PRIORITY_SHAPE[report.priority] : NO_PRIORITY_SHAPE,
    label: `${report.protocolNumber} — ${tipo}, ${situacao}, prioridade ${prioridade}`,
    // RF-OP-43: resumo ao acionar o ponto, com acesso ao detalhe.
    popup: {
      title: report.protocolNumber,
      lines: [tipo, `Situação: ${situacao}`, `Prioridade: ${prioridade}`],
      href: `/ocorrencias/${report.id}`,
      hrefLabel: 'Abrir a ocorrência',
    },
  };
}

function MapSkeleton() {
  return (
    <div role="status" aria-label="Carregando o mapa" className="space-y-4">
      <div className="h-[60vh] animate-pulse rounded-lg bg-surface-muted" />
      <div className="h-20 animate-pulse rounded-lg bg-surface-muted" />
    </div>
  );
}
