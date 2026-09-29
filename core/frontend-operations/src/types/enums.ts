/**
 * Valores das enumerações da API do SISDEC.
 *
 * RNF-OP-45: este arquivo é o **único** ponto do portal onde os valores em inglês
 * (`FLOODING`, `RECEIVED`, `HIGH`, `COORDINATOR`, …) podem aparecer. Nenhum rótulo
 * em pt-BR é escrito aqui: eles vêm de `GET /metadata` e `GET /metadata/internal`
 * (RF-OP-56, RF-OP-57), para que acrescentar um tipo de ocorrência na API não
 * exija alterar o portal.
 *
 * Os valores correspondem às enumerações de `core/backend/prisma/schema.prisma`.
 */

export type ReportCategory = 'COMPLAINT' | 'SUGGESTION' | 'REQUEST' | 'RISK_ALERT';

export type ReportType =
  | 'FLOODING'
  | 'LANDSLIDE'
  | 'EROSION'
  | 'DANGEROUS_TREE'
  | 'DAMAGED_STRUCTURE'
  | 'STRUCTURE_COLLAPSE'
  | 'FALLEN_POLE'
  | 'FIRE'
  | 'VEGETATION_FIRE'
  | 'HAZARDOUS_MATERIAL'
  | 'WILD_ANIMAL'
  | 'STORM_DAMAGE'
  | 'BLOCKED_DRAINAGE'
  | 'OTHER';

export type ReportStatus =
  | 'RECEIVED'
  | 'TRIAGE'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'
  | 'CANCELLED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AgentRole = 'ADMIN' | 'COORDINATOR' | 'AGENT';
