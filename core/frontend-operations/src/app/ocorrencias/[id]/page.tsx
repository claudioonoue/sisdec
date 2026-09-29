import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPanel } from '@/components/map/map-panel';
import { PageHeader } from '@/components/ui/page-header';
import { getAssignableAgents } from '@/lib/agents';
import { ApiError } from '@/lib/api-error';
import { apiOrigin } from '@/lib/env';
import { labelFor } from '@/lib/enum-label';
import { formatDateTime } from '@/lib/format';
import { getMetadata } from '@/lib/metadata';
import { getReport } from '@/lib/reports';
import { requireAgent } from '@/lib/session';
import { CarePanel } from '@/features/reports/care-panel';
import { PriorityBadge, StatusBadge } from '@/features/reports/report-badges';
import { ReportAttachments } from '@/features/reports/report-attachments';
import { ReportHistory } from '@/features/reports/report-history';
import { type RawSearchParams, backToListHref } from '@/features/reports/report-query';

export const metadata: Metadata = {
  title: 'Ocorrência — SISDEC Operações',
};

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const agent = await requireAgent();

  let report;
  try {
    report = await getReport(id);
  } catch (error) {
    // Id inexistente ou malformado é ocorrência não encontrada, não falha do
    // sistema. Qualquer outra coisa sobe para o limite de erro.
    if (error instanceof ApiError && (error.kind === 'notFound' || error.kind === 'validation')) {
      notFound();
    }
    throw error;
  }

  const [portalMetadata, assignableAgents] = await Promise.all([
    getMetadata(),
    getAssignableAgents(),
  ]);
  const isAssignee = report.assignedTo?.id === agent.id;

  return (
    <div className="space-y-6">
      <div>
        {/*
          A volta leva o recorte guardado na URL, de modo que a lista reapareça
          exatamente como estava (RNF-OP-03) mesmo para quem chegou por um link
          colado, sem depender do histórico do navegador.
        */}
        <Link
          href={backToListHref(query)}
          className="text-sm font-medium text-brand-strong hover:underline"
        >
          ← Voltar para a lista
        </Link>
      </div>

      <PageHeader
        title={report.protocolNumber}
        description={`${labelFor(portalMetadata.reportTypes, report.type)} · ${labelFor(
          portalMetadata.reportCategories,
          report.category,
        )}`}
        actions={
          <>
            <StatusBadge status={report.status} metadata={portalMetadata} />
            <PriorityBadge priority={report.priority} metadata={portalMetadata} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Relato">
            {/*
              Texto simples, interpolado pelo React — nunca HTML. A descrição é
              escrita pelo cidadão, e é exatamente o campo que o RNF-OP-17
              manda escapar.
            */}
            <p className="whitespace-pre-wrap text-sm text-ink">{report.description}</p>
          </Card>

          <Card title="Fotos anexadas">
            <ReportAttachments attachments={report.attachments} apiOrigin={apiOrigin()} />
          </Card>

          <Card title="Histórico de andamentos">
            <ReportHistory updates={report.updates} metadata={portalMetadata} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Localização">
            <dl className="space-y-2 text-sm">
              <Field label="Endereço" value={report.address} />
              <Field label="Bairro" value={report.district} />
            </dl>

            <div className="mt-4">
              {report.latitude !== null && report.longitude !== null ? (
                <MapPanel
                  label={`Mapa do ponto da ocorrência ${report.protocolNumber}`}
                  points={[
                    {
                      id: report.id,
                      latitude: report.latitude,
                      longitude: report.longitude,
                      title: report.protocolNumber,
                    },
                  ]}
                />
              ) : (
                // RF-OP-28: a ausência de coordenadas é dita, e não um espaço
                // vazio que o agente interpreta como falha de carregamento.
                <p className="rounded-md border border-dashed border-border-strong px-4 py-6 text-center text-sm text-ink-muted">
                  Esta ocorrência não tem coordenadas. O registro foi feito sem marcar o ponto no
                  mapa — o endereço acima é a única referência de local.
                </p>
              )}
            </div>
          </Card>

          <Card title="Quem registrou">
            {report.citizen ? (
              <dl className="space-y-2 text-sm">
                <Field label="Nome" value={report.citizen.name} />
                <Field label="E-mail" value={report.citizen.email} />
                <Field label="Telefone" value={report.citizen.phone} />
              </dl>
            ) : (
              // RF-OP-26: anonimato é informação, e precisa ser dito com todas as
              // letras — não deduzido de campos em branco.
              <p className="text-sm text-ink-muted">
                <strong className="font-medium text-ink">Registro anônimo.</strong> A pessoa optou
                por não se identificar, e não há forma de contato para esta ocorrência.
              </p>
            )}
          </Card>

          <Card title="Acompanhamento">
            <dl className="space-y-2 text-sm">
              <Field label="Registrada em" value={formatDateTime(report.createdAt)} />
              <Field label="Última alteração" value={formatDateTime(report.updatedAt)} />
              <Field
                label="Concluída em"
                value={report.resolvedAt ? formatDateTime(report.resolvedAt) : null}
              />
              <Field
                label="Responsável"
                value={
                  report.assignedTo
                    ? `${report.assignedTo.name}${isAssignee ? ' (você)' : ''}`
                    : null
                }
              />
            </dl>
          </Card>

          <Card title="Atendimento">
            <CarePanel report={report} agent={agent} assignableAgents={assignableAgents} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-ink-muted">{label}</dt>
      <dd className="text-ink">{value || '—'}</dd>
    </div>
  );
}
