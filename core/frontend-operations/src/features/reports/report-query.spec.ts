import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ORDER,
  DEFAULT_SORT,
  activeFilterCount,
  backToListHref,
  buildReportSearch,
  parseReportFilters,
  reportDetailHref,
  reportsHref,
  toApiQuery,
} from './report-query';

/**
 * O recorte da lista vive na URL — é dela que a tela do servidor lê, e é o que
 * sustenta `RF-OP-21` (lista recarregável e compartilhável) e `RNF-OP-03`
 * (filtros preservados ao voltar do detalhe). Um erro aqui não quebra a tela:
 * ela simplesmente mostra o recorte errado, que é pior.
 */
describe('parseReportFilters', () => {
  it('devolve os padrões quando a URL não traz nada', () => {
    const filters = parseReportFilters({});

    expect(filters.sort).toBe(DEFAULT_SORT);
    expect(filters.order).toBe(DEFAULT_ORDER);
    expect(filters.page).toBe(1);
    expect(filters.open).toBe(false);
    expect(activeFilterCount(filters)).toBe(0);
  });

  it('lê os filtros pelos nomes em pt-BR dos parâmetros', () => {
    const filters = parseReportFilters({
      situacao: 'IN_PROGRESS',
      prioridade: 'HIGH',
      bairro: 'Centro',
      busca: 'SISDEC-2026-000001',
      aberta: '1',
      pagina: '3',
    });

    expect(filters.status).toBe('IN_PROGRESS');
    expect(filters.priority).toBe('HIGH');
    expect(filters.district).toBe('Centro');
    expect(filters.search).toBe('SISDEC-2026-000001');
    expect(filters.open).toBe(true);
    expect(filters.page).toBe(3);
  });

  it('cai no padrão diante de valor inválido em vez de falhar', () => {
    // A URL é editável à mão e chega por mensagem, onde um parâmetro pode vir
    // truncado. Recorte estranho vira recorte padrão, não erro.
    const filters = parseReportFilters({
      ordenar: 'descricao',
      sentido: 'aleatorio',
      pagina: 'zero',
    });

    expect(filters.sort).toBe(DEFAULT_SORT);
    expect(filters.order).toBe(DEFAULT_ORDER);
    expect(filters.page).toBe(1);
  });

  it('usa o primeiro valor quando o parâmetro vem repetido', () => {
    expect(parseReportFilters({ bairro: ['Centro', 'Vila Nova'] }).district).toBe('Centro');
  });

  it('não conta ordenação nem página como recorte ativo', () => {
    const filters = parseReportFilters({ ordenar: 'priority', pagina: '4' });

    expect(activeFilterCount(filters)).toBe(0);
  });
});

describe('buildReportSearch', () => {
  it('omite o que está vazio ou no padrão, para a lista limpa ter endereço limpo', () => {
    expect(buildReportSearch(parseReportFilters({}))).toBe('');
    expect(reportsHref(parseReportFilters({}))).toBe('/ocorrencias');
  });

  it('faz ida e volta com os mesmos filtros', () => {
    const original = parseReportFilters({
      situacao: 'RECEIVED',
      bairro: 'São Bento',
      aberta: '1',
      ordenar: 'priority',
      sentido: 'asc',
      pagina: '2',
    });

    const relido = parseReportFilters(
      Object.fromEntries(new URLSearchParams(buildReportSearch(original))),
    );

    expect(relido).toEqual(original);
  });
});

describe('toApiQuery', () => {
  it('converte os dias da tela nos instantes que a API compara', () => {
    const query = toApiQuery(parseReportFilters({ de: '2026-09-01', ate: '2026-09-30' }));

    expect(query.from).toBe('2026-09-01T00:00:00.000Z');
    // O dia final vai até o último instante: sem isso, filtrar "até hoje"
    // esconderia tudo o que foi registrado hoje.
    expect(query.to).toBe('2026-09-30T23:59:59.999Z');
  });

  it('omite o que está vazio em vez de mandar string vazia à API', () => {
    const query = toApiQuery(parseReportFilters({}));

    expect(query.status).toBeUndefined();
    expect(query.district).toBeUndefined();
    expect(query.open).toBeUndefined();
  });
});

describe('ida e volta ao detalhe', () => {
  it('leva o recorte no endereço do detalhe e o devolve intacto', () => {
    // RNF-OP-03: quem chega ao detalhe por um link colado também consegue voltar
    // à lista como ela estava, sem depender do histórico do navegador.
    const filters = parseReportFilters({ situacao: 'IN_PROGRESS', ordenar: 'priority' });
    const href = reportDetailHref('abc-123', filters);

    const query = Object.fromEntries(new URLSearchParams(href.split('?')[1]));
    expect(backToListHref(query)).toBe(reportsHref(filters));
  });

  it('volta para a lista sem recorte quando não há nada guardado', () => {
    expect(backToListHref({})).toBe('/ocorrencias');
  });

  it('recusa endereço externo disfarçado de recorte', () => {
    expect(backToListHref({ volta: 'https://exemplo.invalid' })).toBe('/ocorrencias');
  });
});
