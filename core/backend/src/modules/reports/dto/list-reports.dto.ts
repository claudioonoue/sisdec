import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import {
  Priority,
  ReportCategory,
  ReportStatus,
  ReportType,
} from '../../../generated/prisma/enums.js';

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
}
