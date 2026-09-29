import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { PublicReportDto, ReportCreatedDto } from './dto/report-response.dto.js';
import { ReportsService } from './reports.service.js';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Public()
  @Post()
  // Rota pública de escrita: limite por IP para conter registro em massa
  // (RNF-API-15). O guarda é aplicado aqui, e não globalmente, para não limitar
  // as consultas de trabalho dos agentes.
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Registra uma nova ocorrência e devolve o número de protocolo',
    description:
      'Não exige autenticação. O objeto citizen é opcional: ausente, a ocorrência é anônima.',
  })
  @ApiCreatedResponse({ type: ReportCreatedDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiTooManyRequestsResponse({ description: 'Limite de registros por minuto excedido' })
  create(@Body() dto: CreateReportDto): Promise<ReportCreatedDto> {
    return this.reports.create(dto);
  }

  @Public()
  @Get('protocol/:protocolNumber')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Consulta pública da situação e do histórico visível',
    description:
      'Não devolve nenhum dado capaz de identificar quem registrou, nem a prioridade.',
  })
  @ApiOkResponse({ type: PublicReportDto })
  @ApiNotFoundResponse({ description: 'Protocolo não encontrado' })
  findByProtocol(@Param('protocolNumber') protocolNumber: string): Promise<PublicReportDto> {
    return this.reports.findByProtocolNumber(protocolNumber);
  }
}
