import { apiRequest } from './api-client';
import type {
  AttachmentCreated,
  CreateReportPayload,
  PublicReport,
  ReportCreated,
} from '@/types/report';

/** `POST /reports` — registra a ocorrência e devolve o protocolo (RF-CID-20). */
export function createReport(payload: CreateReportPayload): Promise<ReportCreated> {
  return apiRequest<ReportCreated>('/reports', { method: 'POST', body: payload });
}

/**
 * `POST /reports/:id/attachments` — envia as fotos.
 *
 * Só é aceito enquanto a ocorrência está em `RECEIVED`, e por isso vem logo após
 * o registro. Em lote único: a API aceita até cinco arquivos por requisição, que
 * é o mesmo teto que o formulário aplica.
 */
export function attachPhotos(reportId: string, photos: File[]): Promise<AttachmentCreated[]> {
  const formData = new FormData();
  for (const photo of photos) formData.append('files', photo);

  return apiRequest<AttachmentCreated[]>(`/reports/${reportId}/attachments`, {
    method: 'POST',
    formData,
  });
}

/**
 * `GET /reports/protocol/:protocolNumber` — consulta pública (RF-CID-32).
 *
 * Sem cache: a situação é justamente o que muda, e servir uma resposta guardada
 * mostraria um andamento desatualizado a quem acabou de abrir a página para ver se
 * algo mudou.
 */
export function fetchReportByProtocol(protocolNumber: string): Promise<PublicReport> {
  return apiRequest<PublicReport>(`/reports/protocol/${encodeURIComponent(protocolNumber)}`);
}
