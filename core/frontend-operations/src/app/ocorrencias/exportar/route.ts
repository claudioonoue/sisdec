import { NextResponse, type NextRequest } from 'next/server';
import { apiFetch } from '@/lib/api-client';
import { userMessageFor } from '@/lib/api-error';
import { getCurrentAgent } from '@/lib/session';
import { canCoordinate } from '@/types/agent';
import { parseReportFilters, toApiQuery } from '@/features/reports/report-query';

/**
 * Exportação da lista em CSV (RF-OP-24).
 *
 * Precisa ser um *route handler*, e não um link direto para a API: o token vive
 * em cookie `httpOnly` ([decisão 15](../../../../../docs/arquitetura.md#7-sessão-do-portal-de-operações-decisão-15)),
 * então o navegador não consegue autenticar a chamada sozinho. Aqui o servidor
 * do Next lê o cookie, chama a API e repassa a resposta.
 *
 * O corpo é repassado **em fluxo**, sem ser lido para memória: a API o gera lote
 * a lote justamente para que a exportação não dependa do tamanho da base, e
 * bufferizá-lo aqui desfaria isso. Pelo mesmo motivo a exportação usa a rota
 * dedicada, e não a varredura de páginas de `GET /reports` (`RNF-OP-20`).
 */
export async function GET(request: NextRequest) {
  const agent = await getCurrentAgent();
  if (!agent) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Conveniência, não proteção: a API recusa de qualquer forma (`RNF-OP-14`).
  // Evita um download que viraria um arquivo com mensagem de erro dentro.
  if (!canCoordinate(agent.role)) {
    return csvError('A exportação é restrita a coordenação e administração.', 403);
  }

  const filters = parseReportFilters(Object.fromEntries(request.nextUrl.searchParams));

  // A exportação leva só o **recorte**: página e ordenação não fazem sentido num
  // arquivo sem paginação, e a rota dedicada não os aceita.
  const { page, sort, order, ...recorte } = toApiQuery(filters);
  void page;
  void sort;
  void order;

  let response: Response;
  try {
    response = await apiFetch('/reports/export', { query: recorte, accept: 'text/csv' });
  } catch (error) {
    return csvError(userMessageFor(error), 502);
  }

  if (!response.ok || !response.body) {
    return csvError('A API não conseguiu gerar a exportação. Tente novamente.', 502);
  }

  return new NextResponse(response.body, {
    headers: {
      'Content-Type': response.headers.get('Content-Type') ?? 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName()}"`,
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * A falha também desce como arquivo. O acionamento foi um download, e o
 * navegador já saiu da página — devolver HTML de erro aqui mostraria a tela
 * técnica que o `RNF-OP-25` proíbe.
 */
function csvError(message: string, status: number): NextResponse {
  return new NextResponse(`﻿Não foi possível exportar\n${message}\n`, {
    status,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="exportacao-nao-realizada.csv"',
    },
  });
}

function fileName(): string {
  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
    new Date(),
  );
  return `ocorrencias-${hoje}.csv`;
}
