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

/**
 * Transição que o agente autenticado pode executar nesta ocorrência agora
 * (RF-API-72).
 *
 * Resolvida para quem pergunta: a mesma ocorrência oferece ações diferentes ao
 * coordenador e ao agente que não é o seu responsável. Existe para que o Portal
 * de Operações ofereça só as ações válidas sem manter uma cópia do ciclo de vida
 * — a tabela de transições já divergiu uma vez entre documentos, e duas cópias
 * vivas divergiriam de novo.
 */
export class AvailableTransitionDto {
  @ApiProperty({ description: 'Situação alcançada pela transição' })
  to!: ReportStatus;

  @ApiProperty({
    enum: ['triage/start', 'triage', 'status'],
    description: 'Endpoint que executa a transição, relativo a /reports/:id',
  })
  owner!: 'triage/start' | 'triage' | 'status';

  @ApiProperty({ description: 'Comentário obrigatório na execução' })
  requiresComment!: boolean;
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

  @ApiProperty({
    description:
      'Ocorrência ainda em curso (RF-API-73). Não se deduz de availableTransitions vazia, ' +
      'que também fica vazia para quem não pode agir.',
  })
  open!: boolean;

  @ApiProperty({
    type: [AvailableTransitionDto],
    description: 'Transições que o agente autenticado pode executar agora (RF-API-72)',
  })
  availableTransitions!: AvailableTransitionDto[];
}
