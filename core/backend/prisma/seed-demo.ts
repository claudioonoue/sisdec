import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../src/common/password.ts';
import {
  AgentRole,
  Priority,
  ReportCategory,
  ReportStatus,
  ReportType,
} from '../src/generated/prisma/enums.ts';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import {
  formatProtocolNumber,
  protocolPrefixForYear,
  sequenceOf,
} from '../src/modules/reports/protocol-number.ts';

/**
 * Dados de **demonstração** para o trabalho de desenvolvimento.
 *
 * Separado de `seed.ts` de propósito: aquele cria o agente do primeiro acesso,
 * que é dado de produção (RF-API-51); este cria contas e ocorrências que existem
 * só para exercitar as telas dos portais, e nunca deve rodar em produção — por
 * isso não está registrado em `prisma7.config.ts` e não é executado por
 * `prisma db seed`.
 *
 *     npm run seed:demo
 *
 * As etapas O2 a O6 precisam dele: com o banco vazio, lista, filtros, painel e
 * mapa não têm o que mostrar, e três requisitos só podem ser exercitados com
 * mais de uma conta — `RF-OP-52` (rota de agentes oculta ao coordenador),
 * `RF-OP-64` (agente que **não** é o responsável) e `RF-OP-53` (agente inativo
 * distinguido na lista).
 *
 * **Não apaga nada.** As contas são criadas ou atualizadas pelo e-mail; as
 * ocorrências só entram quando o banco ainda não tem nenhuma, para não misturar
 * dado de demonstração com o que já estiver lá. `SEED_DEMO_FORCE=1` insere assim
 * mesmo. Nenhum `ReportUpdate` é alterado ou removido, aqui como na API.
 */

const PASSWORD = process.env.SEED_DEMO_PASSWORD ?? 'sisdec-demo';

interface DemoAgent {
  key: string;
  name: string;
  email: string;
  role: AgentRole;
  active: boolean;
}

const AGENTS: readonly DemoAgent[] = [
  {
    key: 'coordinator',
    name: 'Helena Prado',
    email: 'coordenadora@sisdec.local',
    role: AgentRole.COORDINATOR,
    active: true,
  },
  {
    key: 'ana',
    name: 'Ana Souza',
    email: 'agente.ana@sisdec.local',
    role: AgentRole.AGENT,
    active: true,
  },
  {
    // Segunda conta de agente: é ela que permite ver o RF-OP-64 funcionando,
    // abrindo uma ocorrência atribuída à Ana.
    key: 'bruno',
    name: 'Bruno Martins',
    email: 'agente.bruno@sisdec.local',
    role: AgentRole.AGENT,
    active: true,
  },
  {
    // Inativa: precisa aparecer riscada em /agentes (RF-OP-53) e ficar fora de
    // GET /reports/assignable-agents.
    key: 'inactive',
    name: 'Carla Nunes',
    email: 'agente.inativo@sisdec.local',
    role: AgentRole.AGENT,
    active: false,
  },
];

interface DemoUpdate {
  /** Horas decorridas desde o registro da ocorrência. */
  hoursAfter: number;
  agent: string;
  fromStatus?: ReportStatus;
  toStatus?: ReportStatus;
  comment?: string;
  visibleToCitizen: boolean;
}

interface DemoReport {
  category: ReportCategory;
  type: ReportType;
  description: string;
  address: string;
  district: string;
  /** Ausentes de propósito em algumas: alimentam `omittedWithoutCoordinates`. */
  latitude?: number;
  longitude?: number;
  /** Ausente quando o registro é anônimo. */
  citizen?: { name: string; email?: string; phone?: string };
  /** Dias decorridos até hoje — espalha o volume na linha do tempo do painel. */
  daysAgo: number;
  status: ReportStatus;
  priority?: Priority;
  assignedTo?: string;
  /** Horas decorridas até a conclusão, nas ocorrências resolvidas. */
  resolvedAfterHours?: number;
  updates: readonly DemoUpdate[];
}

/**
 * Catálogo de demonstração: 14 ocorrências cobrindo as seis situações, as quatro
 * prioridades, bairros e tipos variados, com e sem coordenadas, identificadas e
 * anônimas.
 */
