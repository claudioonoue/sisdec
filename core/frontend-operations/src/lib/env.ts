/**
 * Configuração vinda do ambiente.
 *
 * RF-OP-55: o endereço da API vem exclusivamente de `NEXT_PUBLIC_API_URL`, sem
 * endereço fixo no código.
 *
 * RNF-OP-15: o portal só declara variáveis `NEXT_PUBLIC_*`, e nenhuma delas é
 * segredo. O tempo limite das requisições é constante de código justamente para
 * não acrescentar variável ao pacote entregue ao navegador.
 */

/**
 * A leitura precisa ser da expressão literal `process.env.NEXT_PUBLIC_API_URL`:
 * o Next substitui esse texto pelo valor durante o build, e um acesso indireto
 * (`process.env[nome]`) devolveria `undefined` no navegador.
 */
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

/** Endereço base da API, sem a barra final. */
export function apiBaseUrl(): string {
  if (!configuredApiUrl) {
    throw new Error(
      'A variável NEXT_PUBLIC_API_URL não está definida. ' +
        'Copie .env.example para .env.local e informe o endereço da API do SISDEC.',
    );
  }
  return configuredApiUrl.replace(/\/+$/, '');
}

/**
 * Origem da API, sem o caminho.
 *
 * As URLs de anexo devolvidas pela API são caminhos absolutos no servidor dela
 * (`/api/v1/attachments/...`), não relativos ao prefixo — juntá-las à base
 * duplicaria o `/api/v1`. O navegador precisa da origem para buscar a imagem
 * (`RNF-OP-18`: sempre pela URL servida pela API).
 */
export function apiOrigin(): string {
  return new URL(apiBaseUrl()).origin;
}

/** Tempo limite de cada requisição à API (RNF-OP-27). */
export const REQUEST_TIMEOUT_MS = 10_000;
