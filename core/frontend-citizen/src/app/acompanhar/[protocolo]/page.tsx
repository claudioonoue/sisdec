import type { Metadata } from 'next';
import Link from 'next/link';
import { ServiceUnavailable } from '@/components/service-unavailable';
import {
  STATUS_EXPLANATION,
  StatusBadge,
} from '@/features/tracking/status-badge';
import { ReportTimeline } from '@/features/tracking/report-timeline';
import { ApiError, userMessageFor } from '@/lib/api-error';
import { formatDateTime } from '@/lib/format';
import { fetchPublicMetadata, labelOf } from '@/lib/metadata';
import { looksLikeProtocol, normalizeProtocol } from '@/lib/protocol';
import { fetchReportByProtocol } from '@/lib/reports';
import type { PublicMetadata } from '@/types/metadata';
import type { PublicReport } from '@/types/report';

export const metadata: Metadata = {
  title: 'Situação da ocorrência — SISDEC',
  description: 'Situação atual e histórico de uma ocorrência registrada na Defesa Civil.',
};

export const dynamic = 'force-dynamic';

/**
 * Situação da ocorrência (RF-CID-32 a RF-CID-35).
 *
 * Nada aqui identifica quem registrou: a API não devolve descrição, endereço,
 * coordenadas, dados do cidadão nem o agente autor dos andamentos — e o tipo
 * `PublicReport` reflete isso, então esta tela não tem como exibi-los por descuido
 * (RF-CID-34).
 */
export default async function ReportStatusPage({
  params,
}: PageProps<'/acompanhar/[protocolo]'>) {
  const { protocolo } = await params;
  const protocolNumber = normalizeProtocol(decodeURIComponent(protocolo));

  // Formato errado não chega à API: a mensagem precisa dizer que o número está
  // malformado, e não que a ocorrência não existe.
  if (!looksLikeProtocol(protocolNumber)) {
    return <NotFoundPanel protocolNumber={protocolNumber} malformed />;
  }

  let report: PublicReport;
  let publicMetadata: PublicMetadata;

  try {
    [report, publicMetadata] = await Promise.all([
      fetchReportByProtocol(protocolNumber),
      fetchPublicMetadata(),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'notFound') {
      return <NotFoundPanel protocolNumber={protocolNumber} />;
    }
    return <ServiceUnavailable message={userMessageFor(error)} />;
  }

  const statusLabel = labelOf(publicMetadata.reportStatuses, report.status);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-muted">Protocolo</p>
        <h1 className="break-all font-mono text-xl font-bold">{report.protocolNumber}</h1>
      </div>

      <section
        aria-labelledby="situacao"
        className="rounded-lg border border-border bg-surface p-5"
      >
        <h2 id="situacao" className="text-sm font-semibold text-ink-muted">
          Situação atual
        </h2>

        <div className="mt-2">
          <StatusBadge status={report.status} label={statusLabel} />
        </div>

        <p className="mt-3 text-ink">{STATUS_EXPLANATION[report.status]}</p>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-ink-muted">Tipo de comunicação</dt>
            <dd className="font-semibold">
              {labelOf(publicMetadata.reportCategories, report.category)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-muted">Situação comunicada</dt>
            <dd className="font-semibold">{labelOf(publicMetadata.reportTypes, report.type)}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-muted">Bairro</dt>
            <dd className="font-semibold">{report.district}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-muted">Registrada em</dt>
            <dd className="font-semibold">{formatDateTime(report.createdAt)}</dd>
          </div>
          {report.resolvedAt ? (
            <div>
              <dt className="text-sm text-ink-muted">Concluída em</dt>
              <dd className="font-semibold">{formatDateTime(report.resolvedAt)}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section
        aria-labelledby="historico"
        className="rounded-lg border border-border bg-surface p-5"
      >
        <h2 id="historico" className="text-lg font-bold">
          Histórico
        </h2>
        <div className="mt-3">
          <ReportTimeline
            updates={report.updates}
            statuses={publicMetadata.reportStatuses}
          />
        </div>
      </section>

      {report.attachments.length > 0 ? (
        <section
          aria-labelledby="fotos"
          className="rounded-lg border border-border bg-surface p-5"
        >
          <h2 id="fotos" className="text-lg font-bold">
            Fotos enviadas
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {report.attachments.length} foto(s) acompanham esta ocorrência.
          </p>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/acompanhar"
          className="rounded-md border-2 border-brand px-5 py-2 font-semibold text-brand"
        >
          Consultar outro protocolo
        </Link>
        <Link href="/" className="rounded-md border-2 border-brand px-5 py-2 font-semibold text-brand">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}

/**
 * Protocolo não encontrado (RF-CID-35).
 *
 * Distingue número malformado de ocorrência inexistente: são problemas diferentes,
 * e a orientação muda. Nenhuma das duas mensagens é um erro técnico.
 */
function NotFoundPanel({
  protocolNumber,
  malformed = false,
}: {
  protocolNumber: string;
  malformed?: boolean;
}) {
  return (
    <section aria-labelledby="nao-encontrado" className="space-y-4">
      <h1 id="nao-encontrado" className="text-2xl font-bold">
        {malformed ? 'Número de protocolo inválido' : 'Não encontramos esta ocorrência'}
      </h1>

      {protocolNumber ? (
        <p className="break-all font-mono text-ink-muted">{protocolNumber}</p>
      ) : null}

      <p className="text-ink">
        {malformed
          ? 'O número informado não tem a forma de um protocolo do SISDEC. Ele se parece com SISDEC-2026-000123.'
          : 'Confira o número: um dígito trocado é o motivo mais comum. O protocolo é o que você recebeu na tela de confirmação do registro.'}
      </p>

      <Link
        href="/acompanhar"
        className="inline-flex rounded-md bg-brand px-5 py-2 font-semibold text-white"
      >
        Tentar outro número
      </Link>
    </section>
  );
}
