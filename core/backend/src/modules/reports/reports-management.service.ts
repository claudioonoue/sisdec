import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type PaginatedDto, paginated } from '../../common/dto/pagination.dto.js';
import { AgentRole, Priority, ReportStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedAgent } from '../auth/authenticated-agent.js';
import { attachmentUrl } from '../attachments/attachment-url.js';
import { isUrgentReportType } from '../metadata/metadata.labels.js';
import type {
  AssignReportDto,
  ChangeStatusDto,
  ConcludeTriageDto,
  CreateReportUpdateDto,
} from './dto/manage-report.dto.js';
import type { ListReportsQueryDto } from './dto/list-reports.dto.js';
import { type TransitionOwner, findTransition, nextStatusesFrom } from './report-transitions.js';

/** Campos da listagem — o suficiente para a tabela do Portal de Operações. */
const LIST_SELECT = {
  id: true,
  protocolNumber: true,
  category: true,
  type: true,
  status: true,
  priority: true,
  district: true,
  createdAt: true,
  assignedTo: { select: { id: true, name: true } },
} as const;

@Injectable()
export class ReportsManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListReportsQueryDto): Promise<PaginatedDto<unknown>> {
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        select: LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.report.count({ where }),
    ]);

    return paginated(data, total, query);
  }

  /** Detalhe completo, com dados do cidadão e histórico integral (RF-API-34). */
  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: {
        ...LIST_SELECT,
        description: true,
        address: true,
        latitude: true,
        longitude: true,
        updatedAt: true,
        resolvedAt: true,
        citizen: { select: { id: true, name: true, email: true, phone: true } },
        attachments: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, fileName: true, mimeType: true, sizeInBytes: true },
        },
        updates: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            comment: true,
            visibleToCitizen: true,
            createdAt: true,
            agent: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Ocorrência não encontrada');
    }

    return {
      ...report,
      attachments: report.attachments.map((a) => ({ ...a, url: attachmentUrl(a.id) })),
      // A triagem sugere prioridade alta nos tipos de risco imediato à vida
      // (RF-API-36); a decisão continua sendo do coordenador.
      suggestedPriority: isUrgentReportType(report.type) ? Priority.HIGH : null,
    };
  }

  /** Agentes ativos disponíveis para atribuição — apenas id e nome (RF-API-61). */
  findAssignableAgents() {
    return this.prisma.agent.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  /** Assume a triagem: `RECEIVED → TRIAGE` (RF-API-60). */
  startTriage(id: string, agent: AuthenticatedAgent) {
    return this.applyStatusChange({
      reportId: id,
      to: ReportStatus.TRIAGE,
      owner: 'triage/start',
      agent,
    });
  }

  /** Conclui a triagem, encaminhando ou declarando improcedente (RF-API-35). */
  async concludeTriage(id: string, dto: ConcludeTriageDto, agent: AuthenticatedAgent) {
    const aceita = dto.outcome === 'ACCEPT';

    if (aceita && !dto.priority) {
      throw new BadRequestException('priority é obrigatória ao encaminhar a ocorrência');
    }

    return this.applyStatusChange({
      reportId: id,
      to: aceita ? ReportStatus.IN_PROGRESS : ReportStatus.REJECTED,
      owner: 'triage',
      agent,
      comment: dto.comment,
      extraData: {
        ...(dto.type && { type: dto.type }),
        ...(aceita && dto.priority && { priority: dto.priority }),
      },
    });
  }

  async assign(id: string, dto: AssignReportDto, agent: AuthenticatedAgent) {
    const report = await this.requireReport(id);

    const responsavel = await this.prisma.agent.findUnique({
      where: { id: dto.assignedToId },
      select: { id: true, name: true, active: true },
    });

    if (!responsavel) {
      throw new NotFoundException('Agente não encontrado');
    }

    if (!responsavel.active) {
      throw new BadRequestException('Não é possível atribuir a ocorrência a um agente inativo');
    }

    // A atribuição não muda a situação, mas fica registrada no histórico para que
    // a troca de responsável seja rastreável (RNF-API-45).
    return this.prisma.$transaction(async (tx) => {
      const atualizada = await tx.report.update({
        where: { id: report.id },
        data: { assignedToId: responsavel.id },
        select: LIST_SELECT,
      });

      await tx.reportUpdate.create({
        data: {
          reportId: report.id,
          agentId: agent.id,
          comment: `Responsável definido: ${responsavel.name}`,
          visibleToCitizen: false,
        },
      });

      return atualizada;
    });
  }

  changeStatus(id: string, dto: ChangeStatusDto, agent: AuthenticatedAgent) {
    return this.applyStatusChange({
      reportId: id,
      to: dto.status,
      owner: 'status',
      agent,
      comment: dto.comment,
    });
  }

  /** Observação avulsa no histórico, sem mudança de situação (RF-API-43). */
  async addUpdate(id: string, dto: CreateReportUpdateDto, agent: AuthenticatedAgent) {
    const report = await this.requireReport(id);

    return this.prisma.reportUpdate.create({
      data: {
        reportId: report.id,
        agentId: agent.id,
        comment: dto.comment,
        visibleToCitizen: dto.visibleToCitizen ?? false,
      },
      select: {
        id: true,
        comment: true,
        visibleToCitizen: true,
        createdAt: true,
        agent: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * **Ponto único** de mudança de situação (RF-API-42).
   *
   * Toda transição passa por aqui: é onde a tabela de transições é conferida, a
   * autorização é aplicada, o `ReportUpdate` é gravado na mesma transação e o
   * `resolvedAt` é preenchido. É também onde um envio de aviso ao cidadão será
   * acrescentado numa versão futura, sem espalhar a lógica pelos controladores.
   */
  private async applyStatusChange(params: {
    reportId: string;
    to: ReportStatus;
    owner: TransitionOwner;
    agent: AuthenticatedAgent;
    comment?: string;
    extraData?: Record<string, unknown>;
  }) {
    const { reportId, to, owner, agent, comment, extraData } = params;
    const report = await this.requireReport(reportId);

    const transition = findTransition(report.status, to, owner);

    if (!transition) {
      const possiveis = nextStatusesFrom(report.status, owner);
      throw new BadRequestException(
        possiveis.length > 0
          ? `Transição inválida: de ${report.status} só é possível ir para ${possiveis.join(' ou ')}`
          : `Não há transição possível a partir de ${report.status} por esta operação`,
      );
    }

    if (!transition.roles.includes(agent.role)) {
      throw new ForbiddenException('Perfil sem permissão para esta transição');
    }

    // O agente comum só mexe no que lhe foi atribuído; coordenador e
    // administrador atuam em qualquer ocorrência (RF-API-68).
    if (agent.role === AgentRole.AGENT && report.assignedToId !== agent.id) {
      throw new ForbiddenException(
        'Um agente só altera a situação da ocorrência que lhe foi atribuída',
      );
    }

    if (transition.requiresComment && !comment?.trim()) {
      throw new BadRequestException(`comment é obrigatório na transição para ${to}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const atualizada = await tx.report.update({
        where: { id: report.id },
        data: {
          status: to,
          ...(to === ReportStatus.RESOLVED && { resolvedAt: new Date() }),
          ...extraData,
        },
        select: LIST_SELECT,
      });

      // Histórico e situação mudam juntos, ou nenhum dos dois (RNF-API-20).
      await tx.reportUpdate.create({
        data: {
          reportId: report.id,
          agentId: agent.id,
          fromStatus: report.status,
          toStatus: to,
          comment: comment?.trim() || null,
          visibleToCitizen: true,
        },
      });

      return atualizada;
    });
  }

  private async requireReport(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: { id: true, status: true, assignedToId: true },
    });

    if (!report) {
      throw new NotFoundException('Ocorrência não encontrada');
    }

    return report;
  }

  private buildWhere(query: ListReportsQueryDto) {
    return {
      ...(query.status && { status: query.status }),
      ...(query.type && { type: query.type }),
      ...(query.category && { category: query.category }),
      ...(query.priority && { priority: query.priority }),
      ...(query.district && { district: { equals: query.district, mode: 'insensitive' as const } }),
      ...(query.assignedToId && { assignedToId: query.assignedToId }),
      ...((query.from || query.to) && {
        createdAt: {
          ...(query.from && { gte: new Date(query.from) }),
          ...(query.to && { lte: new Date(query.to) }),
        },
      }),
      ...(query.search && {
        OR: [
          { protocolNumber: { contains: query.search, mode: 'insensitive' as const } },
          { description: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };
  }
}
