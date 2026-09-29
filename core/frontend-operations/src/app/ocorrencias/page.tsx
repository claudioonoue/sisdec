import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { PendingStage } from '@/components/ui/pending-stage';
import { requireAgent } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Ocorrências — SISDEC Operações',
};

export default async function ReportsPage() {
  await requireAgent();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ocorrências"
        description="Registros recebidos pela Defesa Civil, com filtros e acesso ao atendimento."
      />
      <PendingStage
        stage="O2"
        summary="A lista com filtros combináveis, busca, ordenação e paginação, e o detalhe da ocorrência, são construídos na etapa O2 do plano de implementação."
      />
    </div>
  );
}
