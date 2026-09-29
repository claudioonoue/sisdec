import { cache } from 'react';
import type { AgentRole } from '@/types/enums';
import type { AgentSummary } from '@/types/report';
import type { CountByKey } from '@/types/dashboard';
import { canCoordinate } from '@/types/agent';
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
 * `GET /reports/assignable-agents` é restrito a coordenador e administrador, e o
 * perfil é conferido **antes** de chamar — não para proteger nada, que é papel da
 * API, mas para não provocar um `403` previsível a cada carregamento da lista de
 * um agente comum. Para esse perfil o recorte pelas próprias ocorrências é o
 * atalho "Minhas ocorrências" (RF-OP-20).
 */
export const getAssignableAgents = cache(async (role: AgentRole): Promise<AgentSummary[]> => {
  if (!canCoordinate(role)) return [];

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
