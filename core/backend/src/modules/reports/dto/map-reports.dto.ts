import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OmitType } from '@nestjs/swagger';
import { ListReportsQueryDto } from './list-reports.dto.js';

/**
 * Filtros do mapa: os mesmos da listagem, **sem** paginação.
 *
 * O mapa precisa de todos os pontos do recorte de uma vez; o teto de `pageSize`
 * impediria exibi-los (RNF-OP-23). O limite próprio desta rota é o `MAP_LIMIT`.
 */
export class MapReportsQueryDto extends OmitType(ListReportsQueryDto, [
  'page',
  'pageSize',
] as const) {}

export class MapReportDto {
  @ApiProperty() id!: string;
  @ApiProperty() protocolNumber!: string;
  @ApiProperty() type!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ nullable: true }) priority!: string | null;
  @ApiProperty() latitude!: number;
  @ApiProperty() longitude!: number;
}

export class MapResponseDto {
  @ApiProperty({ type: [MapReportDto] }) data!: MapReportDto[];
  @ApiProperty() total!: number;

  @ApiProperty({
    description: 'Quantas ocorrências do recorte ficaram de fora por não ter coordenadas',
  })
  omittedWithoutCoordinates!: number;

  @ApiProperty({ description: 'Verdadeiro quando o teto de registros foi atingido' })
  truncated!: boolean;
}
