import type { ReportCategory, ReportStatus, ReportType } from './enums';

/** Corpo de `POST /reports`. */
export interface CreateReportPayload {
  category: ReportCategory;
  type: ReportType;
  description: string;
  address: string;
  district: string;
  latitude?: number;
  longitude?: number;
  citizen?: {
    name: string;
    email?: string;
    phone?: string;
  };
}

/** Resposta de `POST /reports`. */
export interface ReportCreated {
  id: string;
  protocolNumber: string;
  status: ReportStatus;
  createdAt: string;
}

/** Resposta de `POST /reports/:id/attachments`. */
export interface AttachmentCreated {
  id: string;
  fileName: string;
  url: string;
}

/** Andamento visível ao cidadão — sem o agente autor. */
export interface PublicReportUpdate {
  toStatus: ReportStatus | null;
  comment: string | null;
  createdAt: string;
}

export interface PublicAttachment {
  id: string;
  url: string;
}

/**
 * Resposta de `GET /reports/protocol/:protocolNumber`.
 *
 * Deliberadamente **não** traz `description`, `address`, coordenadas, `priority`,
 * `citizen` nem `assignedTo`: qualquer pessoa com o protocolo abre esta consulta.
 * O tipo reflete isso — não há como uma tela exibir um campo que não existe aqui.
 */
export interface PublicReport {
  protocolNumber: string;
  category: ReportCategory;
  type: ReportType;
  status: ReportStatus;
  district: string;
  createdAt: string;
  resolvedAt: string | null;
  updates: PublicReportUpdate[];
  attachments: PublicAttachment[];
}
