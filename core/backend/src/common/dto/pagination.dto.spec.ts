import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  PaginationQueryDto,
  paginated,
} from './pagination.dto.js';

function validar(query: Record<string, unknown>) {
  const dto = plainToInstance(PaginationQueryDto, query, { exposeDefaultValues: true });
  return { dto, errors: validateSync(dto) };
}

describe('PaginationQueryDto', () => {
  it('usa página 1 e o tamanho padrão quando nada é informado', () => {
    const { dto, errors } = validar({});

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(DEFAULT_PAGE_SIZE);
  });

  it('converte os parâmetros de texto para número', () => {
    const { dto, errors } = validar({ page: '3', pageSize: '50' });

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(3);
    expect(dto.pageSize).toBe(50);
  });

  it('calcula skip e take a partir da página', () => {
    const { dto } = validar({ page: '3', pageSize: '20' });

    expect(dto.skip).toBe(40);
    expect(dto.take).toBe(20);
  });

  it('recusa pageSize acima do teto (RNF-API-03)', () => {
    const { errors } = validar({ pageSize: String(MAX_PAGE_SIZE + 1) });

    expect(errors).toHaveLength(1);
    expect(JSON.stringify(errors)).toContain('pageSize');
  });

  it('aceita pageSize exatamente no teto', () => {
    const { errors } = validar({ pageSize: String(MAX_PAGE_SIZE) });

    expect(errors).toHaveLength(0);
  });

  it('recusa página menor que 1', () => {
    const { errors } = validar({ page: '0' });

    expect(errors).toHaveLength(1);
  });
});

describe('paginated', () => {
  it('monta o envelope no formato do contrato', () => {
    expect(paginated(['a', 'b'], 7, { page: 2, pageSize: 20 })).toEqual({
      data: ['a', 'b'],
      total: 7,
      page: 2,
      pageSize: 20,
    });
  });
});
