import { cache } from 'react';
import type { Agent } from '@/types/agent';
import type { Paginated } from '@/types/api';
import type { AgentSummary } from '@/types/report';
import type { CountByKey } from '@/types/dashboard';
import { ApiError } from './api-error';
import { apiRequest } from './api-client';

/**
 * Listas auxiliares dos filtros da ocorrência.
 *
 * Nenhuma delas é essencial à tela: quando a API recusa ou falha, o filtro
 * correspondente some e o restante continua funcionando. Um filtro a menos é
 * melhor do que uma lista que não carrega.
 */

/**
 * Agentes que podem receber uma ocorrência.
 *
 * Aberta a todo agente autenticado, porque o `RF-OP-16` pede o filtro por
 * responsável também para o perfil *Agente* — antes a rota era restrita à
 * coordenação, e o filtro sumia justamente para o perfil mais numeroso. A
 * **ação** de atribuir continua restrita, e quem a oferece é o painel de
 * atendimento, pelo perfil.
 */
export const getAssignableAgents = cache(async (): Promise<AgentSummary[]> => {
  try {
    return await apiRequest<AgentSummary[]>('/reports/assignable-agents');
  } catch (error) {
    if (error instanceof ApiError) return [];
    throw error;
  }
});

/**
 * Bairros com ocorrências registradas, para sugerir no filtro.
 *
 * Vem de `GET /dashboard/by-district`, que já agrega por bairro e é aberto a todo
 * agente — não há endpoint de bairros, e o `district` é campo livre no registro
 * do cidadão, então a lista de verdade é a do que já foi registrado. O filtro da
 * API compara o bairro por igualdade, ignorando caixa; a sugestão evita que o
 * agente tenha de acertar a grafia de memória.
 */
export const getDistricts = cache(async (): Promise<string[]> => {
  try {
    const rows = await apiRequest<CountByKey[]>('/dashboard/by-district');
    return rows.map((row) => row.key).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  } catch (error) {
    if (error instanceof ApiError) return [];
    throw error;
  }
});

/**
 * Cadastro completo de agentes — `GET /agents`, restrito ao administrador.
 *
 * Distinta de `getAssignableAgents`, que devolve só `id` e `name` a qualquer
 * agente: esta traz e-mail, perfil e situação de ativação, e é o que a tela de
 * gestão precisa (RF-OP-47).
 */
export function listAgents(page = 1): Promise<Paginated<Agent>> {
  return apiRequest<Paginated<Agent>>('/agents', { query: { page, pageSize: 100 } });
}
