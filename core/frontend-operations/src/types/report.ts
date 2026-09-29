import type { Priority, ReportCategory, ReportStatus, ReportType } from './enums';

/** Agente como aparece dentro de uma ocorrência: só o necessário para exibir. */
export interface AgentSummary {
  id: string;
  name: string;
}

/** Linha da listagem — `GET /reports`. */
export interface ReportListItem {
  id: string;
  protocolNumber: string;
  category: ReportCategory;
  type: ReportType;
  status: ReportStatus;
  priority: Priority | null;
  district: string;
  createdAt: string;
  assignedTo: AgentSummary | null;
}

/** Dados de contato do cidadão; ausentes quando o registro é anônimo. */
export interface CitizenSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface ReportAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeInBytes: number;
  /** Caminho servido pela API — o portal nunca acessa disco (RNF-OP-18). */
  url: string;
}

export interface ReportUpdateEntry {
  id: string;
  fromStatus: ReportStatus | null;
  toStatus: ReportStatus | null;
  comment: string | null;
  /** Quando verdadeiro, o texto aparece na consulta pública por protocolo. */
  visibleToCitizen: boolean;
  createdAt: string;
  agent: AgentSummary;
}

/** Detalhe completo — `GET /reports/:id`. */
export interface ReportDetail extends ReportListItem {
  description: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  updatedAt: string;
  resolvedAt: string | null;
  citizen: CitizenSummary | null;
  attachments: ReportAttachment[];
  updates: ReportUpdateEntry[];
  suggestedPriority: Priority | null;
}

/**
 * Ordenação aceita por `GET /reports` (RF-API-71). Os valores são do contrato da
 * API, e por isso moram aqui junto das enumerações (RNF-OP-45).
 */
export const REPORT_SORT_FIELDS = ['createdAt', 'priority'] as const;
export type ReportSortField = (typeof REPORT_SORT_FIELDS)[number];

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export function isReportSortField(value: string): value is ReportSortField {
  return (REPORT_SORT_FIELDS as readonly string[]).includes(value);
}

export function isSortDirection(value: string): value is SortDirection {
  return (SORT_DIRECTIONS as readonly string[]).includes(value);
}
