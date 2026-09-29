'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  href: string;
  label: string;
}

/**
 * Navegação permanente entre painel, ocorrências, mapa e — para o administrador
 * — agentes (RF-OP-60). Quais itens aparecem é decidido no servidor, em
 * `AppShell`: este componente só precisa saber qual deles está ativo, e para
 * isso precisa rodar no navegador.
 */
export function MainNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Seções do portal">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const active =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                // RNF-OP-31: o destaque do item ativo não é só cor de fundo —
                // `aria-current` informa o mesmo a quem usa leitor de tela.
                aria-current={active ? 'page' : undefined}
                className={`inline-block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-soft text-brand-strong'
                    : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
