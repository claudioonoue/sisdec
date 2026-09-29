import { cache } from 'react';
import type { CountByKey, DashboardSummary } from '@/types/dashboard';
import { apiRequest, type QueryValue } from './api-client';

/**
 * Indicadores do painel.
 *
 * Os três endpoints aceitam o mesmo recorte por período (`RF-OP-14`), e são
 * agregados no banco — o portal nunca soma listas para chegar a um total
 * (`RNF-OP-20`).
 */

export interface DashboardPeriod {
  from?: string;
  to?: string;
}

/**
 * Converte o recorte da tela, que é em dias, no instante que a API compara. O
 * dia final vai até o seu último momento; sem isso, "até hoje" esconderia tudo
 * o que foi registrado hoje.
 */
function periodQuery(period: DashboardPeriod): Record<string, QueryValue> {
  return {
    from: period.from ? `${period.from}T00:00:00.000Z` : undefined,
    to: period.to ? `${period.to}T23:59:59.999Z` : undefined,
  };
}

export const getSummary = cache(
  async (period: DashboardPeriod): Promise<DashboardSummary> =>
    apiRequest<DashboardSummary>('/dashboard/summary', { query: periodQuery(period) }),
);

export const getByDistrict = cache(
  async (period: DashboardPeriod): Promise<CountByKey[]> =>
    apiRequest<CountByKey[]>('/dashboard/by-district', { query: periodQuery(period) }),
);

export const getTimeline = cache(
  async (period: DashboardPeriod): Promise<CountByKey[]> =>
    apiRequest<CountByKey[]>('/dashboard/timeline', { query: periodQuery(period) }),
);
