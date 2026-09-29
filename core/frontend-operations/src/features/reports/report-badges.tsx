import type { Priority, ReportStatus } from '@/types/enums';
import type { PortalMetadata } from '@/types/metadata';
import { PRIORITY_TONE, STATUS_TONE } from '@/types/display';
import { Badge } from '@/components/ui/badge';
import { labelFor } from '@/lib/enum-label';

/**
 * Situação e prioridade sempre pelo par cor + rótulo em pt-BR, com o rótulo
 * vindo dos metadados da API (RF-OP-57).
 */

export function StatusBadge({
  status,
  metadata,
}: {
  status: ReportStatus;
  metadata: PortalMetadata;
}) {
  return <Badge tone={STATUS_TONE[status]} label={labelFor(metadata.reportStatuses, status)} />;
}

export function PriorityBadge({
  priority,
  metadata,
}: {
  priority: Priority | null;
  metadata: PortalMetadata;
}) {
  // Prioridade nula não é "nenhuma": é uma ocorrência que ainda não passou pela
  // triagem. Dizê-lo é mais útil ao agente do que um traço.
  if (!priority) {
    return <Badge tone="muted" label="Sem triagem" />;
  }

  return <Badge tone={PRIORITY_TONE[priority]} label={labelFor(metadata.priorities, priority)} />;
}
