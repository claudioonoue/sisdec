import { formatDateTime } from '@/lib/format';
import { labelOf } from '@/lib/metadata';
import type { EnumOption } from '@/types/metadata';
import type { ReportStatus } from '@/types/enums';
import type { PublicReportUpdate } from '@/types/report';

/**
 * Histórico visível ao cidadão (RF-CID-33).
 *
 * A API já filtra: só chegam aqui os andamentos marcados como visíveis, e sem o
 * agente autor. O componente não precisa — nem consegue — esconder nada: o que não
 * deve ser mostrado simplesmente não existe no tipo.
 */
export function ReportTimeline({
  updates,
  statuses,
}: {
  updates: PublicReportUpdate[];
  statuses: EnumOption<ReportStatus>[];
}) {
  if (updates.length === 0) {
    return (
      <p className="text-ink-muted">
        Ainda não há andamentos registrados. Quando a equipe atualizar a ocorrência, a informação
        aparece aqui.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {updates.map((update, index) => (
        <li
          key={`${update.createdAt}-${index}`}
          className="border-l-4 border-brand pl-4"
        >
          <p className="text-sm text-ink-muted">{formatDateTime(update.createdAt)}</p>

          {update.toStatus ? (
            <p className="font-semibold">
              Situação alterada para {labelOf(statuses, update.toStatus).toLowerCase()}
            </p>
          ) : null}

          {update.comment ? (
            <p className="mt-1 whitespace-pre-line break-words text-ink">{update.comment}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
