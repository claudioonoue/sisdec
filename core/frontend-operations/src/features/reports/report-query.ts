import {
  type ReportSortField,
  type SortDirection,
  isReportSortField,
  isSortDirection,
} from '@/types/report';

/**
 * Os filtros da lista vivem na **URL**, não em estado de componente.
 *
 * É o que faz `RF-OP-21` (lista filtrada recarregável e compartilhável entre
 * agentes) e `RNF-OP-03` (filtros preservados ao voltar do detalhe) saírem de
 * graça: voltar é navegar para a mesma URL, e não há estado a restaurar. Também
 * é o que permite as telas serem renderizadas no servidor — o recorte chega na
 * requisição.
 *
 * Módulo sem importação de servidor: a tela lê da URL e o formulário de filtros,
 * que roda no navegador, escreve nela.
 */

export interface ReportFilters {
  status: string;
  type: string;
  category: string;
  priority: string;
  district: string;
  assignedToId: string;
  from: string;
  to: string;
  search: string;
  /** Apenas ocorrências em aberto — o recorte que o painel usa (RF-API-73). */
  open: boolean;
  sort: ReportSortField;
  order: SortDirection;
  page: number;
}

export const DEFAULT_SORT: ReportSortField = 'createdAt';
export const DEFAULT_ORDER: SortDirection = 'desc';

/** Nomes dos parâmetros na URL — em pt-BR, como o resto das rotas do portal. */
const PARAM = {
  status: 'situacao',
  type: 'tipo',
  category: 'categoria',
  priority: 'prioridade',
  district: 'bairro',
  assignedToId: 'responsavel',
  from: 'de',
  to: 'ate',
  search: 'busca',
  open: 'aberta',
  sort: 'ordenar',
  order: 'sentido',
  page: 'pagina',
} as const satisfies Record<keyof ReportFilters, string>;

export { PARAM as REPORT_PARAM };

export type RawSearchParams = Record<string, string | string[] | undefined>;

function one(params: RawSearchParams, key: string): string {
  const value = params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single?.trim() ?? '';
}

/**
 * Lê os filtros da URL.
 *
 * Valores inválidos viram o padrão em vez de erro: a URL é editável à mão e
 * compartilhada por mensagem, onde um parâmetro pode chegar truncado. Os valores
 * de enumeração não são conferidos aqui — quem os valida é a API, que responde
 * `400`, e repetir a lista deles no portal é exatamente o que `RNF-OP-45` evita.
 */
export function parseReportFilters(params: RawSearchParams): ReportFilters {
  const sort = one(params, PARAM.sort);
  const order = one(params, PARAM.order);
  const page = Number.parseInt(one(params, PARAM.page), 10);

  return {
    status: one(params, PARAM.status),
    type: one(params, PARAM.type),
    category: one(params, PARAM.category),
    priority: one(params, PARAM.priority),
    district: one(params, PARAM.district),
    assignedToId: one(params, PARAM.assignedToId),
    from: one(params, PARAM.from),
    to: one(params, PARAM.to),
    search: one(params, PARAM.search),
    open: one(params, PARAM.open) === '1',
    sort: isReportSortField(sort) ? sort : DEFAULT_SORT,
    order: isSortDirection(order) ? order : DEFAULT_ORDER,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Converte os filtros da tela nos parâmetros que a API espera. */
export function toApiQuery(filters: ReportFilters) {
  return {
    status: filters.status || undefined,
    type: filters.type || undefined,
    category: filters.category || undefined,
    priority: filters.priority || undefined,
    district: filters.district || undefined,
    assignedToId: filters.assignedToId || undefined,
    // Os campos de data da tela são dias; a API compara instantes. O dia final
    // vai até o seu último momento, senão filtrar "até hoje" esconderia tudo o
    // que foi registrado hoje.
    from: filters.from ? `${filters.from}T00:00:00.000Z` : undefined,
    to: filters.to ? `${filters.to}T23:59:59.999Z` : undefined,
    search: filters.search || undefined,
    open: filters.open ? 'true' : undefined,
    sort: filters.sort,
    order: filters.order,
    page: filters.page,
  };
}

/** Quantos filtros de recorte estão ativos — ordenação e página não contam. */
export function activeFilterCount(filters: ReportFilters): number {
  const recorte = [
    filters.status,
    filters.type,
    filters.category,
    filters.priority,
    filters.district,
    filters.assignedToId,
    filters.from,
    filters.to,
    filters.search,
    filters.open ? 'sim' : '',
  ];
  return recorte.filter(Boolean).length;
}

/**
 * Monta a query string a partir dos filtros, omitindo o que está vazio ou no
 * padrão — para que a URL de uma lista sem recorte seja `/ocorrencias`, e não
 * uma fileira de parâmetros vazios.
 */
export function buildReportSearch(filters: Partial<ReportFilters>): string {
  const params = new URLSearchParams();

  const put = (key: string, value: string | undefined) => {
    if (value) params.set(key, value);
  };

  put(PARAM.status, filters.status);
  put(PARAM.type, filters.type);
  put(PARAM.category, filters.category);
  put(PARAM.priority, filters.priority);
  put(PARAM.district, filters.district);
  put(PARAM.assignedToId, filters.assignedToId);
  put(PARAM.from, filters.from);
  put(PARAM.to, filters.to);
  put(PARAM.search, filters.search);
  if (filters.open) params.set(PARAM.open, '1');

  if (filters.sort && filters.sort !== DEFAULT_SORT) params.set(PARAM.sort, filters.sort);
  if (filters.order && filters.order !== DEFAULT_ORDER) params.set(PARAM.order, filters.order);
  if (filters.page && filters.page > 1) params.set(PARAM.page, String(filters.page));

  const search = params.toString();
  return search ? `?${search}` : '';
}

/** Endereço da lista com os filtros aplicados. */
export function reportsHref(filters: Partial<ReportFilters>): string {
  return `/ocorrencias${buildReportSearch(filters)}`;
}

/**
 * Endereço do detalhe, levando o recorte atual junto.
 *
 * É o que permite a volta do detalhe reencontrar a lista exatamente como estava
 * (`RNF-OP-03`) sem depender do histórico do navegador — um agente que chegou ao
 * detalhe por um link colado também consegue voltar.
 */
export function reportDetailHref(id: string, filters: Partial<ReportFilters>): string {
  const search = buildReportSearch(filters);
  return `/ocorrencias/${id}${search ? `?${new URLSearchParams({ volta: search }).toString()}` : ''}`;
}

/** Lê o recorte guardado pelo detalhe e devolve o endereço de volta à lista. */
export function backToListHref(params: RawSearchParams): string {
  const stored = one(params, 'volta');
  return `/ocorrencias${stored.startsWith('?') ? stored : ''}`;
}
