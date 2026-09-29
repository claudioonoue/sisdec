import {
  type AgentRole,
  type Priority,
  ReportCategory,
  ReportStatus,
  ReportType,
} from '../../generated/prisma/enums.js';

/**
 * Rótulos em pt-BR das enumerações públicas.
 *
 * Os tipos `Record<Enum, string>` são deliberados: acrescentar um valor ao enum
 * do Prisma sem acrescentar o rótulo aqui **não compila**. É o que impede a API
 * de devolver um valor sem tradução para os portais, que não mantêm mapa próprio
 * (RNF-API-29).
 */

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  FLOODING: 'Alagamento ou enchente',
  LANDSLIDE: 'Deslizamento de terra',
  EROSION: 'Erosão ou solapamento de margem',
  DANGEROUS_TREE: 'Árvore em situação de perigo',
  DAMAGED_STRUCTURE: 'Edificação ou muro com risco de desabamento',
  STRUCTURE_COLLAPSE: 'Desabamento já ocorrido',
  FALLEN_POLE: 'Poste ou fiação caída',
  FIRE: 'Incêndio em edificação',
  VEGETATION_FIRE: 'Incêndio em vegetação ou queimada',
  HAZARDOUS_MATERIAL: 'Vazamento de gás, combustível ou produto químico',
  WILD_ANIMAL: 'Animal selvagem ou peçonhento',
  STORM_DAMAGE: 'Danos por vendaval ou granizo',
  BLOCKED_DRAINAGE: 'Bueiro, galeria ou córrego obstruído',
  OTHER: 'Outros',
};

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  COMPLAINT: 'Reclamação',
  SUGGESTION: 'Sugestão',
  REQUEST: 'Solicitação',
  RISK_ALERT: 'Comunicação de risco',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  RECEIVED: 'Recebida',
  TRIAGE: 'Em triagem',
  IN_PROGRESS: 'Em atendimento',
  RESOLVED: 'Resolvida',
  REJECTED: 'Improcedente',
  CANCELLED: 'Cancelada',
};

/** Enumerações de uso interno, servidas apenas a agentes autenticados. */
export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export const AGENT_ROLE_LABELS: Record<AgentRole, string> = {
  AGENT: 'Agente',
  COORDINATOR: 'Coordenador',
  ADMIN: 'Administrador',
};

/**
 * Tipos de risco imediato à vida (RF-API-11).
 *
 * O Portal do Cidadão usa esta marcação para reforçar o aviso de acionamento dos
 * telefones de emergência; a triagem, no Portal de Operações, para sugerir
 * prioridade alta.
 */
export const URGENT_REPORT_TYPES: readonly ReportType[] = [
  ReportType.FIRE,
  ReportType.VEGETATION_FIRE,
  ReportType.HAZARDOUS_MATERIAL,
  ReportType.STRUCTURE_COLLAPSE,
  ReportType.LANDSLIDE,
];

export function isUrgentReportType(type: ReportType): boolean {
  return URGENT_REPORT_TYPES.includes(type);
}
