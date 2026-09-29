import { Injectable } from '@nestjs/common';
import { ReportStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CountByKeyDto,
  DashboardPeriodDto,
  DashboardSummaryDto,
} from './dto/dashboard.dto.js';

/** Situações em que a ocorrência ainda está em curso. */
const OPEN_STATUSES = [ReportStatus.RECEIVED, ReportStatus.TRIAGE, ReportStatus.IN_PROGRESS];

/**
 * Indicadores consolidados.
 *
 * Todos calculados por **agregação no banco** (`groupBy`, `count`): carregar as
 * ocorrências para contar na aplicação degradaria o painel à medida que a base
 * crescesse, e é justamente a tela mais acessada pelos agentes (RNF-API-05).
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(period: DashboardPeriodDto): Promise<DashboardSummaryDto> {
    const where = periodFilter(period);

    const [porSituacao, porPrioridade, porTipo, total, abertas] = await Promise.all([
      this.prisma.report.groupBy({ by: ['status'], where, _count: { _all: true } }),
      this.prisma.report.groupBy({ by: ['priority'], where, _count: { _all: true } }),
      this.prisma.report.groupBy({ by: ['type'], where, _count: { _all: true } }),
      this.prisma.report.count({ where }),
      this.prisma.report.count({ where: { ...where, status: { in: OPEN_STATUSES } } }),
    ]);

    return {
      open: abertas,
      total,
      byStatus: toCounts(porSituacao, 'status'),
      // A prioridade é nula antes da triagem; essas entram como "SEM_PRIORIDADE"
      // em vez de sumirem do total.
      byPriority: toCounts(porPrioridade, 'priority', 'SEM_PRIORIDADE'),
      byType: toCounts(porTipo, 'type'),
    };
  }

  async byDistrict(period: DashboardPeriodDto): Promise<CountByKeyDto[]> {
    const agrupado = await this.prisma.report.groupBy({
      by: ['district'],
      where: periodFilter(period),
      _count: { _all: true },
      orderBy: { _count: { district: 'desc' } },
    });

    return toCounts(agrupado, 'district');
  }

  /**
   * Volume por dia. A agregação por data é feita em SQL: o Prisma não agrupa por
   * uma expressão derivada de coluna, e trazer as linhas para agrupar em memória
   * seria exatamente o que RNF-API-05 proíbe.
   */
  async timeline(period: DashboardPeriodDto): Promise<CountByKeyDto[]> {
    const from = period.from ? new Date(period.from) : null;
    const to = period.to ? new Date(period.to) : null;

    const linhas = await this.prisma.$queryRaw<Array<{ dia: Date; total: bigint }>>`
      SELECT date_trunc('day', "createdAt") AS dia, count(*) AS total
      FROM "Report"
      WHERE (${from}::timestamptz IS NULL OR "createdAt" >= ${from}::timestamptz)
        AND (${to}::timestamptz IS NULL OR "createdAt" <= ${to}::timestamptz)
      GROUP BY dia
      ORDER BY dia ASC
    `;

    return linhas.map(({ dia, total }) => ({
      key: dia.toISOString().slice(0, 10),
      total: Number(total),
    }));
  }
}

function periodFilter({ from, to }: DashboardPeriodDto) {
  if (!from && !to) {
    return {};
  }

  return {
    createdAt: {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    },
  };
}

function toCounts(
  rows: Array<Record<string, unknown> & { _count: { _all: number } }>,
  field: string,
  fallback = 'DESCONHECIDO',
): CountByKeyDto[] {
  return rows
    .map((row) => ({ key: (row[field] as string | null) ?? fallback, total: row._count._all }))
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key));
}
