import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ReportCategory, ReportType } from '../../../generated/prisma/enums.js';

/**
 * Dados de contato do cidadão. Todo o objeto é opcional: ausente, a ocorrência é
 * registrada como anônima (RF-API-04). Presente, o nome é obrigatório — um
 * contato sem nome não serve para nada e só acumularia dado pessoal sem uso
 * (RNF-API-42).
 */
export class CreateCitizenDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @IsNotEmpty({ message: 'citizen.name não pode ser vazio' })
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'maria@exemplo.com' })
  @IsOptional()
  @IsEmail({}, { message: 'citizen.email deve ser um endereço válido' })
  email?: string;

  @ApiPropertyOptional({ example: '11999998888' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9()+\s-]{8,20}$/, { message: 'citizen.phone deve conter apenas números e separadores' })
  phone?: string;
}

export class CreateReportDto {
  @ApiProperty({ enum: ReportCategory })
  @IsEnum(ReportCategory, {
    message: 'category deve ser COMPLAINT, SUGGESTION, REQUEST ou RISK_ALERT',
  })
  category!: ReportCategory;

  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType, { message: 'type não é um tipo de ocorrência válido' })
  type!: ReportType;

  @ApiProperty({ example: 'Árvore de grande porte inclinada sobre a calçada após a chuva.' })
  @IsString()
  @IsNotEmpty({ message: 'description não pode ser vazio' })
  @MinLength(10, { message: 'description deve ter ao menos 10 caracteres' })
  @MaxLength(5000)
  description!: string;

  @ApiProperty({ example: 'Rua das Palmeiras, 120' })
  @IsString()
  @IsNotEmpty({ message: 'address não pode ser vazio' })
  @MaxLength(255)
  address!: string;

  @ApiProperty({ example: 'Centro' })
  @IsString()
  @IsNotEmpty({ message: 'district não pode ser vazio' })
  @MaxLength(120)
  district!: string;

  @ApiPropertyOptional({ example: -23.5505, description: 'Opcional — o endereço é o dado obrigatório' })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude({ message: 'latitude deve estar entre -90 e 90' })
  latitude?: number;

  @ApiPropertyOptional({ example: -46.6333 })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude({ message: 'longitude deve estar entre -180 e 180' })
  longitude?: number;

  @ApiPropertyOptional({ type: CreateCitizenDto, description: 'Ausente: registro anônimo' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateCitizenDto)
  citizen?: CreateCitizenDto;
}
