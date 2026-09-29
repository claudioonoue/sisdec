import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AuthenticatedAgent } from '@/types/agent';
import { ApiError } from './api-error';
import { apiRequest } from './api-client';
import { readSessionToken } from './session-cookie';
import { CURRENT_PATH_HEADER } from './session-constants';

/**
 * Sessão do agente autenticado.
 *
 * A validade do token não é presumida pelo portal: ela é conferida a cada
 * requisição por `GET /auth/me`. É o que faz a desativação de um agente na API
 * derrubar a sessão dele aqui, sem esperar a expiração do JWT.
 */

/**
 * Agente autenticado, ou `null` quando não há sessão válida.
 *
 * `cache` do React garante uma única chamada a `GET /auth/me` por requisição,
 * mesmo que o layout e a página peçam o agente separadamente.
 */
export const getCurrentAgent = cache(async (): Promise<AuthenticatedAgent | null> => {
  const token = await readSessionToken();
  if (!token) return null;

  try {
    return await apiRequest<AuthenticatedAgent>('/auth/me');
  } catch (error) {
    // Token expirado ou revogado: não é falha do sistema, é ausência de sessão.
    if (error instanceof ApiError && error.kind === 'authentication') return null;
    throw error;
  }
});

/**
 * Agente autenticado, encerrando a sessão quando não houver.
 *
 * Chegar aqui sem sessão significa que o cookie existe mas a API o recusou — o
 * middleware já barra quem não tem cookie nenhum. Por isso o desvio é para
 * `/sair`, que descarta o cookie (RNF-OP-13) antes de levar ao login, levando
 * junto o caminho pretendido para o retorno depois de entrar (RF-OP-08).
 */
export async function requireAgent(): Promise<AuthenticatedAgent> {
  const agent = await getCurrentAgent();
  if (agent) return agent;

  const requestHeaders = await headers();
  const destination = requestHeaders.get(CURRENT_PATH_HEADER) ?? '/';
  redirect(`/sair?motivo=expirada&destino=${encodeURIComponent(destination)}`);
}

/**
 * Sanitiza o destino de retorno recebido pela URL.
 *
 * Só caminhos internos são aceitos: `//exemplo.com` é endereço absoluto
 * disfarçado e viraria um desvio para fora do portal.
 */
export function safeDestination(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}
