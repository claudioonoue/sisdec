import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

/** Recorte opcional por período, comum aos três endpoints do painel (RF-API-55). */
export class DashboardPeriodDto {
  @ApiPropertyOptional({ description: 'Início do período (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'from deve ser uma data ISO 8601' })
  from?: string;

  @ApiPropertyOptional({ description: 'Fim do período (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'to deve ser uma data ISO 8601' })
  to?: string;
}

export class CountByKeyDto {
  @ApiProperty() key!: string;
  @ApiProperty() total!: number;
}

export class DashboardSummaryDto {
  @ApiProperty({ description: 'Ocorrências ainda não encerradas' })
  open!: number;

  @ApiProperty() total!: number;

  @ApiProperty({ type: [CountByKeyDto] }) byStatus!: CountByKeyDto[];
  @ApiProperty({ type: [CountByKeyDto] }) byPriority!: CountByKeyDto[];
  @ApiProperty({ type: [CountByKeyDto] }) byType!: CountByKeyDto[];
}
