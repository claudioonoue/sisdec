import type { ReportOrderByWithRelationInput } from '../../generated/prisma/models.js';

/**
 * Ordenação da listagem de ocorrências (RF-API-71).
 *
 * Existe porque o `RF-OP-19` pede ordenação por data e por prioridade no Portal
 * de Operações, e o `RNF-OP-20` proíbe o portal de ordenar no navegador — ele só
 * recebe a página corrente, então ordenar ali reordenaria vinte linhas, não a
 * lista. A ordenação tem de vir do banco.
 *
 * Os campos são uma **lista branca**, e não um nome de coluna vindo da query:
 * repassar texto do cliente para o `orderBy` expõe a estrutura da tabela e casa
 * mal com os índices declarados em `RNF-API-04`. Os dois campos aqui são
 * exatamente os dois indexados que o requisito pede.
 */

export const REPORT_SORT_FIELDS = ['createdAt', 'priority'] as const;
export type ReportSortField = (typeof REPORT_SORT_FIELDS)[number];

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const DEFAULT_SORT_FIELD: ReportSortField = 'createdAt';
export const DEFAULT_SORT_DIRECTION: SortDirection = 'desc';

/**
 * Monta o `orderBy` do Prisma.
 *
 * Sempre devolve uma lista com **critério de desempate**: sem ele, duas
 * ocorrências com a mesma prioridade (ou o mesmo instante de registro) podem sair
 * em ordens diferentes a cada consulta, e a paginação passa a repetir e a pular
 * linhas entre páginas. O `id` fecha a ordem, porque é único.
 *
 * As ocorrências **sem prioridade** ficam sempre por último, nas duas direções:
 * prioridade nula não é "a mais baixa", é ausência de classificação — a
 * ocorrência ainda não passou pela triagem. Colocá-la no topo de uma lista
 * ordenada por prioridade crescente empurraria para baixo justamente o que já
 * foi classificado.
 */
export function buildReportOrderBy(
  field: ReportSortField = DEFAULT_SORT_FIELD,
  direction: SortDirection = DEFAULT_SORT_DIRECTION,
): ReportOrderByWithRelationInput[] {
  if (field === 'priority') {
    return [{ priority: { sort: direction, nulls: 'last' } }, { createdAt: 'desc' }, { id: 'asc' }];
  }

  return [{ createdAt: direction }, { id: 'asc' }];
}
