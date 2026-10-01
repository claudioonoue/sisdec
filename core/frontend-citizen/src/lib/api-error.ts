import type { ApiErrorBody } from '@/types/api';

/**
 * Natureza da falha, já traduzida do código HTTP para o vocabulário do portal.
 * As telas decidem o que fazer a partir disto, sem comparar números de status.
 */
export type ApiFailureKind =
  | 'validation'
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
 * `message` já vem em pt-BR, sem jargão e sem código técnico, pronta para ser
 * exibida ao cidadão (RNF-CID-05). `details` guarda as mensagens de validação da
 * API, para que o formulário da etapa C2 possa apontá-las campo a campo.
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
  if (status === 404) return 'notFound';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rateLimit';
  if (status === 503) return 'unavailable';
  return 'server';
}

/**
 * Textos exibidos ao cidadão.
 *
 * Escritos para quem não conhece o sistema: dizem o que aconteceu e o que fazer
 * em seguida, sem nomear código de status nem componente técnico. O portal é
 * usado por qualquer pessoa, muitas vezes com pressa e no local da ocorrência.
 */
const DEFAULT_MESSAGES: Record<ApiFailureKind, string> = {
  validation: 'Alguns dados não foram aceitos. Confira o que foi preenchido e tente de novo.',
  notFound: 'Não encontramos o que você procurou.',
  conflict: 'Esta ocorrência já está em atendimento e não aceita mais alterações.',
  rateLimit:
    'Recebemos muitos envios deste aparelho em pouco tempo. Aguarde um minuto e tente de novo.',
  server: 'Tivemos um problema do nosso lado. Tente de novo em alguns instantes.',
  unavailable:
    'O serviço está momentaneamente fora do ar. Tente de novo em alguns instantes. ' +
    'Se for uma emergência, ligue 199 ou 193.',
  timeout:
    'A resposta está demorando mais do que o normal. Verifique a sua conexão e tente de novo.',
  network:
    'Não foi possível conectar. Verifique a sua conexão com a internet e tente de novo. ' +
    'Se for uma emergência, ligue 199 ou 193.',
};

/**
 * Monta a falha a partir do corpo devolvido pela API.
 *
 * A mensagem da API é aproveitada na validação, onde ela aponta o campo recusado
 * e é mais útil que o texto genérico. Nos demais casos prevalece o texto do
 * portal: as mensagens da API citam nomes de campo em inglês (`description`,
 * `district`), que não dizem nada ao cidadão.
 */
export function apiErrorFromBody(status: number, body: unknown): ApiError {
  const kind = kindForStatus(status);
  const details = extractDetails(body);

  const message = kind === 'validation' && details.length > 0
    ? DEFAULT_MESSAGES.validation
    : DEFAULT_MESSAGES[kind];

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
 * Texto a exibir para qualquer falha — inclusive as que não vieram da API.
 * Nunca devolve mensagem técnica nem deixa a tela em branco (RNF-CID-27).
 */
export function userMessageFor(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return DEFAULT_MESSAGES.server;
}
