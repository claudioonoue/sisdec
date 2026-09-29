import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { PendingStage } from '@/components/ui/pending-stage';
import { requireAgent } from '@/lib/session';
import { isAdmin } from '@/types/agent';

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
    <div className="space-y-8">
      <PageHeader
        title="Agentes"
        description="Cadastro dos agentes da Defesa Civil com acesso ao portal."
      />
      <PendingStage
        stage="O6"
        summary="A relação de agentes, o cadastro, a alteração de perfil e a desativação são construídos na etapa O6 do plano de implementação."
      />
    </div>
  );
}
