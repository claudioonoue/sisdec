import { cache } from 'react';
import type { Paginated } from '@/types/api';
import type { ReportDetail, ReportListItem } from '@/types/report';
import { apiRequest, type QueryValue } from './api-client';

/**
 * Acesso às ocorrências.
 *
 * A filtragem, a ordenação e a paginação são **da API** (`RNF-OP-20`): o portal
 * pede uma página por vez e não guarda a base em memória.
 */

/** Filtros da listagem, já no formato que a API espera. */
export interface ReportQuery {
  status?: string;
  type?: string;
  category?: string;
  priority?: string;
  district?: string;
  assignedToId?: string;
  from?: string;
  to?: string;
  search?: string;
  sort?: string;
  order?: string;
  page?: number;
  pageSize?: number;
}

export const PAGE_SIZE = 20;

export function listReports(query: ReportQuery): Promise<Paginated<ReportListItem>> {
  return apiRequest<Paginated<ReportListItem>>('/reports', {
    query: { ...query, pageSize: query.pageSize ?? PAGE_SIZE } as Record<string, QueryValue>,
  });
}

/**
 * Detalhe de uma ocorrência.
 *
 * `cache` do React: o layout e a página podem pedir a mesma ocorrência sem que
 * ela seja buscada duas vezes na mesma requisição.
 */
export const getReport = cache(
  async (id: string): Promise<ReportDetail> => apiRequest<ReportDetail>(`/reports/${id}`),
);
