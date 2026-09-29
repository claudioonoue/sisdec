import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { AgentRole } from '../../../generated/prisma/enums.js';

export class CreateAgentDto {
  @ApiProperty({ example: 'Ana Souza' })
  @IsString()
  @IsNotEmpty({ message: 'name não pode ser vazio' })
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'ana@exemplo.gov.br' })
  @IsEmail({}, { message: 'email deve ser um endereço válido' })
  email!: string;

  @ApiProperty({ minLength: 8, description: 'Senha inicial; armazenada apenas como hash bcrypt' })
  @IsString()
  @MinLength(8, { message: 'password deve ter ao menos 8 caracteres' })
  @MaxLength(72, { message: 'password deve ter no máximo 72 caracteres' })
  password!: string;

  @ApiProperty({ enum: AgentRole })
  @IsEnum(AgentRole, { message: 'role deve ser ADMIN, COORDINATOR ou AGENT' })
  role!: AgentRole;
}
