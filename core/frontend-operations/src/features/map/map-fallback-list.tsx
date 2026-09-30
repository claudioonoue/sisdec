import Link from 'next/link';
import type { PortalMetadata } from '@/types/metadata';
import type { MapReport } from '@/types/report';
import { labelFor } from '@/lib/enum-label';
import { PriorityBadge, StatusBadge } from '@/features/reports/report-badges';

/**
 * Os mesmos pontos do mapa, em lista.
 *
 * `RF-OP-46` e `RNF-OP-26` exigem que a tela continue utilizável quando o mapa
 * ou os tiles do OpenStreetMap não carregarem. A saída adotada não é um plano B
 * que aparece no erro — é uma lista que está **sempre** ali, aberta por um
 * `<details>`.
 *
 * Duas razões para preferir isso a um tratamento de exceção: um caminho que só
 * roda na falha é um caminho que ninguém testa; e a lista serve igualmente a
 * quem navega por teclado ou leitor de tela, para quem um mapa de alfinetes não
 * diz nada.
 */
export function MapFallbackList({
  points,
  metadata,
}: {
  points: MapReport[];
  metadata: PortalMetadata;
}) {
  if (points.length === 0) return null;

  return (
    <details className="rounded-lg border border-border bg-surface p-4">
      <summary className="cursor-pointer text-sm font-medium text-brand-strong">
        Ver os {points.length} pontos em lista
      </summary>

      <p className="mt-1 text-xs text-ink-muted">
        As mesmas ocorrências do mapa, em texto — úteis se o mapa não carregar e para navegação
        por teclado.
      </p>

      <ul className="mt-3 divide-y divide-border">
        {points.map((point) => (
          <li key={point.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
            <Link
              href={`/ocorrencias/${point.id}`}
              className="font-medium text-brand-strong hover:underline"
            >
              {point.protocolNumber}
            </Link>
            <span className="text-sm text-ink">{labelFor(metadata.reportTypes, point.type)}</span>
            <StatusBadge status={point.status} metadata={metadata} />
            <PriorityBadge priority={point.priority} metadata={metadata} />
          </li>
        ))}
      </ul>
    </details>
  );
}
