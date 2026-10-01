import Link from 'next/link';

/**
 * Cabeçalho do portal.
 *
 * Mantém o acesso às orientações a partir de qualquer tela (RF-CID-04) e o
 * caminho de volta ao início. A navegação é curta de propósito: o portal tem um
 * objetivo só, e cada opção a mais é uma decisão a mais para quem está com pressa.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" aria-label="SISDEC — ir para o início" className="font-bold text-brand">
          SISDEC
        </Link>

        <nav aria-label="Navegação principal">
          <Link href="/orientacoes" className="text-sm font-medium text-brand underline">
            Orientações
          </Link>
        </nav>
      </div>
    </header>
  );
}
