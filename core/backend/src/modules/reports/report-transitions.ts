import { AgentRole, ReportStatus } from '../../generated/prisma/enums.js';

/**
 * Transições permitidas do ciclo de vida da ocorrência.
 *
 * Espelha a tabela de transições do
 * [modelo de dados](../../../../docs/backend/modelo-de-dados.md#4-ciclo-de-vida-da-ocorrência):
 * cada aresta tem um endpoint responsável, e nenhuma situação do enum fica
 * inalcançável. Qualquer transição fora daqui é recusada com `400` (RF-API-39).
 */

/** Endpoint responsável por cada transição. */
export type TransitionOwner = 'triage/start' | 'triage' | 'status';

export interface Transition {
  from: ReportStatus;
  to: ReportStatus;
  owner: TransitionOwner;
  /** Perfis que podem executá-la. O responsável pela ocorrência entra à parte. */
  roles: readonly AgentRole[];
  /** Comentário obrigatório — decisões que encerram ou recusam o atendimento. */
  requiresComment: boolean;
}

const COORDINATION = [AgentRole.COORDINATOR, AgentRole.ADMIN] as const;
const ALL_ROLES = [AgentRole.AGENT, AgentRole.COORDINATOR, AgentRole.ADMIN] as const;

export const TRANSITIONS: readonly Transition[] = [
  {
    from: ReportStatus.RECEIVED,
    to: ReportStatus.TRIAGE,
    owner: 'triage/start',
    roles: COORDINATION,
    requiresComment: false,
  },
  {
    from: ReportStatus.TRIAGE,
    to: ReportStatus.IN_PROGRESS,
    owner: 'triage',
    roles: COORDINATION,
    requiresComment: false,
  },
  {
    from: ReportStatus.TRIAGE,
    to: ReportStatus.REJECTED,
    owner: 'triage',
    roles: COORDINATION,
    requiresComment: true,
  },
  {
    from: ReportStatus.IN_PROGRESS,
    to: ReportStatus.RESOLVED,
    owner: 'status',
    roles: ALL_ROLES,
    requiresComment: true,
  },
  {
    from: ReportStatus.IN_PROGRESS,
    to: ReportStatus.CANCELLED,
    owner: 'status',
    roles: ALL_ROLES,
    requiresComment: true,
  },
];

export function findTransition(
  from: ReportStatus,
  to: ReportStatus,
  owner: TransitionOwner,
): Transition | undefined {
  return TRANSITIONS.find((t) => t.from === from && t.to === to && t.owner === owner);
}

/** Situações a partir das quais a ocorrência ainda pode mudar de estado. */
export function isOpenStatus(status: ReportStatus): boolean {
  return TRANSITIONS.some((t) => t.from === status);
}

/** Situações que o endpoint informado consegue alcançar a partir da atual. */
export function nextStatusesFrom(from: ReportStatus, owner: TransitionOwner): ReportStatus[] {
  return TRANSITIONS.filter((t) => t.from === from && t.owner === owner).map((t) => t.to);
}
