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

/**
 * Todas as prioridades, da mais alta para a mais baixa. Ordem de exibição na
 * legenda do mapa, onde uma ordem arbitrária atrapalharia a leitura.
 */
export const PRIORITIES_BY_URGENCY: readonly Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

/**
 * Forma do marcador no mapa, por prioridade.
 *
 * Existe porque **a cor sozinha não basta**. Medidas com o validador de paleta,
 * as cores de crítica e alta do portal ficam a ΔE 2,8 para deuteranopia — num
 * mapa, sem rótulo ao lado de cada ponto, seriam o mesmo ponto. A forma é a
 * segunda pista que o `RNF-OP-31` exige, e sobrevive à impressão em preto e
 * branco.
 *
 * `Record` sem opcionais: prioridade nova sem forma **não compila**.
 */
export type MarkerShape = 'triangle' | 'diamond' | 'square' | 'circle' | 'ring';

export const PRIORITY_SHAPE: Record<Priority, MarkerShape> = {
  CRITICAL: 'triangle',
  HIGH: 'diamond',
  MEDIUM: 'square',
  LOW: 'circle',
};

/** Ocorrência ainda sem triagem: anel vazado, distinto de qualquer prioridade. */
export const NO_PRIORITY_SHAPE: MarkerShape = 'ring';
