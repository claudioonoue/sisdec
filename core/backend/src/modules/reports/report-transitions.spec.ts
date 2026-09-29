import { AgentRole, ReportStatus } from '../../generated/prisma/enums.js';
import {
  OPEN_STATUSES,
  TRANSITIONS,
  assignmentAllows,
  availableTransitions,
  findTransition,
  isOpenStatus,
  nextStatusesFrom,
  roleAllows,
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

describe('availableTransitions', () => {
  const COORD = { id: 'coord-1', role: AgentRole.COORDINATOR };
  const RESPONSAVEL = { id: 'agente-1', role: AgentRole.AGENT };
  const OUTRO = { id: 'agente-2', role: AgentRole.AGENT };

  it('oferece ao coordenador assumir a triagem de uma ocorrência recebida', () => {
    expect(availableTransitions(ReportStatus.RECEIVED, COORD, null)).toEqual([
      { to: ReportStatus.TRIAGE, owner: 'triage/start', requiresComment: false },
    ]);
  });

  it('oferece as duas saídas da triagem, com a improcedência exigindo comentário', () => {
    const saidas = availableTransitions(ReportStatus.TRIAGE, COORD, null);

    expect(saidas).toHaveLength(2);
    expect(saidas).toContainEqual({
      to: ReportStatus.IN_PROGRESS,
      owner: 'triage',
      requiresComment: false,
    });
    expect(saidas).toContainEqual({
      to: ReportStatus.REJECTED,
      owner: 'triage',
      requiresComment: true,
    });
  });

  it('não oferece a triagem ao agente comum, que não tem esse perfil', () => {
    expect(availableTransitions(ReportStatus.RECEIVED, RESPONSAVEL, RESPONSAVEL.id)).toEqual([]);
    expect(availableTransitions(ReportStatus.TRIAGE, RESPONSAVEL, RESPONSAVEL.id)).toEqual([]);
  });

  it('oferece concluir e cancelar ao agente responsável', () => {
    const acoes = availableTransitions(ReportStatus.IN_PROGRESS, RESPONSAVEL, RESPONSAVEL.id);

    expect(acoes.map((a) => a.to).sort()).toEqual(
      [ReportStatus.CANCELLED, ReportStatus.RESOLVED].sort(),
    );
    // Ambas encerram o atendimento, e por isso pedem justificativa (RF-OP-35).
    expect(acoes.every((a) => a.requiresComment)).toBe(true);
  });

  it('não oferece nada ao agente que não é o responsável', () => {
    expect(availableTransitions(ReportStatus.IN_PROGRESS, OUTRO, RESPONSAVEL.id)).toEqual([]);
  });

  it('oferece ao coordenador mesmo em ocorrência de outro responsável', () => {
    expect(
      availableTransitions(ReportStatus.IN_PROGRESS, COORD, RESPONSAVEL.id),
    ).toHaveLength(2);
  });

  it('não oferece nada nas situações finais', () => {
    for (const status of [ReportStatus.RESOLVED, ReportStatus.REJECTED, ReportStatus.CANCELLED]) {
      expect(availableTransitions(status, COORD, null)).toEqual([]);
    }
  });

  /**
   * A propriedade que sustenta a decisão de O3: o portal oferece o que vem
   * daqui, então esta lista precisa concordar, caso a caso, com o que a execução
   * aceitaria. Se um dia alguém acrescentar uma conferência só na execução, é
   * este teste que quebra.
   */
  it('concorda com os predicados da execução em toda combinação', () => {
    const statuses = Object.values(ReportStatus);
    const atores = [COORD, RESPONSAVEL, OUTRO, { id: 'admin-1', role: AgentRole.ADMIN }];

    for (const status of statuses) {
      for (const ator of atores) {
        for (const assignedToId of [null, RESPONSAVEL.id]) {
          const oferecidas = availableTransitions(status, ator, assignedToId);

          const esperadas = TRANSITIONS.filter(
            (t) =>
              t.from === status &&
              roleAllows(t, ator.role) &&
              assignmentAllows(ator, assignedToId),
          );

          expect(oferecidas).toHaveLength(esperadas.length);
          for (const t of esperadas) {
            expect(oferecidas).toContainEqual({
              to: t.to,
              owner: t.owner,
              requiresComment: t.requiresComment,
            });
          }
        }
      }
    }
  });
});

describe('OPEN_STATUSES', () => {
  it('contém exatamente as situações de onde parte alguma transição', () => {
    expect([...OPEN_STATUSES].sort()).toEqual(
      [ReportStatus.RECEIVED, ReportStatus.TRIAGE, ReportStatus.IN_PROGRESS].sort(),
    );
  });

  it('exclui as situações finais', () => {
    for (const status of [ReportStatus.RESOLVED, ReportStatus.REJECTED, ReportStatus.CANCELLED]) {
      expect(OPEN_STATUSES).not.toContain(status);
    }
  });

  /**
   * A lista é derivada da tabela, e não escrita à mão. Este teste é o que
   * garante que continue assim: acrescentar uma aresta partindo de uma situação
   * hoje final a torna aberta em todo o sistema, sem editar lista nenhuma.
   */
  it('concorda com isOpenStatus em toda situação do enum', () => {
    for (const status of Object.values(ReportStatus)) {
      expect(OPEN_STATUSES.includes(status)).toBe(isOpenStatus(status));
    }
  });
});
