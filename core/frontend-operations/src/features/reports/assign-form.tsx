'use client';

import type { AgentSummary } from '@/types/report';
import { ActionForm } from './action-form';
import { assignReport } from './actions';

const FIELD = 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink';

/**
 * Atribuição de responsável (RF-OP-33).
 *
 * A lista vem de `GET /reports/assignable-agents`, que já devolve apenas agentes
 * ativos — e não de `GET /agents`, restrito ao administrador. Atribuir não é
 * transição de situação e por isso não consta em `availableTransitions`: quem
 * decide se o formulário aparece é o perfil, na tela.
 */
export function AssignForm({
  reportId,
  agents,
  currentAssigneeId,
}: {
  reportId: string;
  agents: AgentSummary[];
  currentAssigneeId: string | null;
}) {
  if (agents.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        Nenhum agente ativo disponível para atribuição.
      </p>
    );
  }

  return (
    <ActionForm
      action={assignReport}
      reportId={reportId}
      submitLabel={currentAssigneeId ? 'Trocar o responsável' : 'Atribuir responsável'}
      pendingLabel="Atribuindo…"
    >
      {(state) => (
        <>
          <label htmlFor="assignedToId" className="block text-xs font-medium text-ink-muted">
            Agente responsável
          </label>
          <select
            id="assignedToId"
            name="assignedToId"
            defaultValue={state.values.assignedToId || currentAssigneeId || ''}
            className={`${FIELD} mt-1`}
          >
            <option value="">Escolha o agente</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-ink-muted">
            A troca fica registrada no histórico, para que o atendimento continue rastreável.
          </p>
        </>
      )}
    </ActionForm>
  );
}
