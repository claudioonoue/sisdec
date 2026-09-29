import { ApiProperty } from '@nestjs/swagger';
import type { AgentRole } from '../../../generated/prisma/enums.js';

/**
 * Campos de `Agent` que a API pode devolver.
 *
 * Usado como `select` do Prisma, e não apenas como tipo de retorno: assim o
 * `passwordHash` não é sequer lido do banco, em vez de ser lido e depois
 * removido na serialização — o que deixaria uma janela para vazá-lo por log ou
 * por um retorno esquecido (RNF-API-08).
 */
export const AGENT_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class AgentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ enum: ['ADMIN', 'COORDINATOR', 'AGENT'] }) role!: AgentRole;
  @ApiProperty({ description: 'Agentes são desativados, nunca excluídos' }) active!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
