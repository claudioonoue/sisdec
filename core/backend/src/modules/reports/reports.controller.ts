import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentAgent } from '../../common/decorators/current-agent.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AgentRole } from '../../generated/prisma/enums.js';
import type { AuthenticatedAgent } from '../auth/authenticated-agent.js';
import { ListReportsQueryDto } from './dto/list-reports.dto.js';
import { MapReportsQueryDto, MapResponseDto } from './dto/map-reports.dto.js';
import {
  AgentSummaryDto,
  PaginatedReportsDto,
  ReportDetailDto,
  ReportListItemDto,
  ReportUpdateResponseDto,
} from './dto/report-management-response.dto.js';
import {
  AssignReportDto,
  ChangeStatusDto,
  ConcludeTriageDto,
  CreateReportUpdateDto,
} from './dto/manage-report.dto.js';
import { ReportsManagementService } from './reports-management.service.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { PublicReportDto, ReportCreatedDto } from './dto/report-response.dto.js';
import { ReportsService } from './reports.service.js';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly management: ReportsManagementService,
  ) {}

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

  // ----------------------------------------------------------- rotas restritas

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista as ocorrências, com filtros combináveis e paginação' })
  @ApiOkResponse({ type: PaginatedReportsDto })
  findAll(@Query() query: ListReportsQueryDto) {
    return this.management.findAll(query);
  }

  @Get('map')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ocorrências com coordenadas, para plotagem',
    description:
      'Sem paginação e em formato enxuto. Sem filtro de situação, devolve apenas as abertas. ' +
      'Limitada a 500 registros, sinalizando truncated.',
  })
  @ApiOkResponse({ type: MapResponseDto })
  findForMap(@Query() query: MapReportsQueryDto): Promise<MapResponseDto> {
    return this.management.findForMap(query);
  }

  @Get('export')
  @ApiBearerAuth()
  @Roles(AgentRole.COORDINATOR, AgentRole.ADMIN)
  @ApiOperation({
    summary: 'Exporta a lista filtrada em CSV',
    description: 'Mesmos filtros de GET /reports, sem paginação, respondido em fluxo.',
  })
  @ApiOkResponse({ description: 'Arquivo CSV', content: { 'text/csv': {} } })
  async exportCsv(@Query() query: ListReportsQueryDto, @Res() response: Response): Promise<void> {
    response.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ocorrencias-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    });

    // BOM para o Excel reconhecer o UTF-8 e não corromper os acentos.
    response.write('\uFEFF');

    // Escrito lote a lote, conforme o gerador entrega: o CSV inteiro nunca fica
    // em memória (RNF-API-06).
    for await (const linha of this.management.streamCsv(query)) {
      response.write(linha);
    }

    response.end();
  }

  /**
   * Declarada **antes** de `:id`: o Express casa as rotas na ordem de registro, e
   * `assignable-agents` cairia no parâmetro de id, virando um 400 de UUID.
   */
  @Get('assignable-agents')
  @ApiBearerAuth()
  @Roles(AgentRole.COORDINATOR, AgentRole.ADMIN)
  @ApiOperation({
    summary: 'Agentes ativos disponíveis para atribuição',
    description: 'Devolve apenas id e nome — o cadastro completo segue restrito ao administrador.',
  })
  @ApiOkResponse({ type: [AgentSummaryDto] })
  findAssignableAgents() {
    return this.management.findAssignableAgents();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhe completo, com anexos, histórico e dados do cidadão' })
  @ApiOkResponse({ type: ReportDetailDto })
  @ApiNotFoundResponse({ description: 'Ocorrência não encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentAgent() agent: AuthenticatedAgent) {
    // O agente entra na consulta porque `availableTransitions` é resolvido para
    // quem pergunta: a mesma ocorrência oferece ações diferentes ao coordenador
    // e ao agente que não é o seu responsável (RF-API-72).
    return this.management.findOne(id, agent);
  }

  @Patch(':id/triage/start')
  @ApiBearerAuth()
  @Roles(AgentRole.COORDINATOR, AgentRole.ADMIN)
  @ApiOperation({ summary: 'Assume a triagem: RECEIVED para TRIAGE' })
  @ApiOkResponse({ type: ReportListItemDto })
  @ApiBadRequestResponse({ description: 'A ocorrência não está em RECEIVED' })
  startTriage(@Param('id', ParseUUIDPipe) id: string, @CurrentAgent() agent: AuthenticatedAgent) {
    return this.management.startTriage(id, agent);
  }

  @Patch(':id/triage')
  @ApiBearerAuth()
  @Roles(AgentRole.COORDINATOR, AgentRole.ADMIN)
  @ApiOperation({
    summary: 'Conclui a triagem',
    description:
      'outcome ACCEPT encaminha para IN_PROGRESS e exige priority; REJECT encerra como ' +
      'improcedente e exige comment.',
  })
  @ApiOkResponse({ type: ReportListItemDto })
  @ApiBadRequestResponse({ description: 'A ocorrência não está em TRIAGE, ou faltam campos' })
  concludeTriage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConcludeTriageDto,
    @CurrentAgent() agent: AuthenticatedAgent,
  ) {
    return this.management.concludeTriage(id, dto, agent);
  }

  @Patch(':id/assign')
  @ApiBearerAuth()
  @Roles(AgentRole.COORDINATOR, AgentRole.ADMIN)
  @ApiOperation({ summary: 'Define o agente responsável' })
  @ApiOkResponse({ type: ReportListItemDto })
  @ApiBadRequestResponse({ description: 'Agente inativo' })
  @ApiNotFoundResponse({ description: 'Ocorrência ou agente não encontrado' })
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignReportDto,
    @CurrentAgent() agent: AuthenticatedAgent,
  ) {
    return this.management.assign(id, dto, agent);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Conclui ou cancela a ocorrência',
    description: 'Um agente só altera a situação da ocorrência que lhe foi atribuída.',
  })
  @ApiOkResponse({ type: ReportListItemDto })
  @ApiBadRequestResponse({ description: 'Transição inválida ou comentário ausente' })
  @ApiForbiddenResponse({ description: 'Agente não é o responsável pela ocorrência' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentAgent() agent: AuthenticatedAgent,
  ) {
    return this.management.changeStatus(id, dto, agent);
  }

  @Post(':id/updates')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Acrescenta uma observação ao histórico' })
  @ApiCreatedResponse({ type: ReportUpdateResponseDto })
  @ApiNotFoundResponse({ description: 'Ocorrência não encontrada' })
  addUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReportUpdateDto,
    @CurrentAgent() agent: AuthenticatedAgent,
  ) {
    return this.management.addUpdate(id, dto, agent);
  }
}
