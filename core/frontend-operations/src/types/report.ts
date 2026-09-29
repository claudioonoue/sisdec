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

/**
 * Endpoint que executa uma transição, relativo a `/reports/:id`.
 * Valor do contrato da API, e por isso declarado aqui (RNF-OP-45).
 */
export type TransitionOwner = 'triage/start' | 'triage' | 'status';

/**
 * Transição que o agente autenticado pode executar agora (RF-API-72).
 *
 * A lista vem pronta da API, resolvida para quem perguntou. O portal **não**
 * mantém cópia da tabela de transições: ele oferece o que recebe
 * ([decisão 16](../../../../docs/arquitetura.md#8-transições-oferecidas-pela-api-decisão-16)).
 */
export interface AvailableTransition {
  to: ReportStatus;
  owner: TransitionOwner;
  requiresComment: boolean;
}

/**
 * Corpo de `PATCH /reports/:id/triage`. O desfecho é vocabulário do próprio
 * endpoint, e não da tabela de transições: `ACCEPT` leva a `IN_PROGRESS` e
 * `REJECT` a `REJECTED`.
 */
export const TRIAGE_OUTCOME_BY_STATUS = {
  IN_PROGRESS: 'ACCEPT',
  REJECTED: 'REJECT',
} as const satisfies Partial<Record<ReportStatus, string>>;

export type TriageOutcome = (typeof TRIAGE_OUTCOME_BY_STATUS)[keyof typeof TRIAGE_OUTCOME_BY_STATUS];

export function triageOutcomeFor(status: ReportStatus): TriageOutcome | undefined {
  return (TRIAGE_OUTCOME_BY_STATUS as Record<string, TriageOutcome>)[status];
}

/**
 * O desfecho que encaminha a ocorrência ao atendimento — o único que exige
 * prioridade. Exportado como constante para que a comparação não espalhe o
 * literal pelas telas e pelas ações.
 */
export const FORWARDING_OUTCOME: TriageOutcome = TRIAGE_OUTCOME_BY_STATUS.IN_PROGRESS;

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
  /**
   * Ocorrência ainda em curso (RF-API-73). Vem da API porque não se deduz de
   * `availableTransitions` vazia — ela também fica vazia para quem não pode
   * agir —, e deduzi-la da situação exigiria o portal saber quais são finais.
   */
  open: boolean;
  availableTransitions: AvailableTransition[];
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
