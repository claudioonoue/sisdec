import { ReportStatus } from '../../generated/prisma/enums.js';
import {
  TRANSITIONS,
  findTransition,
  isOpenStatus,
  nextStatusesFrom,
} from './report-transitions.js';

describe('tabela de transições', () => {
  it('deixa toda situação do enum alcançável', () => {
    const alcancaveis = new Set<string>([ReportStatus.RECEIVED, ...TRANSITIONS.map((t) => t.to)]);

    expect(Object.values(ReportStatus).every((s) => alcancaveis.has(s))).toBe(true);
  });

  it('dá à improcedência um caminho, saindo apenas de TRIAGE', () => {
    const paraRejeitada = TRANSITIONS.filter((t) => t.to === ReportStatus.REJECTED);

    expect(paraRejeitada).toHaveLength(1);
    expect(paraRejeitada[0].from).toBe(ReportStatus.TRIAGE);
    expect(paraRejeitada[0].owner).toBe('triage');
  });

  it('exige comentário nas transições que encerram o atendimento', () => {
    for (const to of [ReportStatus.REJECTED, ReportStatus.RESOLVED, ReportStatus.CANCELLED]) {
      expect(TRANSITIONS.filter((t) => t.to === to).every((t) => t.requiresComment)).toBe(true);
    }
  });

  it('restringe a triagem a coordenador e administrador', () => {
    for (const t of TRANSITIONS.filter((t) => t.owner.startsWith('triage'))) {
      expect(t.roles).not.toContain('AGENT');
    }
  });

  it('não declara transição saindo de uma situação final', () => {
    for (const final of [ReportStatus.RESOLVED, ReportStatus.REJECTED, ReportStatus.CANCELLED]) {
      expect(isOpenStatus(final)).toBe(false);
    }
  });

  it('não tem transição duplicada', () => {
    const chaves = TRANSITIONS.map((t) => `${t.from}->${t.to}@${t.owner}`);

    expect(new Set(chaves).size).toBe(chaves.length);
  });
});

describe('findTransition', () => {
  it('encontra a transição quando o endpoint é o responsável', () => {
    expect(
      findTransition(ReportStatus.RECEIVED, ReportStatus.TRIAGE, 'triage/start'),
    ).toBeDefined();
  });

  it('não encontra quando o endpoint não é o responsável por aquela aresta', () => {
    expect(findTransition(ReportStatus.TRIAGE, ReportStatus.REJECTED, 'status')).toBeUndefined();
    expect(
      findTransition(ReportStatus.IN_PROGRESS, ReportStatus.RESOLVED, 'triage'),
    ).toBeUndefined();
  });

  it('não permite pular etapas nem voltar atrás', () => {
    expect(
      findTransition(ReportStatus.RECEIVED, ReportStatus.IN_PROGRESS, 'status'),
    ).toBeUndefined();
    expect(findTransition(ReportStatus.RESOLVED, ReportStatus.IN_PROGRESS, 'status')).toBeUndefined();
    expect(findTransition(ReportStatus.RECEIVED, ReportStatus.RESOLVED, 'status')).toBeUndefined();
  });
});

describe('nextStatusesFrom', () => {
  it('lista as saídas da triagem', () => {
    expect(nextStatusesFrom(ReportStatus.TRIAGE, 'triage').sort()).toEqual(
      [ReportStatus.IN_PROGRESS, ReportStatus.REJECTED].sort(),
    );
  });

  it('lista as saídas do atendimento', () => {
    expect(nextStatusesFrom(ReportStatus.IN_PROGRESS, 'status').sort()).toEqual(
      [ReportStatus.CANCELLED, ReportStatus.RESOLVED].sort(),
    );
  });
});
