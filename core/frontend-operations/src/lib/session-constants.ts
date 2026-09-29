/**
 * Constantes de sessão compartilhadas entre o middleware (que roda no Edge e
 * não pode importar `next/headers`) e o código de servidor. Por isso este
 * módulo não importa nada.
 */

/**
 * Nome do cookie que guarda o token JWT.
 *
 * RNF-OP-12 — decisão registrada: o token fica em **cookie `httpOnly`**, e não
 * em `localStorage`. Ele nunca chega ao JavaScript do navegador: todas as
 * chamadas à API partem do servidor do Next (Server Components e Server
 * Actions), que lê o cookie e monta o cabeçalho `Authorization`. Assim nenhum
 * script de terceiros — nem um XSS na própria aplicação — consegue ler o token,
 * e ele também não aparece no console (RNF-OP-16).
 */
export const SESSION_COOKIE_NAME = 'sisdec_session';

/**
 * Cabeçalho que o middleware acrescenta à requisição com o caminho pedido.
 * É o que permite voltar à tela pretendida depois de um login provocado por
 * expiração de sessão (RF-OP-08), já que um Server Component não enxerga a URL.
 */
export const CURRENT_PATH_HEADER = 'x-sisdec-path';
