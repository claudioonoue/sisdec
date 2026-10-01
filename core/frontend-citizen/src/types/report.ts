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
