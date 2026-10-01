/**
 * Resultado do envio do registro.
 *
 * Mora fora de `actions.ts` porque um arquivo `'use server'` só pode exportar
 * funções assíncronas — um valor exportado de lá é registrado como se fosse outra
 * ação de servidor, e o envio falha com `500` sem o build acusar nada. Foi o
 * defeito que a etapa O1 encontrou no login do outro portal.
 */
export interface SubmitResult {
  status: 'idle' | 'success' | 'error';
  /** Mensagem a exibir — de falha, ou de aviso quando as fotos não subiram. */
  message: string | null;
  /** Protocolo gerado, presente apenas no sucesso. */
  protocolNumber: string | null;
  /**
   * Verdadeiro quando a ocorrência foi registrada mas as fotos não subiram
   * (RF-CID-24). O registro **está** feito: avisar sem assustar é o ponto.
   */
  photosFailed: boolean;
}

export const initialSubmitResult: SubmitResult = {
  status: 'idle',
  message: null,
  protocolNumber: null,
  photosFailed: false,
};
