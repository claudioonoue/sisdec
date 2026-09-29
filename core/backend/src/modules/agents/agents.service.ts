import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { type PaginatedDto, paginated } from '../../common/dto/pagination.dto.js';
import { hashPassword } from '../../common/password.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AGENT_PUBLIC_SELECT, type AgentResponseDto } from './dto/agent-response.dto.js';
import type { CreateAgentDto } from './dto/create-agent.dto.js';
import type { UpdateAgentDto } from './dto/update-agent.dto.js';

/** Código do Postgres para violação de restrição de unicidade. */
const UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedDto<AgentResponseDto>> {
    const [data, total] = await Promise.all([
      this.prisma.agent.findMany({
        select: AGENT_PUBLIC_SELECT,
        orderBy: { name: 'asc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.agent.count(),
    ]);

    return paginated(data, total, query);
  }

  async create(dto: CreateAgentDto): Promise<AgentResponseDto> {
    try {
      return await this.prisma.agent.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          passwordHash: await hashPassword(dto.password),
          role: dto.role,
        },
        select: AGENT_PUBLIC_SELECT,
      });
    } catch (error) {
      throw this.traduzirConflito(error, dto.email);
    }
  }

  async update(id: string, dto: UpdateAgentDto): Promise<AgentResponseDto> {
    await this.garantirQueExiste(id);

    try {
      return await this.prisma.agent.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.email !== undefined && { email: dto.email.toLowerCase() }),
          ...(dto.role !== undefined && { role: dto.role }),
          ...(dto.password !== undefined && { passwordHash: await hashPassword(dto.password) }),
        },
        select: AGENT_PUBLIC_SELECT,
      });
    } catch (error) {
      throw this.traduzirConflito(error, dto.email ?? '');
    }
  }

  /**
   * Desativa o agente. Nunca exclui: o histórico de andamentos referencia o autor
   * e precisa continuar íntegro (RF-API-49).
   */
  async deactivate(id: string, requestingAgentId: string): Promise<AgentResponseDto> {
    if (id === requestingAgentId) {
      // Um administrador que se desativasse perderia o acesso à própria tela de
      // agentes — e, sendo o único admin, ninguém poderia reverter (RF-OP-54).
      throw new ForbiddenException('Um administrador não pode desativar a sua própria conta');
    }

    await this.garantirQueExiste(id);

    return this.prisma.agent.update({
      where: { id },
      data: { active: false },
      select: AGENT_PUBLIC_SELECT,
    });
  }

  private async garantirQueExiste(id: string): Promise<void> {
    const encontrado = await this.prisma.agent.findUnique({ where: { id }, select: { id: true } });

    if (!encontrado) {
      throw new NotFoundException('Agente não encontrado');
    }
  }

  private traduzirConflito(error: unknown, email: string): unknown {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      if ((error as { code: unknown }).code === UNIQUE_VIOLATION) {
        return new ConflictException(`Já existe um agente cadastrado com o e-mail ${email}`);
      }
    }

    return error;
  }
}
