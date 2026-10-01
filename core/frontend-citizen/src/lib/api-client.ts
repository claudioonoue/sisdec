import { apiErrorFromBody, apiErrorFromTransport } from './api-error';
import { REQUEST_TIMEOUT_MS, apiBaseUrl } from './env';

/**
 * Cliente HTTP único do portal.
 *
 * RNF-CID-38: **todo** acesso à API passa por aqui. Nenhuma tela chama `fetch`
 * diretamente.
 *
 * Não há cabeçalho de autenticação: o Portal do Cidadão é público e não guarda
 * credencial alguma ([decisão 05](../../../../docs/arquitetura.md)).
 */

export type QueryValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions {
  method?: 'GET' | 'POST';
  /** Corpo serializado como JSON. */
  body?: unknown;
  /** Corpo multipart, usado no envio de fotos (etapa C2). */
  formData?: FormData;
  /** Parâmetros de consulta; valores nulos e vazios são omitidos. */
  query?: Record<string, QueryValue>;
  /** Segundos de cache da resposta. Sem valor, a resposta não é reaproveitada. */
  revalidate?: number;
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
 * Executa a requisição e devolve o corpo em JSON, lançando `ApiError` em
 * qualquer resposta fora da faixa de sucesso.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, query, revalidate } = options;

  const headers = new Headers({ Accept: 'application/json' });
  // O `Content-Type` do multipart é montado pelo próprio fetch, com o boundary;
  // declará-lo à mão quebraria o envio.
  if (body !== undefined) headers.set('Content-Type', 'application/json');

  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: formData ?? (body === undefined ? undefined : JSON.stringify(body)),
      // RNF-CID-29: toda requisição tem tempo limite, para que uma rede lenta
      // vire mensagem clara em vez de tela parada.
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: revalidate === undefined ? 'no-store' : undefined,
      next: revalidate === undefined ? undefined : { revalidate },
    });
  } catch (cause) {
    throw apiErrorFromTransport(cause);
  }

  if (!response.ok) {
    throw apiErrorFromBody(response.status, await readJsonSafely(response));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/**
 * O envelope de erro da API é sempre JSON, mas uma falha de infraestrutura pode
 * devolver HTML — e aí a leitura não pode derrubar o tratamento do erro que
 * estamos justamente construindo.
 */
async function readJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
