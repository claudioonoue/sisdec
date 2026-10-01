'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * `<LocationPicker>` — o **único** ponto do portal que importa o Leaflet
 * (RF-CID-40, RNF-CID-36, [decisão 08](../../../../docs/arquitetura.md#mapas-decisão-08)).
 *
 * A interface pública não usa nenhum tipo da biblioteca: o ponto entra e sai como
 * `{ latitude, longitude }`. Trocar o Leaflet por outro mapa é reescrever este
 * arquivo por dentro, sem tocar em nenhuma tela.
 *
 * O mapa é um **auxiliar**: o endereço digitado é o dado obrigatório (RF-CID-13).
 * Por isso nada aqui lança para a tela — se o Leaflet não carregar, quem decide o
 * que mostrar é o invólucro, e o formulário segue utilizável.
 */

export interface MapPoint {
  latitude: number;
  longitude: number;
}

export interface LocationPickerProps {
  /** Ponto escolhido, ou `null` quando ainda não há um. */
  value: MapPoint | null;
  /** Centro inicial quando não há ponto escolhido. */
  center: MapPoint;
  /** Altura do mapa, em CSS. */
  height?: string;
  onChange: (point: MapPoint) => void;
}

export function LocationPicker({
  value,
  center,
  height = '300px',
  onChange,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  // O callback vive numa referência para que recriar a função no componente pai
  // não exija remontar o mapa — remontar perderia o nível de zoom e o
  // enquadramento que a pessoa acabou de ajustar.
  //
  // A atualização acontece em um efeito, e não durante a renderização: escrever em
  // uma referência no corpo do componente é o que a regra `react-hooks/refs`
  // proíbe, porque o React pode descartar uma renderização pela metade.
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const start = value ?? center;
    const map = L.map(containerRef.current, {
      center: [start.latitude, start.longitude],
      zoom: value ? 17 : 14,
      // O mapa fica dentro de um formulário rolável: o zoom pelo scroll roubaria
      // a rolagem da página quando o dedo passasse por cima dele.
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© Colaboradores do OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([start.latitude, start.longitude], {
      draggable: true,
      // Com o marcador alcançável pelo teclado, arrastar deixa de ser a única
      // forma de posicioná-lo (RNF-CID-15).
      keyboard: true,
      title: 'Ponto da ocorrência',
      alt: 'Marcador do ponto da ocorrência',
    });

    if (value) marker.addTo(map);

    function publish(latitude: number, longitude: number) {
      onChangeRef.current({ latitude, longitude });
    }

    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng();
      publish(lat, lng);
    });

    map.on('click', (event: L.LeafletMouseEvent) => {
      marker.setLatLng(event.latlng).addTo(map);
      publish(event.latlng.lat, event.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Intencionalmente sem dependências: o mapa é criado uma vez. As mudanças de
    // `value` são aplicadas no efeito abaixo, movendo o marcador — recriar o mapa
    // a cada toque descartaria o enquadramento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reposiciona o marcador quando o ponto muda por fora do mapa — é o caso do
  // botão "usar minha localização".
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || !value) return;

    marker.setLatLng([value.latitude, value.longitude]).addTo(map);
    map.setView([value.latitude, value.longitude], Math.max(map.getZoom(), 17));
  }, [value]);

  return (
    <div
      ref={containerRef}
      // O mapa é apoio visual; quem usa leitor de tela trabalha com o endereço
      // digitado e com o texto das coordenadas, ao lado.
      role="application"
      aria-label="Mapa para marcar o ponto da ocorrência"
      style={{ height }}
      className="w-full rounded-md border border-border-strong"
    />
  );
}
