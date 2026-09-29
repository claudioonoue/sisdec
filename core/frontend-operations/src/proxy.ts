import { NextResponse, type NextRequest } from 'next/server';
import { CURRENT_PATH_HEADER, SESSION_COOKIE_NAME } from '@/lib/session-constants';

/**
 * Guarda de rotas do portal.
 *
 * Arquivo `proxy` — nome que o Next 16 adotou para o que antes se chamava
 * `middleware`; o papel é o mesmo: interceptar a requisição antes da rota.
 *
 * RF-OP-04 e RNF-OP-11: sem sessão, nenhuma rota além de `/login` é servida —
 * o desvio acontece **antes** de qualquer renderização, de modo que nenhum dado
 * de ocorrência chega ao navegador de quem não entrou.
 *
 * Aqui se confere apenas a **presença** do cookie. A validade do token é
 * verificada pela API a cada requisição (`lib/session.ts`): decidir neste ponto
 * exigiria conferir a assinatura do JWT no portal, e a autorização de verdade é
 * sempre a da API (RNF-OP-14).
 */

/** Rotas servidas sem sessão. `/sair` precisa estar aqui para poder limpar o cookie. */
const PUBLIC_PATHS = ['/login', '/sair'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);

  if (!hasSession && !isPublic(pathname)) {
    const login = new URL('/login', request.url);
    // RF-OP-08: guarda a tela pretendida para o retorno depois do login.
    login.searchParams.set('destino', `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (hasSession && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Um Server Component não enxerga a URL pedida; o cabeçalho leva o caminho
  // adiante para que `requireAgent()` saiba para onde voltar após uma expiração.
  const forwarded = new Headers(request.headers);
  forwarded.set(CURRENT_PATH_HEADER, `${pathname}${search}`);
  return NextResponse.next({ request: { headers: forwarded } });
}

export const config = {
  matcher: [
    // Tudo, menos os recursos estáticos servidos pelo próprio Next.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
