import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
import { PrismaService } from '../../prisma/prisma.service.js';

interface HealthBody {
  status: 'ok' | 'error';
  database: 'up' | 'down';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Estado da aplicação e da conexão com o banco de dados' })
  @ApiResponse({ status: 200, description: 'Aplicação e banco disponíveis' })
  @ApiResponse({ status: 503, description: 'Banco de dados inacessível' })
  async check(@Res({ passthrough: true }) response: Response): Promise<HealthBody> {
    const up = await this.prisma.isReachable();

    // 503 em vez de exceção: a indisponibilidade do banco é uma resposta
    // prevista, não um erro interno (RNF-API-24).
    response.status(up ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);

    return { status: up ? 'ok' : 'error', database: up ? 'up' : 'down' };
  }
}
