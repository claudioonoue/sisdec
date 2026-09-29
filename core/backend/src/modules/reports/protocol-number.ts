/**
 * Número de protocolo: `SISDEC-AAAA-NNNNNN`.
 *
 * A sequência reinicia a cada ano, então o código só é único em conjunto com o
 * ano — o que o formato já carrega.
 */

export const PROTOCOL_PREFIX = 'SISDEC';
const SEQUENCE_DIGITS = 6;
const PATTERN = /^SISDEC-(\d{4})-(\d{6})$/;

export function formatProtocolNumber(year: number, sequence: number): string {
  return `${PROTOCOL_PREFIX}-${year}-${String(sequence).padStart(SEQUENCE_DIGITS, '0')}`;
}

/** Prefixo de busca das ocorrências de um ano: `SISDEC-2026-`. */
export function protocolPrefixForYear(year: number): string {
  return `${PROTOCOL_PREFIX}-${year}-`;
}

/**
 * Extrai a sequência de um protocolo. Devolve 0 para qualquer coisa que não siga
 * o formato, de modo que um registro estranho no banco não interrompa a geração
 * do próximo número.
 */
export function sequenceOf(protocolNumber: string): number {
  const match = PATTERN.exec(protocolNumber);
  return match ? Number(match[2]) : 0;
}

/**
 * Normaliza o protocolo digitado pelo cidadão: a consulta tolera caixa e espaços
 * em excesso (RF-CID-31), porque o número costuma ser copiado à mão de um papel
 * ou de outra tela.
 */
export function normalizeProtocolNumber(input: string): string {
  return (
    input
      // Caracteres de controle são removidos antes de chegar ao banco: um byte
      // nulo faz o PostgreSQL recusar a consulta, e entrada malformada deve virar
      // 404, não erro interno (RNF-API-09). Casar com eles é justamente o ponto.
      // oxlint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '')
  );
}
