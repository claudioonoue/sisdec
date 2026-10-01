'use client';

import { useRef, useState } from 'react';
import type { UploadLimits } from '@/types/metadata';
import { compressImage } from './image-compression';
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
  const [preparing, setPreparing] = useState(false);

  async function handleSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.target.files ?? []);
    const { accepted, rejected } = selectPhotos(photos, incoming, limits);

    onReject(rejected);

    // O input é limpo para que escolher o mesmo arquivo de novo volte a disparar
    // o evento — sem isso, remover e reescolher a mesma foto não funcionaria.
    if (inputRef.current) inputRef.current.value = '';

    if (accepted.length === 0) return;

    // A validação acontece **antes** da redução, sobre o arquivo original: é o
    // tamanho que a pessoa escolheu que vale para o limite, e reduzir primeiro
    // faria um arquivo acima do teto passar silenciosamente.
    setPreparing(true);

    try {
      const prepared = await Promise.all(accepted.map((file) => compressImage(file, limits)));
      onChange([...photos, ...prepared]);
    } finally {
      setPreparing(false);
    }
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
          disabled={restantes <= 0 || preparing}
          onChange={handleSelection}
          className="w-full rounded-md border border-border-strong bg-surface p-2 text-sm"
        />

        {/* A redução de uma foto de celular leva um instante perceptível; sem este
            retorno a tela pareceria parada (RNF-CID-24). */}
        <p aria-live="polite" className="text-sm font-semibold text-ink-muted">
          {preparing ? 'Preparando as fotos para o envio…' : ''}
        </p>

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
            <li
              key={`${rejection.fileName}-${rejection.reason}`}
              // `break-words`: o nome do arquivo vem do aparelho e pode ser longo
              // e sem espaços, o que estouraria o layout em 320 px (RNF-CID-08).
              className="break-words text-sm text-danger"
            >
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
