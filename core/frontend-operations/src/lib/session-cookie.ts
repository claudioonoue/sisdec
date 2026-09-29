import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from './session-constants';

/**
 * Leitura e escrita do cookie de sessão.
 *
 * Módulo de servidor: `next/headers` só existe no servidor, e é o que impede
 * que o token escape para o navegador. Escrever o cookie só é permitido em
 * Server Action ou Route Handler — daí `writeSessionToken` ser usado apenas
 * pela ação de login e `clearSessionToken` apenas pela rota `/sair`.
 */

/** Token JWT da sessão corrente, ou `null` quando não há sessão. */
export async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/** Grava o token recebido de `POST /auth/login` (RF-OP-03). */
export async function writeSessionToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Em desenvolvimento o portal roda em http://localhost:3001; marcar como
    // `secure` impediria o navegador de guardar o cookie.
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

/** Descarta o token ao encerrar a sessão ou ao receber `401` (RNF-OP-13). */
export async function clearSessionToken(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
