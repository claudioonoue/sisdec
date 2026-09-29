import type { ReactNode } from 'react';
import Link from 'next/link';
import type { AuthenticatedAgent } from '@/types/agent';
import type { PortalMetadata } from '@/types/metadata';
import { isAdmin } from '@/types/agent';
import { labelFor } from '@/lib/enum-label';
import { MetadataProvider } from '@/features/metadata/metadata-provider';
import { MainNav, type NavItem } from './main-nav';

/**
 * Moldura das telas autenticadas: navegação permanente, identificação do agente
 * e encerramento de sessão.
 */
export function AppShell({
  agent,
  metadata,
  children,
}: {
  agent: AuthenticatedAgent;
  metadata: PortalMetadata;
  children: ReactNode;
}) {
  const items: NavItem[] = [
    { href: '/', label: 'Painel' },
    { href: '/ocorrencias', label: 'Ocorrências' },
    { href: '/mapa', label: 'Mapa' },
  ];

  // RF-OP-52: o acesso a agentes não aparece para agente nem coordenador. A
  // rota também se recusa a renderizar para eles — ocultar o item é conforto,
  // não proteção (RNF-OP-14).
  if (isAdmin(agent.role)) {
    items.push({ href: '/agentes', label: 'Agentes' });
  }

  return (
    <MetadataProvider value={metadata}>
      <div className="flex min-h-full flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-brand-strong focus:shadow"
        >
          Ir para o conteúdo
        </a>

        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-8 gap-y-3 px-6 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
              SISDEC
              <span className="ml-2 text-sm font-normal text-ink-muted">Operações</span>
            </Link>

            <MainNav items={items} />

            <div className="ml-auto flex items-center gap-4">
              <p className="text-right text-sm leading-tight">
                <span className="block font-medium text-ink">{agent.name}</span>
                {/* RF-OP-05 e RF-OP-57: o perfil é exibido pelo rótulo em pt-BR
                    vindo de GET /metadata/internal, nunca pelo valor da API. */}
                <span className="block text-ink-muted">
                  {labelFor(metadata.agentRoles, agent.role)}
                </span>
              </p>

              {/*
                RF-OP-06: encerrar a sessão é uma operação de escrita — o cookie
                é httpOnly e só o servidor pode descartá-lo. Um formulário POST
                garante que a saída não aconteça por pré-carregamento de link.
              */}
              <form action="/sair" method="post">
                <button
                  type="submit"
                  className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>
        </header>

        <main id="conteudo" className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-8">
          {children}
        </main>
      </div>
    </MetadataProvider>
  );
}
