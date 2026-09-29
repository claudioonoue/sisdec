import type { Priority, ReportStatus } from './enums';

/**
 * Tom visual de cada situação e prioridade.
 *
 * Mora em `types/` pelo mesmo motivo dos predicados de perfil: a chave do mapa é
 * um valor de enumeração, e por `RNF-OP-45` esses literais não podem aparecer
 * fora daqui. O que está no mapa é **cor**, nunca rótulo — o texto em pt-BR
 * continua vindo de `GET /metadata` (RF-OP-57).
 *
 * `Record<ReportStatus, Tone>` sem opcionais é deliberado: acrescentar um valor
 * à enumeração sem lhe dar um tom **não compila**, a mesma garantia que a API usa
 * para os rótulos. Sem isso, uma situação nova apareceria sem cor e ninguém
 * notaria até alguém reparar na tela.
 */
export type Tone = 'neutral' | 'info' | 'progress' | 'success' | 'danger' | 'muted';

export const STATUS_TONE: Record<ReportStatus, Tone> = {
  RECEIVED: 'info',
  TRIAGE: 'progress',
  IN_PROGRESS: 'progress',
  RESOLVED: 'success',
  REJECTED: 'muted',
  CANCELLED: 'muted',
};

export const PRIORITY_TONE: Record<Priority, Tone> = {
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'progress',
  CRITICAL: 'danger',
};

/**
 * Prioridades que o painel destaca como exigindo atenção (RF-OP-10).
 *
 * Em ordem decrescente de urgência — a ordem em que os cartões aparecem.
 */
export const URGENT_PRIORITIES: readonly Priority[] = ['CRITICAL', 'HIGH'];
