import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { PendingStage } from '@/components/ui/pending-stage';
import { requireAgent } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Mapa — SISDEC Operações',
};

export default async function MapPage() {
  await requireAgent();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mapa de ocorrências"
        description="Distribuição geográfica das ocorrências abertas."
      />
      <PendingStage
        stage="O5"
        summary="O componente <ReportMap> — único ponto do portal que importa o Leaflet — e os filtros do mapa são construídos na etapa O5 do plano de implementação."
      />
    </div>
  );
}
