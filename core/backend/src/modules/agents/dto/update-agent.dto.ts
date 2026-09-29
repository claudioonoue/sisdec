import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AgentRole } from '../../../generated/prisma/enums.js';

export class UpdateAgentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'name não pode ser vazio' })
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'email deve ser um endereço válido' })
  email?: string;

  @ApiPropertyOptional({ description: 'Redefinição da senha pelo administrador' })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'password deve ter ao menos 8 caracteres' })
  @MaxLength(72, { message: 'password deve ter no máximo 72 caracteres' })
  password?: string;

  @ApiPropertyOptional({ enum: AgentRole })
  @IsOptional()
  @IsEnum(AgentRole, { message: 'role deve ser ADMIN, COORDINATOR ou AGENT' })
  role?: AgentRole;
}
