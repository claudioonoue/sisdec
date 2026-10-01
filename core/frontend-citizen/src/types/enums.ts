/**
 * Valores das enumerações da API.
 *
 * Este é o **único** arquivo do portal onde os valores em inglês podem aparecer
 * (RNF-CID-39). Os rótulos exibidos ao cidadão vêm de `GET /metadata` — nunca de
 * um mapa de tradução escrito aqui.
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
