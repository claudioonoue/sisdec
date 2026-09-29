import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_FIELD,
  REPORT_SORT_FIELDS,
  buildReportOrderBy,
} from './report-sort.js';

describe('buildReportOrderBy', () => {
  it('ordena por data de registro, da mais recente para a mais antiga, por padrão', () => {
    expect(buildReportOrderBy()).toEqual([{ createdAt: 'desc' }, { id: 'asc' }]);
    expect(buildReportOrderBy(DEFAULT_SORT_FIELD, DEFAULT_SORT_DIRECTION)).toEqual(
      buildReportOrderBy(),
    );
  });

  it('inverte o sentido da data quando pedido', () => {
    expect(buildReportOrderBy('createdAt', 'asc')).toEqual([{ createdAt: 'asc' }, { id: 'asc' }]);
  });

  it('ordena por prioridade nas duas direções', () => {
    expect(buildReportOrderBy('priority', 'desc')[0]).toEqual({
      priority: { sort: 'desc', nulls: 'last' },
    });
    expect(buildReportOrderBy('priority', 'asc')[0]).toEqual({
      priority: { sort: 'asc', nulls: 'last' },
    });
  });

  it('mantém as ocorrências sem prioridade no fim, mesmo na ordem crescente', () => {
    // Prioridade nula é ausência de classificação — a ocorrência não passou pela
    // triagem —, e não a prioridade mais baixa. Subir essas linhas ao topo da
    // ordem crescente empurraria para baixo o que já foi classificado.
    for (const direction of ['asc', 'desc'] as const) {
      const [first] = buildReportOrderBy('priority', direction);
      expect(first).toMatchObject({ priority: { nulls: 'last' } });
    }
  });

  it('sempre fecha a ordem por um campo único, para a paginação ser estável', () => {
    // Sem desempate, duas linhas empatadas podem sair em ordens diferentes a cada
    // consulta, e a paginação repete umas e pula outras.
    for (const field of REPORT_SORT_FIELDS) {
      for (const direction of ['asc', 'desc'] as const) {
        const orderBy = buildReportOrderBy(field, direction);
        expect(orderBy.at(-1)).toEqual({ id: 'asc' });
      }
    }
  });

  it('desempata a prioridade pela data antes do id, para a lista ficar legível', () => {
    expect(buildReportOrderBy('priority', 'desc')[1]).toEqual({ createdAt: 'desc' });
  });
});
