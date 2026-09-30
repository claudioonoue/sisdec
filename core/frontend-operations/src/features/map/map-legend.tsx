import type { PortalMetadata } from '@/types/metadata';
import type { MarkerShape } from '@/components/map/report-map';
import {
  NO_PRIORITY_SHAPE,
  PRIORITIES_BY_URGENCY,
  PRIORITY_SHAPE,
  PRIORITY_TONE,
  type Tone,
} from '@/types/display';
import { labelFor } from '@/lib/enum-label';

/**
 * Legenda do mapa (RF-OP-42).
 *
 * Cada entrada traz **forma, cor e rótulo em pt-BR**. A forma não é enfeite: as
 * cores de crítica e alta ficam a ΔE 2,8 para deuteranopia, e num mapa não há
 * rótulo ao lado de cada ponto para desempatar. Quem não distingue as cores lê a
 * forma; quem imprime em preto e branco, também.
 */

const TONE_HEX: Record<Tone, string> = {
  neutral: '#525a68',
  info: '#1d4ed8',
  progress: '#8a4b06',
  success: '#15803d',
  danger: '#b42318',
  muted: '#9aa2b1',
};

export function toneHex(tone: Tone): string {
  return TONE_HEX[tone];
}

export function MapLegend({ metadata }: { metadata: PortalMetadata }) {
  const entradas = [
    ...PRIORITIES_BY_URGENCY.map((priority) => ({
      key: priority,
      label: labelFor(metadata.priorities, priority),
      shape: PRIORITY_SHAPE[priority],
      color: TONE_HEX[PRIORITY_TONE[priority]],
    })),
    {
      key: 'sem-prioridade',
      label: 'Sem triagem',
      shape: NO_PRIORITY_SHAPE,
      color: TONE_HEX.neutral,
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-ink">Legenda</h2>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
        {entradas.map((entrada) => (
          <li key={entrada.key} className="flex items-center gap-2 text-sm text-ink">
            <ShapeSwatch shape={entrada.shape} color={entrada.color} />
            {entrada.label}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-muted">
        A forma acompanha a cor em cada ponto, para que a prioridade seja legível também sem
        distinguir as cores.
      </p>
    </div>
  );
}

/** Amostra da forma, em SVG — o mesmo desenho que o marcador usa no mapa. */
function ShapeSwatch({ shape, color }: { shape: MarkerShape; color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      {shape === 'triangle' ? (
        <polygon points="8,1 15,15 1,15" fill={color} />
      ) : shape === 'diamond' ? (
        <polygon points="8,1 15,8 8,15 1,8" fill={color} />
      ) : shape === 'square' ? (
        <rect x="2" y="2" width="12" height="12" rx="2" fill={color} />
      ) : shape === 'ring' ? (
        <circle cx="8" cy="8" r="5.5" fill="#ffffff" stroke={color} strokeWidth="3" />
      ) : (
        <circle cx="8" cy="8" r="6" fill={color} />
      )}
    </svg>
  );
}
