import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentAgent } from '../../common/decorators/current-agent.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { AgentRole } from '../../generated/prisma/enums.js';
import type { AuthenticatedAgent } from '../auth/authenticated-agent.js';
import { AgentsService } from './agents.service.js';
import { AgentResponseDto } from './dto/agent-response.dto.js';
import { CreateAgentDto } from './dto/create-agent.dto.js';
import { UpdateAgentDto } from './dto/update-agent.dto.js';

@ApiTags('agents')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Perfil sem permissão para a operação' })
@Roles(AgentRole.ADMIN)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os agentes, com perfil e situação de ativação' })
  @ApiOkResponse({ type: [AgentResponseDto] })
  findAll(@Query() query: PaginationQueryDto) {
    return this.agents.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra um agente' })
  @ApiCreatedResponse({ type: AgentResponseDto })
  @ApiConflictResponse({ description: 'E-mail já cadastrado' })
  create(@Body() dto: CreateAgentDto): Promise<AgentResponseDto> {
    return this.agents.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Altera os dados e o perfil de um agente' })
  @ApiOkResponse({ type: AgentResponseDto })
  @ApiNotFoundResponse({ description: 'Agente não encontrado' })
  @ApiConflictResponse({ description: 'E-mail já cadastrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgentDto,
  ): Promise<AgentResponseDto> {
    return this.agents.update(id, dto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Desativa um agente',
    description: 'O registro é preservado para manter o histórico de andamentos íntegro.',
  })
  @ApiOkResponse({ type: AgentResponseDto })
  @ApiNotFoundResponse({ description: 'Agente não encontrado' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAgent() requesting: AuthenticatedAgent,
  ): Promise<AgentResponseDto> {
    return this.agents.deactivate(id, requesting.id);
  }
}
