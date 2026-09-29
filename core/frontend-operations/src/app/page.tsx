import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { PendingStage } from '@/components/ui/pending-stage';
import { requireAgent } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Painel — SISDEC Operações',
};

const SHORTCUTS = [
  {
    href: '/ocorrencias',
    title: 'Ocorrências',
    description: 'Consultar, filtrar e atender os registros recebidos.',
  },
  {
    href: '/mapa',
    title: 'Mapa',
    description: 'Ver a distribuição geográfica das ocorrências abertas.',
  },
];

export default async function DashboardPage() {
  const agent = await requireAgent();

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Bom trabalho, ${agent.name.split(' ')[0]}`}
        description="Painel de acompanhamento das ocorrências da Defesa Civil."
      />

      <PendingStage
        stage="O4"
        summary="Os indicadores do painel — totais por situação, prioridade e tipo, distribuição por bairro e volume por período — são construídos na etapa O4 do plano de implementação."
      />

      <section aria-labelledby="atalhos" className="space-y-3">
        <h2 id="atalhos" className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Atalhos
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.href}>
              <Link
                href={shortcut.href}
                className="block h-full rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-strong"
              >
                <span className="block font-medium text-ink">{shortcut.title}</span>
                <span className="mt-1 block text-sm text-ink-muted">{shortcut.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
