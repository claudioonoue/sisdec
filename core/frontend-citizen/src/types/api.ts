/** Envelope de erro da API: `{ statusCode, message, error }`. */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}
