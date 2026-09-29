/**
 * Limites de upload de anexos. Ficam aqui, e não no módulo de metadados nem no
 * de anexos, porque os dois precisam do mesmo valor: o contrato publica estes
 * limites em `GET /metadata` e o módulo `attachments` os aplica na validação.
 * Duplicá-los é o que faria a API recusar um arquivo que ela mesma anunciou
 * como aceitável.
 *
 * O tamanho máximo não está aqui: vem de `MAX_UPLOAD_SIZE_MB`, no ambiente.
 */

/** Máximo de arquivos por requisição (RF-API-17). */
export const MAX_FILES_PER_REQUEST = 5;

/** Formatos aceitos para anexo (RF-API-18). */
export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

export function isAcceptedMimeType(value: string): value is AcceptedMimeType {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(value);
}
