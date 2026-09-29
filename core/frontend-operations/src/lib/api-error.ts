import type { ApiErrorBody } from '@/types/api';

/**
 * Natureza da falha, já traduzida do código HTTP para o vocabulário do portal.
 * As telas decidem o que fazer a partir disto, sem comparar números de status.
 */
export type ApiFailureKind =
  | 'validation'
  | 'authentication'
  | 'permission'
  | 'notFound'
  | 'conflict'
  | 'rateLimit'
  | 'server'
  | 'unavailable'
  | 'timeout'
  | 'network';

/**
 * Falha de uma chamada à API.
 *
 * `message` já vem em pt-BR e sem código técnico, pronta para ser exibida ao
 * agente (RNF-OP-05). `details` guarda as mensagens de validação devolvidas pela
 * API, para que um formulário possa apontá-las campo a campo.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiFailureKind;
  readonly details: string[];

  constructor(status: number, kind: ApiFailureKind, message: string, details: string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
    this.details = details;
  }
}

/** Classifica o código HTTP devolvido pela API. */
export function kindForStatus(status: number): ApiFailureKind {
  if (status === 400 || status === 422) return 'validation';
  if (status === 401) return 'authentication';
  if (status === 403) return 'permission';
  if (status === 404) return 'notFound';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rateLimit';
  if (status === 503) return 'unavailable';
  return 'server';
}

const DEFAULT_MESSAGES: Record<ApiFailureKind, string> = {
  validation: 'Alguns dados informados não foram aceitos. Confira os campos e tente novamente.',
  authentication: 'A sua sessão não é mais válida. Entre novamente para continuar.',
  permission: 'O seu perfil não permite executar esta operação.',
  notFound: 'O registro procurado não foi encontrado.',
  conflict: 'A operação não pôde ser concluída por conflito com o estado atual do registro.',
  rateLimit: 'Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.',
  server: 'O sistema encontrou um erro inesperado. Tente novamente em instantes.',
  unavailable: 'O sistema está temporariamente indisponível. Tente novamente em instantes.',
  timeout: 'A API demorou mais do que o esperado para responder. Tente novamente.',
  network: 'Não foi possível falar com a API do SISDEC. Verifique se ela está no ar.',
};

/**
 * Monta a falha a partir do corpo devolvido pela API.
 *
 * A mensagem da API é aproveitada quando existe — ela é escrita em pt-BR e
 * costuma ser mais precisa do que o texto genérico. O envelope de erro é
 * `{ statusCode, message, error }` e `message` pode ser lista (validação).
 */
export function apiErrorFromBody(status: number, body: unknown): ApiError {
  const kind = kindForStatus(status);
  const details = extractDetails(body);

  // Em 401 a mensagem da API é propositalmente genérica e voltada ao login;
  // quem chama decide o texto (RF-OP-02), então não a repassamos aqui.
  const message = kind === 'authentication' || details.length === 0
    ? DEFAULT_MESSAGES[kind]
    : details.join(' ');

  return new ApiError(status, kind, message, details);
}

function extractDetails(body: unknown): string[] {
  if (typeof body !== 'object' || body === null) return [];
  const { message } = body as ApiErrorBody;
  if (Array.isArray(message)) return message.filter((item) => typeof item === 'string');
  if (typeof message === 'string' && message.length > 0) return [message];
  return [];
}

/** Falha que não chegou a produzir resposta: tempo esgotado ou rede. */
export function apiErrorFromTransport(cause: unknown): ApiError {
  const isTimeout =
    cause instanceof Error && (cause.name === 'TimeoutError' || cause.name === 'AbortError');
  const kind: ApiFailureKind = isTimeout ? 'timeout' : 'network';
  return new ApiError(0, kind, DEFAULT_MESSAGES[kind]);
}

/**
 * Texto a exibir ao agente para qualquer falha — inclusive as que não vieram da
 * API. Nunca devolve mensagem técnica nem tela em branco (RF-OP-59, RNF-OP-25).
 */
export function userMessageFor(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return DEFAULT_MESSAGES.server;
}
