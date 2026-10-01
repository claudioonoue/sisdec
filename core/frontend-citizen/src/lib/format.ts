/** Formatação de datas para leitura, em pt-BR. */

const DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const DATE_ONLY = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * A API devolve ISO 8601 UTC; a exibição é no fuso de quem lê.
 *
 * Devolve texto vazio para valor ausente ou inválido em vez de lançar: uma data
 * estranha não deve derrubar a consulta de situação, que é a informação que a
 * pessoa veio buscar.
 */
export function formatDateTime(iso: string | null | undefined): string {
  const date = parse(iso);
  return date ? DATE_TIME.format(date) : '';
}

export function formatDate(iso: string | null | undefined): string {
  const date = parse(iso);
  return date ? DATE_ONLY.format(date) : '';
}

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}
