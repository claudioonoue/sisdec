import Link from 'next/link';
import { Alert } from './ui/alert';

/**
 * Tela exibida quando a API do SISDEC não responde.
 *
 * RF-OP-59 e RNF-OP-25: indisponibilidade vira mensagem compreensível, com
 * caminho para nova tentativa — nunca tela técnica nem página em branco.
 */
export function ServiceUnavailable({ message }: { message: string }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-5">
        <div>
          <p className="text-lg font-semibold tracking-tight text-ink">SISDEC</p>
          <p className="text-sm text-ink-muted">Portal de Operações</p>
        </div>

        <Alert tone="error" title="Não foi possível carregar o portal">
          {message}
        </Alert>

        <p className="text-sm text-ink-muted">
          O portal depende da API do SISDEC para todo o seu conteúdo. Assim que ela
          voltar a responder, recarregue a página.
        </p>

        {/*
          Link e não botão: a nova tentativa é uma navegação, que refaz a
          renderização no servidor — e continua sendo uma âncora no HTML
          entregue, de modo que funcione mesmo sem JavaScript, justamente
          quando algo já está fora do ar.
        */}
        <Link
          href="/"
          className="inline-block rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          Tentar novamente
        </Link>
      </div>
    </div>
  );
}
