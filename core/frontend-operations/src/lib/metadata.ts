import { cache } from 'react';
import type { InternalMetadata, PortalMetadata, PublicMetadata } from '@/types/metadata';
import { apiRequest } from './api-client';

/**
 * Carga das enumerações e dos seus rótulos em pt-BR.
 *
 * RF-OP-56 e RNF-OP-45: nenhuma lista de tipos, categorias, situações,
 * prioridades ou perfis é mantida no código do portal — todas vêm de
 * `GET /metadata` e `GET /metadata/internal`.
 */

/** Cinco minutos: as enumerações mudam com o código da API, não com o uso. */
const METADATA_TTL_SECONDS = 300;

const getPublicMetadata = cache(
  async (): Promise<PublicMetadata> =>
    apiRequest<PublicMetadata>('/metadata', { auth: false, revalidate: METADATA_TTL_SECONDS }),
);

/**
 * `GET /metadata/internal` exige token. Não é cacheada entre requisições de
 * propósito: o cache de `fetch` do Next tem como chave a URL, não o cabeçalho
 * `Authorization`, e guardar resposta autenticada nele é um hábito que, em uma
 * rota com conteúdo por agente, vazaria dado de um para outro. O `cache` do
 * React já evita a repetição dentro da mesma requisição, que é o que pesa.
 */
const getInternalMetadata = cache(
  async (): Promise<InternalMetadata> => apiRequest<InternalMetadata>('/metadata/internal'),
);

/** As duas cargas reunidas, como as telas as consomem. */
export const getMetadata = cache(async (): Promise<PortalMetadata> => {
  const [publicMetadata, internalMetadata] = await Promise.all([
    getPublicMetadata(),
    getInternalMetadata(),
  ]);
  return { ...publicMetadata, ...internalMetadata };
});
