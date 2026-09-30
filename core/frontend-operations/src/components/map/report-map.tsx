'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * `<ReportMap>` — o **único** ponto do portal que importa o Leaflet
 * (RF-OP-61, RNF-OP-42, [decisão 08](../../../../docs/arquitetura.md#mapas-decisão-08)).
 *
 * A interface pública não usa nenhum tipo da biblioteca: pontos entram como
 * `{ latitude, longitude }`, a cor como texto CSS e a forma como um nome do
 * portal. Trocar o Leaflet por outro mapa é reescrever este arquivo por dentro,
 * sem tocar em nenhuma tela.
 *
 * O marcador é um `divIcon` construído como **elemento do DOM**, e não como
 * texto HTML: o conteúdo do balão inclui dados vindos da API, e montar HTML por
 * concatenação seria exatamente o que o `RNF-OP-17` proíbe. Com `textContent`
 * não há como um relato escrito pelo cidadão virar marcação.
 */

export type MarkerShape = 'triangle' | 'diamond' | 'square' | 'circle' | 'ring';

export interface MapPointPopup {
  /** Primeira linha, em destaque — o protocolo. */
  title: string;
  /** Linhas de apoio, uma por item: tipo, situação, prioridade. */
  lines: string[];
  href: string;
  hrefLabel: string;
}

export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  /** Cor do marcador, em CSS. */
  color?: string;
  /** Forma do marcador — a segunda pista, além da cor. */
  shape?: MarkerShape;
  /** Texto lido por leitor de tela e mostrado ao pairar. */
  label?: string;
  /** Conteúdo do balão. Sem ele, o ponto não é acionável. */
  popup?: MapPointPopup;
}

export interface ReportMapProps {
  points: MapPoint[];
  /** Aproximação inicial. Usada apenas quando há um único ponto. */
  zoom?: number;
  height?: string;
  label: string;
}

const DEFAULT_COLOR = '#1d4ed8';
const SIZE = 16;
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Recorte CSS de cada forma; o círculo e o anel usam `border-radius`. */
const CLIP_PATH: Partial<Record<MarkerShape, string>> = {
  triangle: 'polygon(50% 0%, 100% 100%, 0% 100%)',
  diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
};

function markerElement(color: string, shape: MarkerShape): HTMLElement {
  const marca = document.createElement('span');

  Object.assign(marca.style, {
    display: 'block',
    width: `${SIZE}px`,
    height: `${SIZE}px`,
    boxShadow: '0 0 0 1px rgba(0,0,0,.35)',
  } satisfies Partial<CSSStyleDeclaration>);

  if (shape === 'ring') {
    // Vazado: a ocorrência ainda não foi triada, e não tem prioridade a mostrar.
    marca.style.borderRadius = '9999px';
    marca.style.background = '#ffffff';
    marca.style.border = `3px solid ${color}`;
  } else {
    marca.style.background = color;
    marca.style.border = '2px solid #ffffff';
    if (shape === 'circle') marca.style.borderRadius = '9999px';
    if (shape === 'square') marca.style.borderRadius = '2px';
    const clip = CLIP_PATH[shape];
    if (clip) {
      marca.style.clipPath = clip;
      // O contorno branco não sobrevive ao recorte; a sombra externa é o que
      // separa o marcador do mapa embaixo.
      marca.style.border = 'none';
      marca.style.boxShadow = 'none';
      marca.style.filter = 'drop-shadow(0 0 1px rgba(0,0,0,.8))';
    }
  }

  return marca;
}

function popupElement(popup: MapPointPopup): HTMLElement {
  const caixa = document.createElement('div');

  const titulo = document.createElement('p');
  titulo.textContent = popup.title;
  titulo.style.fontWeight = '600';
  titulo.style.margin = '0 0 4px';
  caixa.append(titulo);

  for (const linha of popup.lines) {
    const p = document.createElement('p');
    p.textContent = linha;
    p.style.margin = '0';
    caixa.append(p);
  }

  const link = document.createElement('a');
  link.href = popup.href;
  link.textContent = popup.hrefLabel;
  link.style.display = 'inline-block';
  link.style.marginTop = '6px';
  link.style.fontWeight = '600';
  caixa.append(link);

  return caixa;
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
        icon: L.divIcon({
          className: '',
          html: markerElement(point.color ?? DEFAULT_COLOR, point.shape ?? 'circle'),
          iconSize: [SIZE, SIZE],
          iconAnchor: [SIZE / 2, SIZE / 2],
        }),
        // Sem balão o marcador é decorativo e sai da ordem de tabulação: um
        // ponto focável que não faz nada só atrapalha quem navega por teclado.
        keyboard: Boolean(point.popup),
        alt: point.label ?? '',
        title: point.label,
      }).addTo(layer);

      if (point.popup) marker.bindPopup(popupElement(point.popup));
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
