'use client';

import type { Agent } from '@/types/agent';
import { ActionForm } from '@/components/ui/action-form';
import { Badge } from '@/components/ui/badge';
import { useMetadata } from '@/features/metadata/metadata-provider';
import { labelFor } from '@/lib/enum-label';
import { formatDate } from '@/lib/format';
import { AgentForm } from './agent-form';
import { deactivateAgent } from './actions';

/**
 * Relação de agentes (RF-OP-47).
 *
 * Tabela semântica, como a de ocorrências (`RNF-OP-34`). Cada linha expande num
 * `<details>` com a edição e a desativação — duas telas separadas para isso
 * fariam o administrador perder o contexto de quem está editando.
 */
export function AgentsTable({ agents, currentAgentId }: { agents: Agent[]; currentAgentId: string }) {
  const metadata = useMetadata();

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          Agentes cadastrados, com nome, e-mail, perfil, situação de ativação e data de cadastro.
        </caption>
        <thead>
          <tr className="border-b border-border bg-surface-muted text-left">
            <Th>Nome</Th>
            <Th className="hidden md:table-cell">E-mail</Th>
            <Th>Perfil</Th>
            <Th>Situação</Th>
            <Th className="hidden lg:table-cell">Cadastrado em</Th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr
              key={agent.id}
              className="border-b border-border last:border-0 align-top"
            >
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer font-medium text-brand-strong">
                    {agent.name}
                    {agent.id === currentAgentId ? (
                      <span className="ml-2 text-xs font-normal text-ink-muted">(você)</span>
                    ) : null}
                  </summary>

                  <div className="mt-4 space-y-5 rounded-md border border-border bg-surface-muted/40 p-4">
                    <AgentForm agent={agent} />

                    {agent.active ? (
                      <div className="border-t border-border pt-4">
                        <ActionForm
                          action={deactivateAgent}
                          hidden={{ agentId: agent.id, name: agent.name }}
                          submitLabel="Desativar agente"
                          pendingLabel="Desativando…"
                          tone="danger"
                          // RF-OP-54: o próprio administrador não se desativa.
                          disabled={agent.id === currentAgentId}
                          // RNF-OP-07 e RF-OP-51: fica claro que é desativação,
                          // não exclusão — o histórico das ocorrências continua
                          // apontando para quem agiu.
                          confirmation={`Desativar ${agent.name}? O acesso é revogado na hora. O registro não é excluído: o histórico das ocorrências continua mostrando quem agiu.`}
                        >
                          <p className="text-xs text-ink-muted">
                            {agent.id === currentAgentId
                              ? 'Você não pode desativar a sua própria conta — perderia o acesso a esta tela.'
                              : 'O agente deixa de entrar no portal e some da lista de responsáveis atribuíveis. Nada é excluído.'}
                          </p>
                        </ActionForm>
                      </div>
                    ) : (
                      <p className="border-t border-border pt-4 text-xs text-ink-muted">
                        Conta desativada. A reativação não está prevista nesta versão do portal.
                      </p>
                    )}
                  </div>
                </details>
              </td>

              <td className="hidden px-4 py-3 text-ink-muted md:table-cell">{agent.email}</td>
              <td className="px-4 py-3 text-ink">{labelFor(metadata.agentRoles, agent.role)}</td>
              <td className="px-4 py-3">
                {/*
                  RF-OP-53: o inativo se distingue por **rótulo**, não só por tom
                  esmaecido — esmaecer sozinho some na impressão e para quem não
                  distingue as cores (RNF-OP-31).
                */}
                <Badge
                  tone={agent.active ? 'success' : 'muted'}
                  label={agent.active ? 'Ativo' : 'Inativo'}
                />
              </td>
              <td className="hidden whitespace-nowrap px-4 py-3 text-ink-muted lg:table-cell">
                {formatDate(agent.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={`px-4 py-2.5 text-xs font-semibold text-ink-muted ${className}`}>
      {children}
    </th>
  );
}
