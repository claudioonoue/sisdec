import type { PortalMetadata } from '@/types/metadata';
import type { ReportUpdateEntry } from '@/types/report';
import { labelFor } from '@/lib/enum-label';
import { formatDateTime } from '@/lib/format';

/**
 * Histórico de andamentos (RF-OP-29).
 *
 * Três exigências moldam esta lista:
 *
 * - **RNF-OP-36** — autor e data em toda mudança de situação, para que a ação de
 *   cada agente seja rastreável na interface;
 * - **RNF-OP-37** — o que é visível ao cidadão se distingue do que é interno. A
 *   marca fica no andamento visível, e não no interno: o interno é o padrão, e
 *   marcar o padrão treina o olho a ignorar a marca;
 * - **RNF-OP-38** — nenhuma ação de editar ou excluir. O `ReportUpdate` é
 *   somente-adição na API, e oferecer o botão prometeria o que ela recusaria.
 */
export function ReportHistory({
  updates,
  metadata,
}: {
  updates: ReportUpdateEntry[];
  metadata: PortalMetadata;
}) {
  if (updates.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        Nenhum andamento registrado. A ocorrência ainda não foi analisada.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {updates.map((update) => (
        <li
          key={update.id}
          className="rounded-md border border-border bg-surface-muted/50 px-4 py-3 text-sm"
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-ink">{transitionText(update, metadata)}</span>

            {update.visibleToCitizen ? (
              <span className="rounded-full border border-brand/30 bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-strong">
                Visível ao cidadão
              </span>
            ) : (
              <span className="text-xs text-ink-muted">Interno</span>
            )}
          </div>

          {update.comment ? <p className="mt-1.5 text-ink">{update.comment}</p> : null}

          <p className="mt-1.5 text-xs text-ink-muted">
            {update.agent.name} · <time dateTime={update.createdAt}>{formatDateTime(update.createdAt)}</time>
          </p>
        </li>
      ))}
    </ol>
  );
}

/**
 * Descreve o andamento: uma transição de situação, ou uma observação sem
 * mudança de estado — que é o que `toStatus` nulo significa no modelo.
 */
function transitionText(update: ReportUpdateEntry, metadata: PortalMetadata): string {
  if (!update.toStatus) return 'Observação';

  const to = labelFor(metadata.reportStatuses, update.toStatus);
  if (!update.fromStatus) return `Situação definida como ${to}`;

  return `${labelFor(metadata.reportStatuses, update.fromStatus)} → ${to}`;
}
