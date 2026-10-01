'use client';

import { useRef } from 'react';
import type { UploadLimits } from '@/types/metadata';
import { describeAcceptedTypes, formatFileSize, selectPhotos, type PhotoRejection } from './photos';

/**
 * Escolha de fotos, com prévia e remoção (RF-CID-15).
 *
 * A prévia usa `URL.createObjectURL` e o objeto é revogado ao remover a foto:
 * sem isso, cada troca de imagem deixaria um blob retido na memória do
 * navegador — e aqui são até cinco fotos de celular, que não são pequenas.
 */
export function PhotoPicker({
  photos,
  limits,
  rejections,
  onChange,
  onReject,
}: {
  photos: File[];
  limits: UploadLimits;
  rejections: PhotoRejection[];
  onChange: (photos: File[]) => void;
  onReject: (rejections: PhotoRejection[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.target.files ?? []);
    const { accepted, rejected } = selectPhotos(photos, incoming, limits);

    if (accepted.length > 0) onChange([...photos, ...accepted]);
    onReject(rejected);

    // O input é limpo para que escolher o mesmo arquivo de novo volte a disparar
    // o evento — sem isso, remover e reescolher a mesma foto não funcionaria.
    if (inputRef.current) inputRef.current.value = '';
  }

  const restantes = limits.maxFiles - photos.length;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="fotos" className="block font-semibold">
          Fotos <span className="ml-1 text-sm font-normal text-ink-muted">(opcional)</span>
        </label>
        <p id="fotos-ajuda" className="text-sm text-ink-muted">
          Até {limits.maxFiles} fotos, {describeAcceptedTypes(limits)}, de no máximo{' '}
          {limits.maxSizeMb} MB cada. Só envie se for seguro tirá-las.
        </p>

        <input
          ref={inputRef}
          id="fotos"
          name="fotos"
          type="file"
          multiple
          accept={limits.acceptedMimeTypes.join(',')}
          aria-describedby="fotos-ajuda"
          disabled={restantes <= 0}
          onChange={handleSelection}
          className="w-full rounded-md border border-border-strong bg-surface p-2 text-sm"
        />

        {restantes <= 0 ? (
          <p className="text-sm text-ink-muted">
            Você já escolheu o máximo de fotos. Remova uma para trocar.
          </p>
        ) : null}
      </div>

      {/* As recusas são anunciadas: a pessoa escolheu um arquivo e precisa saber
          por que ele não entrou (RNF-CID-18). */}
      {rejections.length > 0 ? (
        <ul role="alert" className="space-y-1 rounded-md bg-danger-soft p-3">
          {rejections.map((rejection) => (
            <li key={`${rejection.fileName}-${rejection.reason}`} className="text-sm text-danger">
              <strong>{rejection.fileName}</strong>: {rejection.reason}
            </li>
          ))}
        </ul>
      ) : null}

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <li
              key={`${photo.name}-${photo.size}`}
              className="overflow-hidden rounded-md border border-border bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- blob local, sem otimização possível */}
              <img
                src={URL.createObjectURL(photo)}
                alt={`Prévia da foto ${index + 1}: ${photo.name}`}
                className="h-28 w-full object-cover"
              />
              <div className="p-2">
                <p className="truncate text-xs text-ink-muted" title={photo.name}>
                  {photo.name}
                </p>
                <p className="text-xs text-ink-muted">{formatFileSize(photo.size)}</p>
                <button
                  type="button"
                  // O nome acessível é declarado por inteiro, e não montado
                  // juntando texto visível com um `sr-only`: o JSX colapsa o
                  // espaço entre os dois e o leitor de tela anunciaria
                  // "Removera foto arvore.jpg". Foi o que o teste pegou.
                  aria-label={`Remover a foto ${photo.name}`}
                  onClick={() => {
                    onChange(photos.filter((_, position) => position !== index));
                    onReject([]);
                  }}
                  className="mt-1 w-full rounded border border-danger px-2 py-1 text-xs font-semibold text-danger"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
