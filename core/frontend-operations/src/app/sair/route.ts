import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session-constants';

/**
 * Encerramento de sessão — o **único** ponto que descarta o cookie (RNF-OP-13).
 *
 * `POST` atende o botão "Sair" (RF-OP-06). `GET` atende o desvio automático
 * disparado quando a API recusa o token (RF-OP-07): um Server Component não
 * pode alterar cookies, então ele desvia para cá, e daqui a pessoa segue para o
 * login já sem a credencial inválida, levando junto o destino de retorno.
 */
function endSession(request: NextRequest, reason: string | null, destination: string | null) {
  const login = new URL('/login', request.url);
  if (reason) login.searchParams.set('motivo', reason);
  if (destination) login.searchParams.set('destino', destination);

  // 303 para que o navegador troque o POST do formulário por um GET no login.
  const response = NextResponse.redirect(login, 303);
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export async function POST(request: NextRequest) {
  return endSession(request, null, null);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return endSession(request, params.get('motivo'), params.get('destino'));
}
