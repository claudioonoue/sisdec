import { apiRequest } from './api-client';
import type { AttachmentCreated, CreateReportPayload, ReportCreated } from '@/types/report';

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
