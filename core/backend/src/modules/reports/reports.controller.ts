import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
  findAll(@Query() query: ListReportsQueryDto) {
    return this.management.findAll(query);
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
  findAssignableAgents() {
    return this.management.findAssignableAgents();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhe completo, com anexos, histórico e dados do cidadão' })
  @ApiNotFoundResponse({ description: 'Ocorrência não encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.management.findOne(id);
  }

  @Patch(':id/triage/start')
  @ApiBearerAuth()
  @Roles(AgentRole.COORDINATOR, AgentRole.ADMIN)
  @ApiOperation({ summary: 'Assume a triagem: RECEIVED para TRIAGE' })
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
  @ApiNotFoundResponse({ description: 'Ocorrência não encontrada' })
  addUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReportUpdateDto,
    @CurrentAgent() agent: AuthenticatedAgent,
  ) {
    return this.management.addUpdate(id, dto, agent);
  }
}
