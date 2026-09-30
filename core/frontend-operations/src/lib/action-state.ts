/**
 * Estado devolvido pelas ações de atendimento.
 *
 * Mora fora de `actions.ts` porque um arquivo `'use server'` só pode exportar
 * funções assíncronas — um valor exportado de lá é registrado como se fosse
 * outra ação de servidor, e o envio do formulário falha com `500` sem que o
 * build acuse nada. Foi o defeito que a etapa O1 encontrou no login.
 */
export interface ActionState {
  status: 'idle' | 'success' | 'error';
  message: string | null;
  /** Dados digitados, devolvidos na recusa para não se perderem (RNF-OP-06). */
  values: Record<string, string>;
}

export const initialActionState: ActionState = { status: 'idle', message: null, values: {} };
