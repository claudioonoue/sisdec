import { ApiProperty } from '@nestjs/swagger';
import type {
  ReportCategory,
  ReportStatus,
  ReportType,
} from '../../../generated/prisma/enums.js';

/** Item de enumeração: o valor usado pela API e o rótulo exibido ao usuário. */
export class EnumOptionDto<TValue extends string = string> {
  @ApiProperty({ description: 'Valor usado pela API', example: 'FLOODING' })
  value!: TValue;

  @ApiProperty({ description: 'Rótulo em pt-BR', example: 'Alagamento ou enchente' })
  label!: string;
}

/** Tipo de ocorrência: acrescenta a marcação de risco imediato à vida. */
export class ReportTypeOptionDto extends EnumOptionDto<ReportType> {
  @ApiProperty({
    description: 'Indica risco imediato à vida — reforça o aviso de emergência ao cidadão',
    example: false,
  })
  urgent!: boolean;
}

/** Limites de anexo efetivamente aplicados pela API. */
export class UploadLimitsDto {
  @ApiProperty({ description: 'Máximo de arquivos por requisição', example: 5 })
  maxFiles!: number;

  @ApiProperty({ description: 'Tamanho máximo por arquivo, em MB', example: 10 })
  maxSizeMb!: number;

  @ApiProperty({
    description: 'Formatos aceitos',
    example: ['image/jpeg', 'image/png', 'image/webp'],
  })
  acceptedMimeTypes!: string[];
}

/** Resposta de `GET /metadata` — enumerações públicas e limites de upload. */
export class PublicMetadataDto {
  @ApiProperty({ type: [ReportTypeOptionDto] })
  reportTypes!: ReportTypeOptionDto[];

  @ApiProperty({ type: [EnumOptionDto] })
  reportCategories!: EnumOptionDto<ReportCategory>[];

  @ApiProperty({ type: [EnumOptionDto] })
  reportStatuses!: EnumOptionDto<ReportStatus>[];

  @ApiProperty({ type: UploadLimitsDto })
  upload!: UploadLimitsDto;
}
