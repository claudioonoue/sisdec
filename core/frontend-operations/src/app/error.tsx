'use client';

import { Alert } from '@/components/ui/alert';

/**
 * Limite de erro das telas (RF-OP-59, RNF-OP-25).
 *
 * A mensagem técnica não é exibida: ela pode carregar dado do cidadão vindo da
 * resposta da API (RNF-OP-16). Fica no log do servidor, para quem mantém.
 */
export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-5 py-12">
      <Alert tone="error" title="Não foi possível carregar esta tela">
        O sistema encontrou um erro inesperado ao montar a página. Tente novamente; se o
        problema continuar, avise o administrador do SISDEC.
      </Alert>

      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
      >
        Tentar novamente
      </button>
    </div>
  );
}
