'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { ReportAttachment } from '@/types/report';
import { formatFileSize } from '@/lib/format';

/**
 * Fotos anexadas pelo cidadão, com ampliação ao serem acionadas (RF-OP-27).
 *
 * As imagens vêm **sempre** pela URL servida pela API (RNF-OP-18): o portal não
 * conhece disco nem bucket. A miniatura passa pelo otimizador do Next, que serve
 * uma versão reduzida; o arquivo íntegro só é baixado na ampliação (RNF-OP-24).
 *
 * O nome original do arquivo não é exibido como texto principal — ele é escrito
 * pelo cidadão e pode carregar dado pessoal. Fica no `alt` e no rodapé da
 * ampliação, onde é útil para identificar a foto.
 */
export function ReportAttachments({
  attachments,
  apiOrigin,
}: {
  attachments: ReportAttachment[];
  apiOrigin: string;
}) {
  const [opened, setOpened] = useState<ReportAttachment | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    // `showModal` é o que dá foco preso, fechamento por Esc e inerte no fundo
    // sem nenhum código próprio — o diálogo nativo já faz o trabalho de
    // acessibilidade que uma div com `role="dialog"` exigiria reimplementar.
    if (opened && !element.open) element.showModal();
    if (!opened && element.open) element.close();
  }, [opened]);

  if (attachments.length === 0) {
    return <p className="text-sm text-ink-muted">Nenhuma foto foi anexada a esta ocorrência.</p>;
  }

  return (
    <>
      <ul className="flex flex-wrap gap-3">
        {attachments.map((attachment) => (
          <li key={attachment.id}>
            <button
              type="button"
              onClick={() => setOpened(attachment)}
              className="block overflow-hidden rounded-md border border-border transition-colors hover:border-brand"
            >
              <Image
                src={`${apiOrigin}${attachment.url}`}
                alt={`Ampliar a foto ${attachment.fileName}`}
                width={160}
                height={120}
                className="h-[120px] w-[160px] object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setOpened(null)}
        onClick={(event) => {
          // Clique no fundo fecha; clique na imagem, não.
          if (event.target === dialog.current) setOpened(null);
        }}
        className="max-h-[90vh] max-w-[90vw] rounded-lg border border-border bg-surface p-0 backdrop:bg-black/60"
      >
        {opened ? (
          <figure className="m-0">
            {/*
              Ampliação sem otimização: aqui o ponto é ver a foto como o cidadão
              a enviou. Por não conhecer as dimensões do arquivo, usa-se <img>
              com limites de viewport em vez de next/image.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${apiOrigin}${opened.url}`}
              alt={opened.fileName}
              className="max-h-[75vh] max-w-[85vw] object-contain"
            />
            <figcaption className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-sm">
              <span className="text-ink-muted">
                {opened.fileName} · {formatFileSize(opened.sizeInBytes)}
              </span>
              <button
                type="button"
                onClick={() => setOpened(null)}
                className="rounded-md border border-border px-3 py-1.5 font-medium text-ink"
              >
                Fechar
              </button>
            </figcaption>
          </figure>
        ) : null}
      </dialog>
    </>
  );
}
