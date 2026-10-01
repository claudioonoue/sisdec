import { apiRequest } from './api-client';
import type { PublicMetadata, ReportTypeOption } from '@/types/metadata';

/**
 * Enumerações e limites servidos pela API.
 *
 * RF-CID-08, RF-CID-41: os rótulos em pt-BR de tipo, categoria e situação vêm
 * daqui. O portal não mantém lista nem mapa de tradução próprio — acrescentar um
 * tipo de ocorrência na API não exige tocar neste portal.
 *
 * A carga é cacheada por hora: muda com migração do banco, não com o uso, e
 * buscá-la a cada navegação custaria uma viagem à API em todas as telas.
 */
export function fetchPublicMetadata(): Promise<PublicMetadata> {
  return apiRequest<PublicMetadata>('/metadata', { revalidate: 3600 });
}

/** Rótulo de um valor, ou o próprio valor quando a API não o conhece. */
export function labelOf<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  value: T | null | undefined,
): string {
  if (!value) return '';
  return options.find((option) => option.value === value)?.label ?? value;
}

/** Tipos de risco imediato à vida, na ordem em que a API os devolve. */
export function urgentTypes(metadata: PublicMetadata): ReportTypeOption[] {
  return metadata.reportTypes.filter((type) => type.urgent);
}
