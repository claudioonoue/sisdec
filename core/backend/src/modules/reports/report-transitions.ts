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

/** Quem pergunta: o perfil e, para a regra do responsável, o próprio id. */
export interface TransitionActor {
  id: string;
  role: AgentRole;
}

/**
 * O perfil consta entre os autorizados a executar a transição.
 *
 * Predicado próprio — e não uma comparação escrita em dois lugares — porque
 * tanto a execução quanto a consulta das transições disponíveis (`RF-API-72`)
 * precisam dele, e é justamente a divergência entre essas duas respostas que
 * faria o portal oferecer um botão que a API recusa.
 */
export function roleAllows(transition: Transition, role: AgentRole): boolean {
  return transition.roles.includes(role);
}

/**
 * O agente de perfil `AGENT` só atua na ocorrência que lhe foi atribuída;
 * coordenador e administrador atuam em qualquer uma (`RF-API-68`).
 */
export function assignmentAllows(
  actor: TransitionActor,
  assignedToId: string | null,
): boolean {
  return actor.role !== AgentRole.AGENT || assignedToId === actor.id;
}

/** Uma transição que este agente pode executar nesta ocorrência, agora. */
export interface AvailableTransition {
  to: ReportStatus;
  owner: TransitionOwner;
  requiresComment: boolean;
}

/**
 * Transições que o agente informado pode executar na ocorrência informada
 * (`RF-API-72`).
 *
 * Existe para que o Portal de Operações não precise manter uma cópia do ciclo de
 * vida: ele oferece as ações que vierem daqui. A conferência é feita pelos
 * mesmos predicados que a execução usa — o que impede a lista oferecida de
 * discordar do que a API aceita.
 */
export function availableTransitions(
  status: ReportStatus,
  actor: TransitionActor,
  assignedToId: string | null,
): AvailableTransition[] {
  return TRANSITIONS.filter(
    (transition) =>
      transition.from === status &&
      roleAllows(transition, actor.role) &&
      assignmentAllows(actor, assignedToId),
  ).map((transition) => ({
    to: transition.to,
    owner: transition.owner,
    requiresComment: transition.requiresComment,
  }));
}

/** Situações a partir das quais a ocorrência ainda pode mudar de estado. */
export function isOpenStatus(status: ReportStatus): boolean {
  return TRANSITIONS.some((t) => t.from === status);
}

/** Situações que o endpoint informado consegue alcançar a partir da atual. */
export function nextStatusesFrom(from: ReportStatus, owner: TransitionOwner): ReportStatus[] {
  return TRANSITIONS.filter((t) => t.from === from && t.owner === owner).map((t) => t.to);
}
