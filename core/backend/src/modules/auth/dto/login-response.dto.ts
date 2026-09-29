import { ApiProperty } from '@nestjs/swagger';
import type { AgentRole } from '../../../generated/prisma/enums.js';

export class AuthenticatedAgentDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ enum: ['ADMIN', 'COORDINATOR', 'AGENT'] }) role!: AgentRole;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Token JWT a enviar em Authorization: Bearer <token>' })
  accessToken!: string;

  @ApiProperty({ type: AuthenticatedAgentDto })
  agent!: AuthenticatedAgentDto;
}
