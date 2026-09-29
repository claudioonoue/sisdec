/**
 * Formatação para exibição, em pt-BR.
 *
 * O fuso é **fixado**, e não lido do ambiente: a data é formatada no servidor e
 * reaproveitada na hidratação, e um servidor em UTC com um navegador em
 * `America/Sao_Paulo` produziria textos diferentes para o mesmo instante — o
 * React acusaria a divergência, e o agente veria a hora mudar sozinha ao carregar
 * a página. As datas chegam da API em ISO 8601 UTC.
 */
const TIME_ZONE = 'America/Sao_Paulo';
const LOCALE = 'pt-BR';

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  dateStyle: 'short',
  timeStyle: 'short',
});

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  dateStyle: 'short',
});

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return dateTimeFormat.format(new Date(iso));
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return dateFormat.format(new Date(iso));
}

/** Data no formato que `<input type="date">` espera, no mesmo fuso das telas. */
export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date(iso));
  return parts;
}

const SIZE_UNITS = ['B', 'kB', 'MB'];

export function formatFileSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1).replace('.', ',')} ${SIZE_UNITS[unit]}`;
}
