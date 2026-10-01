/**
 * Número de protocolo, no formato `SISDEC-AAAA-NNNNNN`.
 *
 * A API normaliza o que recebe, mas o portal normaliza antes de montar a URL: sem
 * isso, o mesmo protocolo digitado com espaços ou em caixa baixa viraria endereços
 * diferentes, e a página de consulta não seria compartilhável de forma estável
 * (RF-CID-31).
 */

const PATTERN = /^SISDEC-\d{4}-\d{6}$/;

/**
 * Normaliza o que foi digitado: tira espaços e caracteres de controle, e sobe a
 * caixa. É a mesma regra que a API aplica — o número costuma ser copiado à mão de
 * um papel ou de outra tela.
 */
export function normalizeProtocol(input: string): string {
  return (
    input
      // oxlint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '')
  );
}

/** Verdadeiro quando o texto tem a forma de um protocolo. */
export function looksLikeProtocol(input: string): boolean {
  return PATTERN.test(normalizeProtocol(input));
}

/**
 * Mensagem de recusa do campo de consulta, ou `null` quando pode seguir.
 *
 * O formato é conferido antes de chamar a API: um `404` genérico não diria se o
 * número está errado ou se a ocorrência não existe, e são problemas diferentes
 * para quem está consultando (RNF-CID-05).
 */
export function protocolInputError(input: string): string | null {
  const normalized = normalizeProtocol(input);

  if (normalized === '') {
    return 'Informe o número de protocolo que você recebeu ao registrar.';
  }

  if (!PATTERN.test(normalized)) {
    return 'O número não está no formato esperado. Ele tem a forma SISDEC-2026-000123.';
  }

  return null;
}
