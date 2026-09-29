import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_PAGE_SIZE = 20;
/** Teto de registros por requisição nas listagens paginadas (RNF-API-03). */
export const MAX_PAGE_SIZE = 100;

/** Parâmetros de paginação comuns a todas as listagens (RF-API-33). */
export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page deve ser um número inteiro' })
  @Min(1, { message: 'page deve ser no mínimo 1' })
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize deve ser um número inteiro' })
  @Min(1, { message: 'pageSize deve ser no mínimo 1' })
  @Max(MAX_PAGE_SIZE, { message: `pageSize deve ser no máximo ${MAX_PAGE_SIZE}` })
  pageSize: number = DEFAULT_PAGE_SIZE;

  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }

  get take(): number {
    return this.pageSize;
  }
}

/** Envelope de resposta das listagens paginadas. */
export class PaginatedDto<T> {
  @ApiProperty({ isArray: true })
  data!: T[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}

export function paginated<T>(
  data: T[],
  total: number,
  { page, pageSize }: Pick<PaginationQueryDto, 'page' | 'pageSize'>,
): PaginatedDto<T> {
  return { data, total, page, pageSize };
}
