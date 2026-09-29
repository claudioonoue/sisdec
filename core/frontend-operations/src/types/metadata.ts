import type {
  AgentRole,
  Priority,
  ReportCategory,
  ReportStatus,
  ReportType,
} from './enums';

/** Item de enumeração: o valor usado pela API e o rótulo exibido ao agente. */
export interface EnumOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

/** Tipo de ocorrência: `urgent` marca risco imediato à vida (RF-OP-32). */
export interface ReportTypeOption extends EnumOption<ReportType> {
  urgent: boolean;
}

/** Limites de anexo efetivamente aplicados pela API. */
export interface UploadLimits {
  maxFiles: number;
  maxSizeMb: number;
  acceptedMimeTypes: string[];
}

/** Resposta de `GET /metadata`. */
export interface PublicMetadata {
  reportTypes: ReportTypeOption[];
  reportCategories: EnumOption<ReportCategory>[];
  reportStatuses: EnumOption<ReportStatus>[];
  upload: UploadLimits;
}

/** Resposta de `GET /metadata/internal`. */
export interface InternalMetadata {
  priorities: EnumOption<Priority>[];
  agentRoles: EnumOption<AgentRole>[];
}

/**
 * As duas cargas de metadados reunidas, como o portal as consome.
 *
 * Chama-se `PortalMetadata` e não `Metadata` para não colidir com o tipo
 * `Metadata` do Next, usado nos arquivos de rota.
 */
export interface PortalMetadata extends PublicMetadata, InternalMetadata {}
