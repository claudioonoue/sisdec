import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Alert } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { listAgents } from '@/lib/agents';
import { ApiError, userMessageFor } from '@/lib/api-error';
import { requireAgent } from '@/lib/session';
import { isAdmin } from '@/types/agent';
import { AgentForm } from '@/features/agents/agent-form';
import { AgentsTable } from '@/features/agents/agents-table';

export const metadata: Metadata = {
  title: 'Agentes — SISDEC Operações',
};

export default async function AgentsPage() {
  const agent = await requireAgent();

  // RF-OP-52: a rota não existe para agente nem coordenador. `notFound()` em vez
  // de uma tela de "sem permissão" para não revelar a existência da seção a quem
  // não a administra — a API já recusaria as chamadas de qualquer forma.
  if (!isAdmin(agent.role)) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agentes"
        description="Contas de acesso ao portal. Agentes são desativados, nunca excluídos — o histórico das ocorrências continua apontando para quem agiu."
      />

      <details className="rounded-lg border border-border bg-surface p-5">
        <summary className="cursor-pointer text-sm font-semibold text-brand-strong">
          Cadastrar novo agente
        </summary>
        <div className="mt-4">
          <AgentForm />
        </div>
      </details>

      <Suspense fallback={<TableSkeleton />}>
        <AgentsList currentAgentId={agent.id} />
      </Suspense>
    </div>
  );
}

async function AgentsList({ currentAgentId }: { currentAgentId: string }) {
  let page;
  try {
    page = await listAgents();
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return (
      <Alert tone="error" title="Não foi possível carregar os agentes">
        {userMessageFor(error)}
      </Alert>
    );
  }

  if (page.data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong bg-surface p-10 text-center">
        <p className="font-medium text-ink">Nenhum agente cadastrado</p>
      </div>
    );
  }

  const inativos = page.data.filter((a) => !a.active).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted">
        {page.total} {page.total === 1 ? 'agente' : 'agentes'}
        {inativos > 0 ? `, ${inativos} ${inativos === 1 ? 'inativo' : 'inativos'}` : ''}.
      </p>
      <AgentsTable agents={page.data} currentAgentId={currentAgentId} />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando os agentes"
      className="space-y-2 rounded-lg border border-border bg-surface p-4"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-9 animate-pulse rounded bg-surface-muted" />
      ))}
    </div>
  );
}
