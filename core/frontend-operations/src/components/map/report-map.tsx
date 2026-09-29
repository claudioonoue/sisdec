'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * `<ReportMap>` — o **único** ponto do portal que importa o Leaflet
 * (RF-OP-61, RNF-OP-42, [decisão 08](../../../../docs/arquitetura.md#mapas-decisão-08)).
 *
 * A interface pública não usa nenhum tipo da biblioteca: os pontos entram como
 * `{ latitude, longitude }` e a cor como um nome de tom do portal. Trocar o
 * Leaflet por outro mapa significa reescrever este arquivo por dentro, sem tocar
 * em nenhuma tela.
 *
 * O marcador é um `divIcon` com HTML próprio, e não o ícone padrão do Leaflet:
 * o padrão referencia imagens por caminho relativo ao CSS, que o empacotador
 * reescreve — e some. O `divIcon` também é o que permitirá colorir por
 * prioridade na etapa O5 sem trocar de imagem.
 */

export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  /** Texto do balão ao acionar o ponto. Sem ele, o ponto não é clicável. */
  title?: string;
  /** Cor do marcador, em CSS. Padrão: a cor de marca do portal. */
  color?: string;
}

export interface ReportMapProps {
  points: MapPoint[];
  /** Nível de aproximação inicial. Ignorado quando há mais de um ponto. */
  zoom?: number;
  /** Altura em CSS; o mapa precisa de altura explícita para se desenhar. */
  height?: string;
  /** Rótulo acessível do mapa, dito ao leitor de tela. */
  label: string;
}

const DEFAULT_COLOR = '#1d4ed8';
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function markerIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<span style="
      display:block; width:16px; height:16px; border-radius:9999px;
      background:${color}; border:2px solid #fff; box-shadow:0 0 0 1px rgba(0,0,0,.35);
    "></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export function ReportMap({ points, zoom = 16, height = '320px', label }: ReportMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;

    const instance = L.map(container.current, { scrollWheelZoom: false });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(instance);
    map.current = instance;

    return () => {
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    const layer = L.layerGroup().addTo(instance);

    for (const point of points) {
      const marker = L.marker([point.latitude, point.longitude], {
        icon: markerIcon(point.color ?? DEFAULT_COLOR),
        // Sem título, o marcador é decorativo e sai da ordem de tabulação: um
        // ponto focável que não faz nada só atrapalha quem navega por teclado.
        keyboard: Boolean(point.title),
        alt: point.title ?? '',
      }).addTo(layer);

      if (point.title) marker.bindPopup(point.title);
    }

    if (points.length === 1) {
      instance.setView([points[0].latitude, points[0].longitude], zoom);
    } else if (points.length > 1) {
      instance.fitBounds(L.latLngBounds(points.map((p) => [p.latitude, p.longitude])).pad(0.2));
    }

    return () => {
      layer.remove();
    };
  }, [points, zoom]);

  return (
    <div
      ref={container}
      role="application"
      aria-label={label}
      style={{ height }}
      className="w-full overflow-hidden rounded-md border border-border bg-surface-muted"
    />
  );
}
