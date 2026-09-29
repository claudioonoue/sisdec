import Link from 'next/link';
import type { DashboardSummary } from '@/types/dashboard';
import type { PortalMetadata } from '@/types/metadata';
import type { Priority } from '@/types/enums';
import { URGENT_PRIORITIES } from '@/types/display';
import { labelFor } from '@/lib/enum-label';

const numberFormat = new Intl.NumberFormat('pt-BR');

/**
 * Indicadores de cabeçalho do painel (RF-OP-09, RF-OP-10).
 *
 * O destaque das prioridades urgentes usa `openByPriority`, e não `byPriority`:
 * o número que interessa é o do que **ainda exige atenção**. Somar as já
 * concluídas inflaria justamente o indicador que orienta a decisão do turno —
 * foi para isso que a API passou a separar os dois recortes (`RF-API-73`).
 *
 * O tom vermelho do cartão crítico não é a única marca: o rótulo diz
 * "Críticas em aberto", e o número vem acompanhado do texto (`RNF-OP-31`).
 */
export function HeadlineCards({
  summary,
  metadata,
  periodSearch,
}: {
  summary: DashboardSummary;
  metadata: PortalMetadata;
  periodSearch: string;
}) {
  const aberto = (priority: Priority) =>
    summary.openByPriority.find((row) => row.key === priority)?.total ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        label="Ocorrências em aberto"
        value={summary.open}
        href={`/ocorrencias?aberta=1${periodSearch}`}
        hint={`de ${numberFormat.format(summary.total)} no período`}
        emphasis
      />

      {URGENT_PRIORITIES.map((priority) => (
        <Card
          key={priority}
          label={`${labelFor(metadata.priorities, priority)}s em aberto`}
          value={aberto(priority)}
          href={`/ocorrencias?aberta=1&prioridade=${priority}${periodSearch}`}
          hint="ainda não concluídas"
          alert={aberto(priority) > 0}
        />
      ))}

      <Card
        label="Registradas no período"
        value={summary.total}
        href={`/ocorrencias${periodSearch ? `?${periodSearch.slice(1)}` : ''}`}
        hint="todas as situações"
      />
    </div>
  );
}

function Card({
  label,
  value,
  href,
  hint,
  emphasis = false,
  alert = false,
}: {
  label: string;
  value: number;
  href: string;
  hint: string;
  emphasis?: boolean;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-lg border bg-surface p-5 transition-colors ${
        alert ? 'border-danger/40 hover:border-danger' : 'border-border hover:border-border-strong'
      }`}
    >
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p
        className={`mt-1 text-3xl font-semibold tabular-nums ${
          alert ? 'text-danger' : emphasis ? 'text-brand-strong' : 'text-ink'
        }`}
      >
        {numberFormat.format(value)}
      </p>
      <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>
    </Link>
  );
}
