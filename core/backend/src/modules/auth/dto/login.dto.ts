import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ana@exemplo.gov.br' })
  @IsEmail({}, { message: 'email deve ser um endereço válido' })
  email!: string;

  @ApiProperty({ example: 'senha-do-agente' })
  @IsString()
  @IsNotEmpty({ message: 'password não pode ser vazio' })
  password!: string;
}
