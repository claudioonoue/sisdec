import { REQUEST_TIMEOUT_MS, apiBaseUrl } from './env';
import { apiErrorFromBody, apiErrorFromTransport } from './api-error';
import { readSessionToken } from './session-cookie';

/**
 * Cliente HTTP único do portal.
 *
 * RNF-OP-44: **todo** acesso à API passa por aqui. Nenhuma tela chama `fetch`
 * diretamente, e o cabeçalho `Authorization` é montado em um só lugar.
 *
 * O cliente roda no servidor do Next, porque o token vive em cookie `httpOnly`
 * (ver `session-constants.ts`). As telas são Server Components e as operações
 * são Server Actions; nada disso chega ao navegador.
 */

export type QueryValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Corpo serializado como JSON. */
  body?: unknown;
  /** Parâmetros de consulta; valores nulos e vazios são omitidos. */
  query?: Record<string, QueryValue>;
  /** Envia o token da sessão. Padrão: `true`. */
  auth?: boolean;
  /** Segundos de cache da resposta. Sem valor, a resposta não é reaproveitada. */
  revalidate?: number;
  /** `Accept` alternativo — usado pela exportação em CSV. */
  accept?: string;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === null || value === undefined || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/**
 * Executa a requisição e devolve a resposta crua.
 *
 * Só deve ser usada quando o corpo não é JSON — o download do CSV, por exemplo.
 * Nos demais casos, use `apiRequest`.
 */
export async function apiFetch(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { method = 'GET', body, query, auth = true, revalidate, accept } = options;

  const headers = new Headers({ Accept: accept ?? 'application/json' });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (auth) {
    const token = await readSessionToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    return await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // RNF-OP-27: toda requisição tem tempo limite, para que uma API retida
      // vire mensagem clara em vez de tela parada.
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: revalidate === undefined ? 'no-store' : undefined,
      next: revalidate === undefined ? undefined : { revalidate },
    });
  } catch (cause) {
    throw apiErrorFromTransport(cause);
  }
}

/**
 * Executa a requisição e devolve o corpo em JSON, lançando `ApiError` em
 * qualquer resposta fora da faixa de sucesso.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await apiFetch(path, options);

  if (!response.ok) {
    throw apiErrorFromBody(response.status, await readJsonSafely(response));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/**
 * O envelope de erro da API é sempre JSON, mas uma falha de infraestrutura
 * (proxy, gateway) pode devolver HTML — e aí a leitura não pode derrubar o
 * tratamento do erro que estamos justamente construindo.
 */
async function readJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
