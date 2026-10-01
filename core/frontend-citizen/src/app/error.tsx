'use client';

import { ServiceUnavailable } from '@/components/service-unavailable';

/**
 * Fronteira de erro do portal (RNF-CID-27).
 *
 * Existe para que uma falha inesperada em qualquer tela vire mensagem
 * compreensível, e não a tela técnica do Next nem uma página em branco. A
 * mensagem é sempre a genérica: `error.message` pode trazer detalhe interno.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4">
      <ServiceUnavailable message="Tivemos um problema do nosso lado. Tente de novo em alguns instantes." />
      <button
        type="button"
        onClick={reset}
        className="rounded-md border-2 border-brand px-4 py-2 font-semibold text-brand"
      >
        Tentar de novo
      </button>
    </div>
  );
}
