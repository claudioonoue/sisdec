'use client';

import { useState } from 'react';

/**
 * Botão de copiar o protocolo, com confirmação visual (RF-CID-26).
 *
 * `navigator.clipboard` não existe em contexto inseguro nem em todo navegador, e
 * aqui a falha é grave: sem o número a pessoa perde o único meio de acompanhar a
 * ocorrência. Por isso há recurso alternativo com `document.execCommand`, e, se
 * nem ele funcionar, a orientação de anotar à mão — nunca um silêncio.
 */
export function CopyProtocol({ protocolNumber }: { protocolNumber: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copy() {
    if (await copyToClipboard(protocolNumber)) {
      setState('copied');
      // A confirmação some depois de um tempo: mantê-la para sempre deixaria a
      // dúvida de a qual cópia ela se refere, se a pessoa acionar de novo.
      window.setTimeout(() => setState('idle'), 4000);
      return;
    }

    setState('failed');
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={copy}
        className="w-full rounded-md bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-strong sm:w-auto"
      >
        Copiar o número
      </button>

      {/*
        `aria-live` para que a confirmação também seja anunciada: quem usa leitor de
        tela não vê a mudança no texto do botão (RNF-CID-18).
      */}
      <p aria-live="polite" className="text-sm font-semibold">
        {state === 'copied' ? (
          <span className="text-success">Número copiado.</span>
        ) : state === 'failed' ? (
          <span className="text-danger">
            Não foi possível copiar neste aparelho. Anote o número acima antes de sair desta
            página.
          </span>
        ) : (
          <span className="sr-only">Nada copiado ainda.</span>
        )}
      </p>
    </div>
  );
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Cai no recurso alternativo abaixo: o acesso pode ser recusado mesmo quando a
    // API existe.
  }

  try {
    const field = document.createElement('textarea');
    field.value = text;
    // Fora da vista, mas no documento: um elemento não renderizado não é
    // selecionável.
    field.setAttribute('aria-hidden', 'true');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    return ok;
  } catch {
    return false;
  }
}
