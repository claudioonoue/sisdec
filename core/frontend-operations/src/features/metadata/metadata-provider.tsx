'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { EnumOption, PortalMetadata } from '@/types/metadata';
import { labelFor } from '@/lib/enum-label';

/**
 * Metadados disponíveis aos componentes de cliente.
 *
 * A carga é feita uma única vez, no servidor (`lib/metadata.ts`), e entregue
 * pelo layout autenticado. Este provider existe para que filtros, formulários de
 * triagem e a legenda do mapa — que são interativos e, portanto, rodam no
 * navegador — obtenham os rótulos em pt-BR sem refazer a requisição e sem
 * manter mapa de tradução próprio (RF-OP-56, RNF-OP-45).
 */
const MetadataContext = createContext<PortalMetadata | null>(null);

export function MetadataProvider({
  value,
  children,
}: {
  value: PortalMetadata;
  children: ReactNode;
}) {
  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>;
}

export function useMetadata(): PortalMetadata {
  const metadata = useContext(MetadataContext);
  if (!metadata) {
    throw new Error(
      'useMetadata() foi chamado fora do MetadataProvider. ' +
        'Os componentes que dependem dos rótulos precisam estar dentro do layout autenticado.',
    );
  }
  return metadata;
}

/**
 * Tradutor de valores de enumeração para uso em componentes de cliente.
 * Recebe a lista de opções do próprio `useMetadata()`.
 */
export function useLabelFor() {
  const metadata = useMetadata();
  return <TValue extends string>(
    options: (self: PortalMetadata) => readonly EnumOption<TValue>[],
    value: TValue | null | undefined,
  ): string => labelFor(options(metadata), value);
}
