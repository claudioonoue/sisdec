import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Priority, ReportStatus, ReportType } from '../../../generated/prisma/enums.js';

/** Resultado da triagem: encaminhar para atendimento ou declarar improcedente. */
export const TRIAGE_OUTCOMES = ['ACCEPT', 'REJECT'] as const;
export type TriageOutcome = (typeof TRIAGE_OUTCOMES)[number];

export class ConcludeTriageDto {
  @ApiProperty({ enum: TRIAGE_OUTCOMES })
  @IsIn(TRIAGE_OUTCOMES, { message: 'outcome deve ser ACCEPT ou REJECT' })
  outcome!: TriageOutcome;

  @ApiPropertyOptional({ enum: ReportType, description: 'Confirma ou corrige o tipo' })
  @IsOptional()
  @IsEnum(ReportType, { message: 'type não é um tipo de ocorrência válido' })
  type?: ReportType;

  @ApiPropertyOptional({ enum: Priority, description: 'Obrigatória quando outcome é ACCEPT' })
  @IsOptional()
  @IsEnum(Priority, { message: 'priority deve ser LOW, MEDIUM, HIGH ou CRITICAL' })
  priority?: Priority;

  @ApiPropertyOptional({ description: 'Obrigatório quando outcome é REJECT' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'comment não pode ser vazio' })
  @MaxLength(2000)
  comment?: string;
}

export class AssignReportDto {
  @ApiProperty({ description: 'Agente responsável — precisa estar ativo' })
  @IsUUID('4', { message: 'assignedToId deve ser um UUID' })
  assignedToId!: string;
}

export class ChangeStatusDto {
  @ApiProperty({ enum: [ReportStatus.RESOLVED, ReportStatus.CANCELLED] })
  @IsEnum(ReportStatus, { message: 'status não é uma situação válida' })
  status!: ReportStatus;

  @ApiProperty({ description: 'Obrigatório ao concluir ou cancelar' })
  @IsString()
  @IsNotEmpty({ message: 'comment não pode ser vazio' })
  @MaxLength(2000)
  comment!: string;
}

export class CreateReportUpdateDto {
  @ApiProperty({ description: 'Texto do andamento' })
  @IsString()
  @IsNotEmpty({ message: 'comment não pode ser vazio' })
  @MaxLength(2000)
  comment!: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Quando verdadeiro, o texto aparece na consulta pública por protocolo',
  })
  @IsOptional()
  visibleToCitizen?: boolean;
}
