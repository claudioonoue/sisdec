/**
 * Estado do formulário de login.
 *
 * Mora fora de `actions.ts` porque um arquivo `'use server'` só pode exportar
 * funções assíncronas: o valor inicial exportado de lá é registrado como se
 * fosse uma segunda ação de servidor, e o envio do formulário falha com
 * `500` — sem que o build acuse nada.
 */
export interface SignInState {
  /** Mensagem a exibir, ou `null` quando ainda não houve tentativa. */
  error: string | null;
  /** E-mail digitado, devolvido para não ser perdido na recusa (RNF-OP-06). */
  email: string;
}

export const initialSignInState: SignInState = { error: null, email: '' };
