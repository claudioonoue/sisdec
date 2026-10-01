'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  DEFAULT_CENTER,
  formatCoordinates,
  geolocationMessage,
  roundCoordinates,
  type Coordinates,
} from '@/features/report-form/coordinates';
import type { MapPoint } from './location-picker';

/**
 * Carga adiada do mapa.
 *
 * `ssr: false` porque o Leaflet mexe no DOM e não existe no servidor, e porque o
 * `RNF-CID-22` exige o mapa **fora do pacote inicial** — quem só vai acompanhar um
 * protocolo não deve baixar o Leaflet. A opção só vale em componente de cliente,
 * daí este invólucro; ele não importa o Leaflet, apenas adia o módulo que o importa.
 */
const LocationPicker = dynamic(
  () => import('./location-picker').then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-label="Carregando o mapa"
        style={{ height: '300px' }}
        className="w-full animate-pulse rounded-md border border-border bg-surface-muted"
      />
    ),
  },
);

/**
 * Escolha do ponto no mapa (RF-CID-11, RF-CID-12).
 *
 * O mapa só é montado quando a pessoa pede — por abrir o bloco ou por acionar a
 * localização. Isso serve a dois requisitos ao mesmo tempo: não baixar o Leaflet
 * para quem não vai usá-lo (`RNF-CID-22`) e deixar explícito que o ponto é
 * opcional (`RF-CID-13`).
 */
export function LocationField({
  value,
  onChange,
  onClear,
}: {
  value: Coordinates | null;
  onChange: (point: Coordinates) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(value !== null);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function locate() {
    // A verificação acontece no acionamento, não na montagem: `navigator` não
    // existe no servidor, e guardar isto em estado exigiria um efeito que só
    // serviria para sincronizar o ambiente — além de ser o que a regra
    // `react-hooks/set-state-in-effect` proíbe.
    //
    // Sem suporte, o botão continua visível e explica o motivo ao ser acionado.
    // Esconde-lo deixaria a pessoa sem saber por que a opção não existe.
    const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

    // RNF-CID-33: a localização é pedida **apenas** por este acionamento. Nada no
    // carregamento da página toca em `navigator.geolocation` — o navegador não
    // deve exibir o pedido de permissão sem a pessoa ter pedido.
    if (!supported) {
      setMessage(geolocationMessage(undefined));
      return;
    }

    setLocating(true);
    setMessage(null);
    setOpen(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange(
          roundCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        );
        setLocating(false);
        setMessage(null);
      },
      (error) => {
        // A recusa não impede nada: o mapa continua aberto para marcar à mão, e o
        // endereço digitado já basta (RF-CID-13).
        setLocating(false);
        setMessage(geolocationMessage(error?.code));
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-surface p-4">
      <div>
        <p className="font-semibold">
          Ponto no mapa <span className="ml-1 text-sm font-normal text-ink-muted">(opcional)</span>
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          Marcar o ponto ajuda a equipe a encontrar o local. O endereço que você informou acima já
          é suficiente.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          aria-busy={locating}
          className="rounded-md border-2 border-brand px-4 py-2 text-sm font-semibold text-brand disabled:opacity-60"
        >
          {locating ? 'Obtendo a localização…' : 'Usar a minha localização'}
        </button>

        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md border-2 border-brand px-4 py-2 text-sm font-semibold text-brand"
          >
            Marcar no mapa
          </button>
        ) : null}

        {value ? (
          <button
            type="button"
            onClick={() => {
              onClear();
              setMessage(null);
            }}
            className="rounded-md border-2 border-danger px-4 py-2 text-sm font-semibold text-danger"
          >
            Remover o ponto
          </button>
        ) : null}
      </div>

      {/* Falha ou recusa da localização: informada, sem bloquear o formulário. */}
      {message ? (
        <p role="alert" className="rounded-md bg-surface-muted p-3 text-sm text-ink">
          {message}
        </p>
      ) : null}

      {open ? (
        <>
          <p className="text-sm text-ink-muted">
            Toque no mapa para marcar o ponto, ou arraste o marcador para ajustá-lo.
          </p>

          <LocationPicker
            value={value as MapPoint | null}
            center={value ?? DEFAULT_CENTER}
            onChange={(point) => {
              onChange(roundCoordinates(point));
              setMessage(null);
            }}
          />
        </>
      ) : null}

      {/*
        As coordenadas em texto: é o que confirma a escolha para quem usa leitor de
        tela, que não tem como ler a posição de um marcador (RNF-CID-19).
      */}
      <p aria-live="polite" className="text-sm">
        {value ? (
          <>
            <span className="font-semibold">Ponto marcado:</span>{' '}
            <span className="font-mono">{formatCoordinates(value)}</span>
          </>
        ) : (
          <span className="text-ink-muted">Nenhum ponto marcado.</span>
        )}
      </p>
    </div>
  );
}
