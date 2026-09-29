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
import type { MapReportsQueryDto, MapResponseDto } from './dto/map-reports.dto.js';
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

/**
 * Teto de pontos devolvidos pelo mapa. A rota não é paginada, então precisa de um
 * limite próprio: sem ele, um recorte amplo carregaria a base inteira.
 */
export const MAP_LIMIT = 500;

/** Situações em que a ocorrência ainda está aberta — o padrão do mapa. */
const OPEN_STATUSES = [ReportStatus.RECEIVED, ReportStatus.TRIAGE, ReportStatus.IN_PROGRESS];

/** Cabeçalho do CSV de exportação, em pt-BR. */
const CSV_HEADER = [
  'Protocolo',
  'Categoria',
  'Tipo',
  'Situacao',
  'Prioridade',
  'Bairro',
  'Endereco',
  'Responsavel',
  'Registrada em',
  'Resolvida em',
];

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
   * Ocorrências para plotagem, **sem paginação** e em formato enxuto (RF-API-67).
   *
   * Sem filtro de situação, devolve apenas as abertas — é o que o mapa do Portal
   * de Operações mostra por padrão.
   */
  async findForMap(query: MapReportsQueryDto): Promise<MapResponseDto> {
    const where = {
      ...this.buildWhere(query as ListReportsQueryDto),
      ...(query.status ? {} : { status: { in: OPEN_STATUSES } }),
    };

    const [comCoordenadas, totalDoRecorte] = await Promise.all([
      this.prisma.report.findMany({
        where: { ...where, latitude: { not: null }, longitude: { not: null } },
        select: {
          id: true,
          protocolNumber: true,
          type: true,
          status: true,
          priority: true,
          latitude: true,
          longitude: true,
        },
        orderBy: { createdAt: 'desc' },
        take: MAP_LIMIT + 1,
      }),
      this.prisma.report.count({ where }),
    ]);

    // Uma linha a mais é buscada só para saber se o teto foi atingido.
    const truncated = comCoordenadas.length > MAP_LIMIT;
    const data = truncated ? comCoordenadas.slice(0, MAP_LIMIT) : comCoordenadas;

    return {
      data: data.map((r) => ({
        ...r,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
      })),
      total: data.length,
      // Quantas do recorte não entram no mapa por não ter ponto — o portal avisa
      // o agente em vez de deixá-las sumirem em silêncio (RF-OP-45).
      omittedWithoutCoordinates: Math.max(totalDoRecorte - comCoordenadas.length, 0),
      truncated,
    };
  }

  /**
   * Linhas do CSV de exportação, produzidas **em lotes** (RF-API-70).
   *
   * É um gerador para que o controlador escreva a resposta conforme os lotes
   * chegam: o arquivo inteiro nunca fica em memória (RNF-API-06).
   */
  async *streamCsv(query: ListReportsQueryDto): AsyncGenerator<string> {
    yield `${CSV_HEADER.join(';')}\n`;

    const where = this.buildWhere(query);
    const LOTE = 200;
    let cursor: string | undefined;

    for (;;) {
      const lote = await this.prisma.report.findMany({
        where,
        select: {
          id: true,
          protocolNumber: true,
          category: true,
          type: true,
          status: true,
          priority: true,
          district: true,
          address: true,
          createdAt: true,
          resolvedAt: true,
          assignedTo: { select: { name: true } },
        },
        orderBy: { id: 'asc' },
        take: LOTE,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      if (lote.length === 0) {
        return;
      }

      for (const r of lote) {
        yield `${[
          r.protocolNumber,
          r.category,
          r.type,
          r.status,
          r.priority ?? '',
          r.district,
          r.address,
          r.assignedTo?.name ?? '',
          r.createdAt.toISOString(),
          r.resolvedAt?.toISOString() ?? '',
        ]
          .map(csvField)
          .join(';')}\n`;
      }

      cursor = lote[lote.length - 1].id;
    }
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

/**
 * Escapa um campo para CSV. O separador é `;`, que o Excel em pt-BR reconhece
 * sem pedir configuração.
 */
function csvField(value: string): string {
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
