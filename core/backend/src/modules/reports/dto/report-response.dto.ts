import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ReportCategory, ReportStatus, ReportType } from '../../../generated/prisma/enums.js';

/** Resposta de `POST /reports`: o mínimo para o cidadão guardar o protocolo. */
export class ReportCreatedDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'SISDEC-2026-000142' }) protocolNumber!: string;
  @ApiProperty({ example: 'RECEIVED' }) status!: ReportStatus;
  @ApiProperty() createdAt!: Date;
}

/** Andamento visível ao cidadão — sem o agente autor. */
export class PublicReportUpdateDto {
  @ApiPropertyOptional({ nullable: true }) toStatus!: ReportStatus | null;
  @ApiPropertyOptional({ nullable: true }) comment!: string | null;
  @ApiProperty() createdAt!: Date;
}

export class PublicAttachmentDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: '/api/v1/attachments/9a1b...' }) url!: string;
}

/**
 * Resposta de `GET /reports/protocol/:protocolNumber`.
 *
 * Deliberadamente **não** carrega `description`, `address`, `latitude`,
 * `longitude`, `citizen` nem `assignedTo`: qualquer pessoa com o protocolo abre
 * esta consulta, e esses campos permitem identificar quem registrou
 * (RF-API-14). `priority` também fica fora — é classificação operacional interna
 * (RF-API-65).
 */
export class PublicReportDto {
  @ApiProperty() protocolNumber!: string;
  @ApiProperty() category!: ReportCategory;
  @ApiProperty() type!: ReportType;
  @ApiProperty() status!: ReportStatus;
  @ApiProperty() district!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty({ nullable: true }) resolvedAt!: Date | null;
  @ApiProperty({ type: [PublicReportUpdateDto] }) updates!: PublicReportUpdateDto[];
  @ApiProperty({ type: [PublicAttachmentDto] }) attachments!: PublicAttachmentDto[];
}
