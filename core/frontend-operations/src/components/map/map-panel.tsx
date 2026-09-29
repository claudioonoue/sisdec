'use client';

import dynamic from 'next/dynamic';
import type { MapPoint } from './report-map';

/**
 * Carga adiada do mapa.
 *
 * `ssr: false` porque o Leaflet mexe no DOM e não existe no servidor, e porque
 * `RNF-OP-22` exige o mapa **fora do pacote inicial** — ele só é baixado na tela
 * que o usa. A opção só vale em componente de cliente, daí este invólucro; ele
 * não importa o Leaflet, apenas adia o módulo que o importa.
 *
 * O estado de carregamento é uma caixa da mesma altura: sem ela o conteúdo
 * abaixo saltaria quando o mapa chegasse.
 */
const ReportMap = dynamic(() => import('./report-map').then((m) => m.ReportMap), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Carregando o mapa"
      className="w-full animate-pulse rounded-md border border-border bg-surface-muted"
      style={{ height: '320px' }}
    />
  ),
});

export function MapPanel({
  points,
  label,
  height,
  zoom,
}: {
  points: MapPoint[];
  label: string;
  height?: string;
  zoom?: number;
}) {
  return <ReportMap points={points} label={label} height={height} zoom={zoom} />;
}
