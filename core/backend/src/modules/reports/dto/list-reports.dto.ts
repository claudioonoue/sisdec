import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import {
  Priority,
  ReportCategory,
  ReportStatus,
  ReportType,
} from '../../../generated/prisma/enums.js';
import {
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_FIELD,
  REPORT_SORT_FIELDS,
  type ReportSortField,
  SORT_DIRECTIONS,
  type SortDirection,
} from '../report-sort.js';

/** Filtros da listagem de ocorrências (RF-API-32), todos combináveis. */
export class ListReportsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({ enum: ReportType })
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @ApiPropertyOptional({ enum: ReportCategory })
  @IsOptional()
  @IsEnum(ReportCategory)
  category?: ReportCategory;

  @ApiPropertyOptional({ enum: Priority })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @ApiPropertyOptional({ description: 'Agente responsável' })
  @IsOptional()
  @IsUUID('4', { message: 'assignedToId deve ser um UUID' })
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Registradas a partir desta data (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'from deve ser uma data ISO 8601' })
  from?: string;

  @ApiPropertyOptional({ description: 'Registradas até esta data (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'to deve ser uma data ISO 8601' })
  to?: string;

  @ApiPropertyOptional({ description: 'Busca por protocolo ou conteúdo da descrição' })
  @IsOptional()
  @IsString()
  @Type(() => String)
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({
    enum: ['true', 'false'],
    description:
      'Apenas ocorrências em aberto (RF-API-73). Ignorado quando `status` é informado, ' +
      'que é o recorte mais específico.',
  })
  @IsOptional()
  @IsIn(['true', 'false'], { message: "open deve ser 'true' ou 'false'" })
  open?: string;

  @ApiPropertyOptional({
    enum: REPORT_SORT_FIELDS,
    default: DEFAULT_SORT_FIELD,
    description: 'Campo de ordenação (RF-API-71)',
  })
  @IsOptional()
  @IsIn(REPORT_SORT_FIELDS, { message: `sort deve ser um de: ${REPORT_SORT_FIELDS.join(', ')}` })
  sort?: ReportSortField;

  @ApiPropertyOptional({
    enum: SORT_DIRECTIONS,
    default: DEFAULT_SORT_DIRECTION,
    description: 'Sentido da ordenação',
  })
  @IsOptional()
  @IsIn(SORT_DIRECTIONS, { message: `order deve ser um de: ${SORT_DIRECTIONS.join(', ')}` })
  order?: SortDirection;
}
