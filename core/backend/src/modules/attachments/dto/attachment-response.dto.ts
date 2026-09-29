import { ApiProperty } from '@nestjs/swagger';

/**
 * Resposta do envio de anexos. A URL é sempre servida pela própria API — os
 * frontends nunca acessam disco nem bucket, o que mantém a troca de
 * armazenamento invisível para eles (RF-API-21).
 */
export class AttachmentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'arvore.jpg', description: 'Nome informado no envio' })
  fileName!: string;
  @ApiProperty({ example: '/api/v1/attachments/9a1b...' }) url!: string;
}
