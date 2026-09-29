import Link from 'next/link';

export interface CountBarRow {
  key: string;
  label: string;
  total: number;
  /**
   * Lista já filtrada pelo recorte desta linha (RF-OP-13).
   *
   * Ausente quando a API não tem filtro equivalente. A linha então não é
   * clicável, e `note` diz por quê: um link que levasse a um recorte diferente
   * do número exibido seria pior do que link nenhum.
   */
  href?: string;
  note?: string;
}

const numberFormat = new Intl.NumberFormat('pt-BR');

/**
 * Distribuição de ocorrências por uma dimensão, em barras proporcionais.
 *
 * **Um único matiz para todas as barras**, de propósito. A barra codifica
 * *magnitude*, não identidade — quem diz de qual situação, prioridade ou bairro
 * se trata é o rótulo ao lado. Pintar cada linha de uma cor diferente
 * acrescentaria um segundo código sem acrescentar informação, e as cores de
 * situação e prioridade do portal não sobrevivem a essa prova: medidas com o
 * validador de paleta, `#b42318` (crítica) e `#8a4b06` (alta) ficam a ΔE 2,8
 * para quem tem deuteranopia — indistinguíveis.
 *
 * Cada linha é um link para a lista já recortada (RF-OP-13).
 */
export function CountBars({
  rows,
  emptyMessage = 'Nenhuma ocorrência no período.',
}: {
  rows: CountBarRow[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-muted">{emptyMessage}</p>;
  }

  const maior = Math.max(...rows.map((row) => row.total), 1);

  return (
    <ul className="space-y-1.5">
      {rows.map((row) => {
        const conteudo = (
          <>
            <span className="w-40 shrink-0 truncate text-sm text-ink" title={row.note ?? row.label}>
              {row.label}
            </span>

            {/*
              A barra é decorativa: o número ao lado já diz tudo, e repeti-la
              para um leitor de tela só acrescentaria ruído.
            */}
            <span aria-hidden="true" className="h-2 flex-1 rounded-full bg-surface-muted">
              <span
                className="block h-2 rounded-full bg-brand"
                style={{ width: `${Math.max((row.total / maior) * 100, 2)}%` }}
              />
            </span>

            <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums text-ink">
              {numberFormat.format(row.total)}
            </span>
          </>
        );

        return (
          <li key={row.key}>
            {row.href ? (
              <Link
                href={row.href}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-surface-muted"
              >
                {conteudo}
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-2 py-1.5">{conteudo}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
