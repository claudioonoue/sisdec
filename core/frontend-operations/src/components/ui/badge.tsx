import type { Tone } from '@/types/display';

/**
 * Crachá de situação ou prioridade.
 *
 * RF-OP-23, RNF-OP-04 e RNF-OP-31: a cor **acompanha** o rótulo, nunca o
 * substitui. Por isso o componente não aceita um crachá sem texto — quem lê a
 * lista em preto e branco, quem não distingue as cores e quem usa leitor de tela
 * recebem a mesma informação.
 */
const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'border-border-strong/50 bg-surface-muted text-ink',
  info: 'border-brand/30 bg-brand-soft text-brand-strong',
  progress: 'border-warning/30 bg-warning-soft text-warning',
  success: 'border-success/30 bg-success-soft text-success',
  danger: 'border-danger/30 bg-danger-soft text-danger',
  muted: 'border-border bg-surface-muted text-ink-muted',
};

export function Badge({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}
