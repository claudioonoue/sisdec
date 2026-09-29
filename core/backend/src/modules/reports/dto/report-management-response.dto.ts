import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  Priority,
  ReportCategory,
  ReportStatus,
  ReportType,
} from '../../../generated/prisma/enums.js';

export class AgentSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
}

/** Ocorrência na listagem e nas respostas das ações de atendimento. */
export class ReportListItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() protocolNumber!: string;
  @ApiProperty() category!: ReportCategory;
  @ApiProperty() type!: ReportType;
  @ApiProperty() status!: ReportStatus;
  @ApiPropertyOptional({ nullable: true }) priority!: Priority | null;
  @ApiProperty() district!: string;
  @ApiProperty() createdAt!: Date;
  @ApiPropertyOptional({ type: AgentSummaryDto, nullable: true })
  assignedTo!: AgentSummaryDto | null;
}

export class PaginatedReportsDto {
  @ApiProperty({ type: [ReportListItemDto] }) data!: ReportListItemDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}

export class CitizenSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) email!: string | null;
  @ApiPropertyOptional({ nullable: true }) phone!: string | null;
}

export class ReportAttachmentDto {
  @ApiProperty() id!: string;
  @ApiProperty() fileName!: string;
  @ApiProperty() mimeType!: string;
  @ApiProperty() sizeInBytes!: number;
  @ApiProperty({ example: '/api/v1/attachments/9a1b...' }) url!: string;
}

export class ReportUpdateResponseDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ nullable: true }) fromStatus!: ReportStatus | null;
  @ApiPropertyOptional({ nullable: true }) toStatus!: ReportStatus | null;
  @ApiPropertyOptional({ nullable: true }) comment!: string | null;
  @ApiProperty({ description: 'Quando verdadeiro, aparece na consulta pública' })
  visibleToCitizen!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty({ type: AgentSummaryDto }) agent!: AgentSummaryDto;
}

/** Detalhe completo — visível apenas a agentes autenticados. */
export class ReportDetailDto extends ReportListItemDto {
  @ApiProperty() description!: string;
  @ApiProperty() address!: string;
  @ApiPropertyOptional({ nullable: true }) latitude!: number | null;
  @ApiPropertyOptional({ nullable: true }) longitude!: number | null;
  @ApiProperty() updatedAt!: Date;
  @ApiPropertyOptional({ nullable: true }) resolvedAt!: Date | null;
  @ApiPropertyOptional({ type: CitizenSummaryDto, nullable: true, description: 'Nulo se anônima' })
  citizen!: CitizenSummaryDto | null;
  @ApiProperty({ type: [ReportAttachmentDto] }) attachments!: ReportAttachmentDto[];
  @ApiProperty({ type: [ReportUpdateResponseDto] }) updates!: ReportUpdateResponseDto[];
  @ApiPropertyOptional({
    nullable: true,
    description: 'HIGH nos tipos de risco imediato à vida; a decisão segue do coordenador',
  })
  suggestedPriority!: Priority | null;
}