const REPORTS: readonly DemoReport[] = [
  {
    category: ReportCategory.RISK_ALERT,
    type: ReportType.FLOODING,
    description:
      'A água subiu até a metade da calçada depois da chuva da madrugada e ainda não escoou.',
    address: 'Rua das Palmeiras, 120',
    district: 'Centro',
    latitude: -23.5505,
    longitude: -46.6333,
    citizen: { name: 'Maria Silva', email: 'maria.silva@exemplo.invalid', phone: '11999990001' },
    daysAgo: 1,
    status: ReportStatus.RECEIVED,
    updates: [],
  },
  {
    category: ReportCategory.RISK_ALERT,
    type: ReportType.DANGEROUS_TREE,
    description:
      'Árvore de grande porte inclinada sobre a fiação, com raízes expostas na calçada.',
    address: 'Avenida Brasil, 875',
    district: 'Vila Nova',
    latitude: -23.5612,
    longitude: -46.6418,
    daysAgo: 2,
    status: ReportStatus.RECEIVED,
    updates: [],
  },
  {
    category: ReportCategory.COMPLAINT,
    type: ReportType.BLOCKED_DRAINAGE,
    description: 'Bueiro entupido há semanas; a água empoça e o cheiro é forte.',
    address: 'Rua São Bento, 44',
    district: 'São Bento',
    citizen: { name: 'João Pereira', phone: '11999990002' },
    daysAgo: 3,
    status: ReportStatus.RECEIVED,
    updates: [],
  },
  {
    category: ReportCategory.SUGGESTION,
    type: ReportType.OTHER,
    description:
      'Sugestão de instalar placas de alerta na descida da rua, onde já houve dois acidentes.',
    address: 'Rua do Mirante, 300',
    district: 'Centro',
    daysAgo: 10,
    status: ReportStatus.RECEIVED,
    updates: [],
  },
  {
    category: ReportCategory.RISK_ALERT,
    type: ReportType.LANDSLIDE,
    description:
      'Barranco atrás das casas cedeu cerca de um metro; há trincas no muro dos fundos.',
    address: 'Travessa do Morro, 18',
    district: 'Morro Alto',
    latitude: -23.5701,
    longitude: -46.6205,
    citizen: { name: 'Rita Alves', email: 'rita.alves@exemplo.invalid', phone: '11999990003' },
    daysAgo: 4,
    status: ReportStatus.TRIAGE,
    updates: [
      {
        hoursAfter: 3,
        agent: 'coordinator',
        fromStatus: ReportStatus.RECEIVED,
        toStatus: ReportStatus.TRIAGE,
        visibleToCitizen: false,
      },
    ],
  },
  {
    category: ReportCategory.RISK_ALERT,
    type: ReportType.FALLEN_POLE,
    description: 'Poste tombado após o vendaval, com fios soltos sobre o passeio.',
    address: 'Rua das Acácias, 91',
    district: 'Riacho Fundo',
    latitude: -23.5488,
    longitude: -46.6501,
    daysAgo: 5,
    status: ReportStatus.TRIAGE,
    updates: [
      {
        hoursAfter: 5,
        agent: 'coordinator',
        fromStatus: ReportStatus.RECEIVED,
        toStatus: ReportStatus.TRIAGE,
        visibleToCitizen: false,
      },
    ],
  },
  {
    category: ReportCategory.RISK_ALERT,
    type: ReportType.VEGETATION_FIRE,
    description: 'Queimada em terreno baldio avançando na direção das casas.',
    address: 'Estrada do Campo, km 3',
    district: 'Jardim das Acácias',
    latitude: -23.5399,
    longitude: -46.6289,
    citizen: { name: 'Paulo Dias', email: 'paulo.dias@exemplo.invalid' },
    daysAgo: 8,
    status: ReportStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    assignedTo: 'ana',
    updates: [
      {
        hoursAfter: 2,
        agent: 'coordinator',
        fromStatus: ReportStatus.RECEIVED,
        toStatus: ReportStatus.TRIAGE,
        visibleToCitizen: false,
      },
      {
        hoursAfter: 4,
        agent: 'coordinator',
        fromStatus: ReportStatus.TRIAGE,
        toStatus: ReportStatus.IN_PROGRESS,
        comment: 'Risco confirmado pelas fotos. Encaminhado para vistoria em campo.',
        visibleToCitizen: true,
      },
      {
        hoursAfter: 6,
        agent: 'coordinator',
        comment: 'Responsável definido: Ana Souza.',
        visibleToCitizen: false,
      },
      {
        hoursAfter: 30,
        agent: 'ana',
        comment: 'Equipe no local. Aceiro aberto; acompanhamento mantido nas próximas 48 h.',
        visibleToCitizen: true,
      },
    ],
  },
  {
    category: ReportCategory.RISK_ALERT,
    type: ReportType.DAMAGED_STRUCTURE,
    description:
      'Muro de arrimo com rachadura larga e deslocamento visível; passagem de pedestres embaixo.',
    address: 'Rua XV de Novembro, 210',
    district: 'Centro',
    latitude: -23.5522,
    longitude: -46.6357,
    citizen: { name: 'Sônia Ramos', phone: '11999990004' },
    daysAgo: 12,
    status: ReportStatus.IN_PROGRESS,
    priority: Priority.CRITICAL,
    assignedTo: 'bruno',
    updates: [
      {
        hoursAfter: 1,
        agent: 'coordinator',
        fromStatus: ReportStatus.RECEIVED,
        toStatus: ReportStatus.TRIAGE,
        visibleToCitizen: false,
      },
      {
        hoursAfter: 2,
        agent: 'coordinator',
        fromStatus: ReportStatus.TRIAGE,
        toStatus: ReportStatus.IN_PROGRESS,
        comment: 'Interdição preventiva do passeio solicitada à zeladoria.',
        visibleToCitizen: true,
      },
      {
        hoursAfter: 3,
        agent: 'coordinator',
        comment: 'Responsável definido: Bruno Martins.',
        visibleToCitizen: false,
      },
    ],
  },
  {
    category: ReportCategory.RISK_ALERT,
    type: ReportType.EROSION,
    description: 'Margem do córrego solapada, avançando sobre o quintal dos fundos.',
    address: 'Rua do Riacho, 402',
    district: 'Riacho Fundo',
    daysAgo: 15,
    status: ReportStatus.IN_PROGRESS,
    priority: Priority.MEDIUM,
    assignedTo: 'ana',
    updates: [
      {
        hoursAfter: 6,
        agent: 'coordinator',
        fromStatus: ReportStatus.RECEIVED,
        toStatus: ReportStatus.TRIAGE,
        visibleToCitizen: false,
      },
      {
        hoursAfter: 9,
        agent: 'coordinator',
        fromStatus: ReportStatus.TRIAGE,
        toStatus: ReportStatus.IN_PROGRESS,
        comment: 'Encaminhado para levantamento topográfico.',
        visibleToCitizen: true,
      },
    ],
  },
  {
    category: ReportCategory.REQUEST,
    type: ReportType.WILD_ANIMAL,
    description: 'Serpente avistada no pátio da escola, próxima ao muro dos fundos.',
    address: 'Rua Doutor Campos, 55',
    district: 'Vila Nova',
    latitude: -23.5634,
    longitude: -46.6449,
    citizen: { name: 'Direção da Escola Municipal', email: 'escola@exemplo.invalid' },
    daysAgo: 6,
    status: ReportStatus.IN_PROGRESS,
    priority: Priority.LOW,
    assignedTo: 'bruno',
    updates: [
      {
        hoursAfter: 2,
        agent: 'coordinator',
        fromStatus: ReportStatus.RECEIVED,
        toStatus: ReportStatus.TRIAGE,
        visibleToCitizen: false,
      },
      {
        hoursAfter: 3,
        agent: 'coordinator',
        fromStatus: ReportStatus.TRIAGE,
        toStatus: ReportStatus.IN_PROGRESS,
        visibleToCitizen: false,
      },
    ],
  },
  {
    category: ReportCategory.RISK_ALERT,
    type: ReportType.STORM_DAMAGE,
    description: 'Telhado do galpão comunitário destelhado pelo vendaval.',
    address: 'Praça São Bento, s/n',
    district: 'São Bento',
    latitude: -23.5567,
    longitude: -46.6612,
    citizen: { name: 'Associação de Moradores', email: 'amsb@exemplo.invalid' },
    daysAgo: 25,
    status: ReportStatus.RESOLVED,
    priority: Priority.MEDIUM,
    assignedTo: 'ana',
    resolvedAfterHours: 120,
    updates: [
      {
        hoursAfter: 4,
        agent: 'coordinator',
        fromStatus: ReportStatus.RECEIVED,
        toStatus: ReportStatus.TRIAGE,
        visibleToCitizen: false,
      },
      {
        hoursAfter: 6,
        agent: 'coordinator',
        fromStatus: ReportStatus.TRIAGE,
        toStatus: ReportStatus.IN_PROGRESS,
        visibleToCitizen: false,
      },
      {
        hoursAfter: 120,
        agent: 'ana',
        fromStatus: ReportStatus.IN_PROGRESS,
        toStatus: ReportStatus.RESOLVED,
        comment: 'Cobertura provisória instalada e área liberada para uso.',
        visibleToCitizen: true,
      },
    ],
  },
  {
    category: ReportCategory.RISK_ALERT,
    type: ReportType.FLOODING,
    description: 'Alagamento recorrente no cruzamento após chuvas fortes.',
    address: 'Rua Marechal Deodoro com Avenida Central',
    district: 'Centro',
    latitude: -23.5541,
    longitude: -46.6372,
    daysAgo: 34,
    status: ReportStatus.RESOLVED,
    priority: Priority.HIGH,
    assignedTo: 'bruno',
    resolvedAfterHours: 96,
    updates: [
      {
        hoursAfter: 2,
        agent: 'coordinator',
        fromStatus: ReportStatus.RECEIVED,
        toStatus: ReportStatus.TRIAGE,
        visibleToCitizen: false,
      },
      {
        hoursAfter: 5,
        agent: 'coordinator',
        fromStatus: ReportStatus.TRIAGE,
        toStatus: ReportStatus.IN_PROGRESS,
        visibleToCitizen: false,
      },
      {
        hoursAfter: 96,
        agent: 'bruno',
        fromStatus: ReportStatus.IN_PROGRESS,
        toStatus: ReportStatus.RESOLVED,
        comment: 'Galeria desobstruída e boca de lobo recuperada.',
        visibleToCitizen: true,
      },
    ],
  },
  {
    category: ReportCategory.COMPLAINT,
    type: ReportType.OTHER,
    description: 'Obra particular com entulho na calçada, atrapalhando a passagem.',
    address: 'Rua das Acácias, 1200',
    district: 'Jardim das Acácias',
    latitude: -23.5372,
    longitude: -46.6244,
    citizen: { name: 'Clara Nogueira', email: 'clara.nogueira@exemplo.invalid' },
    daysAgo: 18,
    status: ReportStatus.REJECTED,
    updates: [
      {
        hoursAfter: 8,
        agent: 'coordinator',
        fromStatus: ReportStatus.RECEIVED,
        toStatus: ReportStatus.TRIAGE,
        visibleToCitizen: false,
      },
      {
        hoursAfter: 12,
        agent: 'coordinator',
        fromStatus: ReportStatus.TRIAGE,
        toStatus: ReportStatus.REJECTED,
        comment:
          'Não há risco de desastre. Encaminhado à fiscalização de posturas, que é o órgão competente.',
        visibleToCitizen: true,
      },
    ],
  },
  {
    category: ReportCategory.RISK_ALERT,
    type: ReportType.HAZARDOUS_MATERIAL,
    description: 'Cheiro forte de gás em torno do bueiro da esquina.',
    address: 'Rua do Morro, 77',
    district: 'Morro Alto',
    latitude: -23.5688,
    longitude: -46.6171,
    citizen: { name: 'Edson Lima', phone: '11999990005' },
    daysAgo: 40,
    status: ReportStatus.CANCELLED,
    priority: Priority.HIGH,
    assignedTo: 'ana',
    updates: [
      {
        hoursAfter: 1,
        agent: 'coordinator',
        fromStatus: ReportStatus.RECEIVED,
        toStatus: ReportStatus.TRIAGE,
        visibleToCitizen: false,
      },
      {
        hoursAfter: 2,
        agent: 'coordinator',
        fromStatus: ReportStatus.TRIAGE,
        toStatus: ReportStatus.IN_PROGRESS,
        visibleToCitizen: false,
      },
      {
        hoursAfter: 20,
        agent: 'ana',
        fromStatus: ReportStatus.IN_PROGRESS,
        toStatus: ReportStatus.CANCELLED,
        comment:
          'Concessionária atendeu a ocorrência pelo canal próprio e reparou o vazamento. Registro encerrado para não duplicar o atendimento.',
        visibleToCitizen: true,
      },
    ],
  },
];

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL não definida — veja o .env.example');
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const passwordHash = await hashPassword(PASSWORD);
    const agentIds = new Map<string, string>();

    for (const agent of AGENTS) {
      const email = agent.email.toLowerCase();
      // `update` sem `passwordHash`: rodar de novo não sobrescreve uma senha que
      // alguém tenha trocado pela API.
      const saved = await prisma.agent.upsert({
        where: { email },
        update: { name: agent.name, role: agent.role, active: agent.active },
        create: { name: agent.name, email, passwordHash, role: agent.role, active: agent.active },
        select: { id: true },
      });
      agentIds.set(agent.key, saved.id);
    }

    console.log(`Contas de demonstração: ${AGENTS.length} (senha: ${PASSWORD})`);

    const existingReports = await prisma.report.count();
    if (existingReports > 0 && process.env.SEED_DEMO_FORCE !== '1') {
      console.log(
        `\n  O banco já tem ${existingReports} ocorrência(s) — as de demonstração não foram\n` +
          '  inseridas, para não misturar com o que já está lá. Para inserir assim mesmo:\n' +
          '  SEED_DEMO_FORCE=1 npm run seed:demo\n',
      );
      return;
    }

    // A sequência do protocolo reinicia a cada ano, e as ocorrências de
    // demonstração são espalhadas no tempo — perto da virada do ano, parte delas
    // cai no ano anterior. Uma sequência por ano mantém cada protocolo válido.
    const sequences = new Map<number, number>();
    const now = Date.now();

    for (const report of REPORTS) {
      const createdAt = new Date(now - report.daysAgo * DAY);
      const year = createdAt.getFullYear();
      const sequence = sequences.get(year) ?? (await nextSequence(prisma, year));
      const assignedToId = report.assignedTo ? agentIds.get(report.assignedTo) : undefined;

      await prisma.report.create({
        data: {
          protocolNumber: formatProtocolNumber(year, sequence),
          category: report.category,
          type: report.type,
          status: report.status,
          priority: report.priority ?? null,
          description: report.description,
          address: report.address,
          district: report.district,
          latitude: report.latitude ?? null,
          longitude: report.longitude ?? null,
          // `connect` e não o `assignedToId` cru: a presença de escritas
          // aninhadas (`citizen`, `updates`) leva o Prisma ao input que trabalha
          // por relação, onde a chave estrangeira solta não é aceita.
          assignedTo: assignedToId ? { connect: { id: assignedToId } } : undefined,
          createdAt,
          resolvedAt:
            report.resolvedAfterHours === undefined
              ? null
              : new Date(createdAt.getTime() + report.resolvedAfterHours * HOUR),
          citizen: report.citizen
            ? {
                create: {
                  name: report.citizen.name,
                  email: report.citizen.email ?? null,
                  phone: report.citizen.phone ?? null,
                  createdAt,
                },
              }
            : undefined,
          updates: {
            create: report.updates.map((update) => ({
              agentId: requireAgent(agentIds, update.agent),
              fromStatus: update.fromStatus ?? null,
              toStatus: update.toStatus ?? null,
              comment: update.comment ?? null,
              visibleToCitizen: update.visibleToCitizen,
              createdAt: new Date(createdAt.getTime() + update.hoursAfter * HOUR),
            })),
          },
        },
      });

      sequences.set(year, sequence + 1);
    }

    console.log(`Ocorrências de demonstração: ${REPORTS.length}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Continua a sequência do ano a partir do maior protocolo já gravado, como faz a
 * API — assim os registros de demonstração não colidem com os que ela gerar
 * depois, nem deixam um buraco na numeração.
 */
async function nextSequence(prisma: PrismaClient, year: number): Promise<number> {
  const latest = await prisma.report.findFirst({
    where: { protocolNumber: { startsWith: protocolPrefixForYear(year) } },
    orderBy: { protocolNumber: 'desc' },
    select: { protocolNumber: true },
  });
  return latest ? sequenceOf(latest.protocolNumber) + 1 : 1;
}

function requireAgent(ids: Map<string, string>, key: string): string {
  const id = ids.get(key);
  if (!id) throw new Error(`Agente de demonstração desconhecido no catálogo: ${key}`);
  return id;
}

await main();
