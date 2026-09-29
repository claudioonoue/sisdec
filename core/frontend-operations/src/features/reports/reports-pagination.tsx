import Link from 'next/link';
import { type ReportFilters, reportsHref } from './report-query';

/**
 * Paginação da lista (RF-OP-18). Informa a página atual e o total encontrado —
 * uma lista sem esse número não diz se o recorte achou pouco ou se a página é
 * que acabou.
 *
 * São links, e não botões: cada página tem endereço próprio, o que mantém a
 * navegação por teclado, o "abrir em nova aba" e o histórico do navegador
 * funcionando.
 */
export function ReportsPagination({
  filters,
  total,
  page,
  pageSize,
}: {
  filters: ReportFilters;
  total: number;
  page: number;
  pageSize: number;
}) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Paginação da lista de ocorrências"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-ink-muted">
        {total === 0 ? (
          'Nenhuma ocorrência encontrada'
        ) : (
          <>
            Exibindo <strong className="font-medium text-ink">{first}</strong>–
            <strong className="font-medium text-ink">{last}</strong> de{' '}
            <strong className="font-medium text-ink">{total}</strong>{' '}
            {total === 1 ? 'ocorrência' : 'ocorrências'} · página {page} de {lastPage}
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        <PageLink filters={filters} page={page - 1} disabled={page <= 1}>
          Anterior
        </PageLink>
        <PageLink filters={filters} page={page + 1} disabled={page >= lastPage}>
          Próxima
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  filters,
  page,
  disabled,
  children,
}: {
  filters: ReportFilters;
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const classes = 'rounded-md border px-3 py-1.5 text-sm font-medium';

  // Sem destino, não é link: um `<span>` sai da ordem de tabulação, em vez de
  // receber o foco para não levar a lugar nenhum.
  if (disabled) {
    return (
      <span aria-disabled="true" className={`${classes} border-border text-ink-muted/60`}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={reportsHref({ ...filters, page })}
      scroll={false}
      className={`${classes} border-border text-ink transition-colors hover:border-border-strong`}
    >
      {children}
    </Link>
  );
}
