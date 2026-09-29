import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ReportStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { attachmentUrl } from '../attachments/attachment-url.js';
import type { CreateReportDto } from './dto/create-report.dto.js';
import type {
  PublicReportDto,
  ReportCreatedDto,
} from './dto/report-response.dto.js';
import {
  formatProtocolNumber,
  normalizeProtocolNumber,
  protocolPrefixForYear,
  sequenceOf,
} from './protocol-number.js';

/** Código do Prisma para violação de restrição de unicidade. */
const UNIQUE_VIOLATION = 'P2002';

/**
 * Tentativas de geração do protocolo antes de desistir.
 *
 * Com o *advisory lock* abaixo, a colisão deixa de ser esperada: estas tentativas
 * são rede de segurança para o caso de um protocolo ter entrado por fora da
 * aplicação (uma carga manual, por exemplo).
 */
const MAX_PROTOCOL_ATTEMPTS = 3;

/**
 * Espaço de nomes do *advisory lock* do PostgreSQL usado na geração do protocolo.
 * Qualquer inteiro serve, desde que não seja reaproveitado por outra finalidade.
 */
const PROTOCOL_LOCK_NAMESPACE = 4206;

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra a ocorrência e, quando informado, o cidadão — em uma **única
   * transação**, para que uma falha não deixe um cidadão órfão no banco
   * (RNF-API-20).
   *
   * O protocolo precisa ser uma sequência anual sem repetição, e ler a última
   * sequência para depois inserir é uma corrida: sob concorrência, N requisições
   * disputam o mesmo número e a disputa se resolve em até N rodadas — mais do que
   * qualquer limite razoável de tentativas.
   *
   * Por isso a geração é serializada por um *advisory lock* do PostgreSQL, preso
   * ao ano e liberado no commit da transação. A restrição `UNIQUE` da coluna
   * continua sendo a garantia final, e as tentativas cobrem o caso de um
   * protocolo ter entrado por fora da aplicação (RNF-API-19).
   */
  async create(dto: CreateReportDto): Promise<ReportCreatedDto> {
    const year = new Date().getUTCFullYear();

    for (let attempt = 1; attempt <= MAX_PROTOCOL_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          // Serializa a geração do número: quem chega depois espera o commit de
          // quem chegou antes, e já lê a sequência atualizada.
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(${PROTOCOL_LOCK_NAMESPACE}, ${year})`;

          const protocolNumber = formatProtocolNumber(
            year,
            (await this.lastSequenceOfYear(tx, year)) + 1,
          );

          const report = await tx.report.create({
            data: {
              protocolNumber,
              category: dto.category,
              type: dto.type,
              // Situação inicial de todo registro; a prioridade só é definida na
              // triagem, e por isso fica nula aqui (RF-API-06).
              status: ReportStatus.RECEIVED,
              description: dto.description,
              address: dto.address,
              district: dto.district,
              latitude: dto.latitude,
              longitude: dto.longitude,
              ...(dto.citizen && {
                citizen: {
                  create: {
                    name: dto.citizen.name,
                    email: dto.citizen.email,
                    phone: dto.citizen.phone,
                  },
                },
              }),
            },
            select: { id: true, protocolNumber: true, status: true, createdAt: true },
          });

          return report;
        });
      } catch (error) {
        if (!this.isProtocolCollision(error) || attempt === MAX_PROTOCOL_ATTEMPTS) {
          throw error;
        }

        this.logger.warn(
          `Colisão de protocolo na tentativa ${attempt} — gerando o número seguinte`,
        );
      }
    }

    // Inalcançável: o laço acima devolve ou lança.
    throw new Error('Não foi possível gerar o número de protocolo');
  }

  /**
   * Consulta pública. Devolve apenas o que não identifica quem registrou
   * (RF-API-14) e apenas os andamentos marcados como visíveis (RF-API-15).
   */
  async findByProtocolNumber(protocolNumber: string): Promise<PublicReportDto> {
    const report = await this.prisma.report.findUnique({
      where: { protocolNumber: normalizeProtocolNumber(protocolNumber) },
      select: {
        protocolNumber: true,
        category: true,
        type: true,
        status: true,
        district: true,
        createdAt: true,
        resolvedAt: true,
        updates: {
          where: { visibleToCitizen: true },
          orderBy: { createdAt: 'asc' },
          // Sem `agentId` nem `agent`: o cidadão não vê quem atendeu.
          select: { toStatus: true, comment: true, createdAt: true },
        },
        attachments: { orderBy: { createdAt: 'asc' }, select: { id: true } },
      },
    });

    if (!report) {
      throw new NotFoundException('Nenhuma ocorrência encontrada para este número de protocolo');
    }

    return {
      ...report,
      // A leitura é sempre servida pela API — nunca o disco nem um bucket.
      attachments: report.attachments.map(({ id }) => ({ id, url: attachmentUrl(id) })),
    };
  }

  /**
   * Maior sequência já usada no ano. Usa o próprio `protocolNumber` em vez de
   * contar registros: contagem daria número repetido se algum dia houvesse uma
   * exclusão, e o histórico precisa ser estável.
   */
  private async lastSequenceOfYear(
    tx: Pick<PrismaService, 'report'>,
    year: number,
  ): Promise<number> {
    const ultimo = await tx.report.findFirst({
      where: { protocolNumber: { startsWith: protocolPrefixForYear(year) } },
      orderBy: { protocolNumber: 'desc' },
      select: { protocolNumber: true },
    });

    return ultimo ? sequenceOf(ultimo.protocolNumber) : 0;
  }

  private isProtocolCollision(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
      return false;
    }

    if ((error as { code: unknown }).code !== UNIQUE_VIOLATION) {
      return false;
    }

    const target = (error as { meta?: { target?: unknown } }).meta?.target;
    const campos = Array.isArray(target) ? target.join(',') : String(target ?? '');

    return campos.includes('protocolNumber');
  }
}
