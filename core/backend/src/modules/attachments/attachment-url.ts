/**
 * Formato da URL de leitura de um anexo.
 *
 * Fica em um arquivo próprio porque dois módulos a montam — `attachments`, ao
 * responder o envio, e `reports`, na consulta por protocolo. Duplicar o formato
 * faria uma das duas divergir do contrato na primeira alteração.
 */
export function attachmentUrl(attachmentId: string): string {
  return `/api/v1/attachments/${attachmentId}`;
}
