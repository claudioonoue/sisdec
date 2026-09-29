/** Envelope de listagem paginada da API: `{ data, total, page, pageSize }`. */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Envelope de erro da API — `{ statusCode, message, error }`.
 *
 * `message` é uma lista quando a recusa vem da validação de entrada (`400`) e
 * uma frase única nos demais casos.
 */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}
