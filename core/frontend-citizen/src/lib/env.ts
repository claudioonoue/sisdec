/**
 * Configuração vinda do ambiente.
 *
 * RF-CID-37: o endereço da API vem exclusivamente de `NEXT_PUBLIC_API_URL`, sem
 * endereço fixo no código.
 *
 * RNF-CID-32: o portal só declara variáveis `NEXT_PUBLIC_*`, e nenhuma delas é
 * segredo — este portal é público e não guarda credencial alguma.
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
 * duplicaria o `/api/v1` (RF-CID-39).
 */
export function apiOrigin(): string {
  return new URL(apiBaseUrl()).origin;
}

/**
 * Tempo limite de cada requisição à API (RNF-CID-29).
 *
 * Mais folgado que o do Portal de Operações: aqui o acesso é por celular, muitas
 * vezes no local da ocorrência e sob conexão instável. Desistir cedo
 * transformaria uma rede lenta em erro, quando esperar resolveria.
 */
export const REQUEST_TIMEOUT_MS = 15_000;
