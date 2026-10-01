import type { ReportStatus } from '@/types/enums';

/**
 * Situação da ocorrência.
 *
 * O rótulo **vem da API** (`GET /metadata`); aqui só se decide a cor. E a cor nunca
 * é a única pista: o texto está sempre presente (RNF-CID-19).
 */
const TONE: Record<ReportStatus, string> = {
  RECEIVED: 'border-brand bg-brand-soft text-brand',
  TRIAGE: 'border-brand bg-brand-soft text-brand',
  IN_PROGRESS: 'border-brand bg-brand-soft text-brand',
  RESOLVED: 'border-success bg-success-soft text-success',
  REJECTED: 'border-ink-muted bg-surface-muted text-ink',
  CANCELLED: 'border-ink-muted bg-surface-muted text-ink',
};

export function StatusBadge({ status, label }: { status: ReportStatus; label: string }) {
  return (
    <span
      className={`inline-flex rounded-full border-2 px-4 py-1 text-base font-bold ${
        TONE[status] ?? TONE.RECEIVED
      }`}
    >
      {label}
    </span>
  );
}

/**
 * O que a situação significa para quem consultou.
 *
 * A API devolve o rótulo, que é curto por natureza ("Em triagem"). Esta frase
 * explica o que está acontecendo — é a diferença entre informar e comunicar.
 */
export const STATUS_EXPLANATION: Record<ReportStatus, string> = {
  RECEIVED: 'A sua comunicação foi recebida e entrará na fila de análise.',
  TRIAGE: 'Uma equipe está analisando a comunicação para definir a urgência.',
  IN_PROGRESS: 'A ocorrência foi encaminhada e está em atendimento.',
  RESOLVED: 'O atendimento foi concluído.',
  REJECTED:
    'A análise concluiu que não há providência a tomar neste caso. O histórico abaixo explica o motivo.',
  CANCELLED: 'O atendimento desta ocorrência foi cancelado.',
};
