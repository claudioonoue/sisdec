import type { ReportCategory, ReportStatus, ReportType } from './enums';

/** Item de enumeração: o valor usado pela API e o rótulo exibido ao cidadão. */
export interface EnumOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

/** Tipo de ocorrência: `urgent` marca risco imediato à vida (RF-CID-09). */
export interface ReportTypeOption extends EnumOption<ReportType> {
  urgent: boolean;
}

/** Limites de anexo aplicados pela API, usados na etapa C2 (RF-CID-16). */
export interface UploadLimits {
  maxFiles: number;
  maxSizeMb: number;
  acceptedMimeTypes: string[];
}

/**
 * Resposta de `GET /metadata`.
 *
 * O portal consome **apenas** esta carga: `GET /metadata/internal` exige
 * autenticação e traz prioridades e perfis, que não são assunto do cidadão
 * (RF-CID-42).
 */
export interface PublicMetadata {
  reportTypes: ReportTypeOption[];
  reportCategories: EnumOption<ReportCategory>[];
  reportStatuses: EnumOption<ReportStatus>[];
  upload: UploadLimits;
}
