import type { AuthenticatedAgent } from '@/types/agent';
import type { AgentSummary, ReportDetail } from '@/types/report';
import { canCoordinate } from '@/types/agent';
import { Alert } from '@/components/ui/alert';
import { AssignForm } from './assign-form';
import { StatusForm } from './status-form';
import { TriageForm } from './triage-form';
import { UpdateForm } from './update-form';

/**
 * Ações de atendimento disponíveis para **este** agente nesta ocorrência
 * (RF-OP-30).
 *
 * Quase tudo aqui é decidido pela API: `availableTransitions` já vem resolvida
 * para quem pediu ([decisão 16](../../../../docs/arquitetura.md#8-transições-oferecidas-pela-api-decisão-16)).
 * Sobram duas regras que não são transição de situação e que o contrato fixa em
 * uma linha cada — atribuir é de coordenação, registrar andamento é de todos.
 *
 * Nada disso protege coisa alguma: a autorização é sempre a da API
 * (`RNF-OP-14`). O que estas regras evitam é oferecer um botão que resultaria em
 * `403`.
 */
export function CarePanel({
  report,
  agent,
  assignableAgents,
}: {
  report: ReportDetail;
  agent: AuthenticatedAgent;
  assignableAgents: AgentSummary[];
}) {
  const triage = report.availableTransitions.filter((t) => t.owner !== 'status');
  const status = report.availableTransitions.filter((t) => t.owner === 'status');

  // Se a ocorrência está em curso vem da API (RF-API-73): deduzi-lo aqui exigiria
  // o portal manter a lista de situações finais, que é a cópia do ciclo de vida
  // que a decisão 16 dispensou.
  const open = report.open;
  const mayAssign = canCoordinate(agent.role) && open;
  const isAssignee = report.assignedTo?.id === agent.id;

  // Lista vazia com a ocorrência ainda aberta só acontece por um motivo: o
  // agente não é o responsável. RF-OP-64 exige que o motivo esteja à vista, e
  // não seja deduzido da ausência de botões.
  const blockedByAssignment =
    open && report.availableTransitions.length === 0 && !canCoordinate(agent.role);

  return (
    <div className="space-y-5">
      {!open ? (
        <Alert tone="info">
          Esta ocorrência está encerrada. O histórico continua aberto a novos andamentos, mas a
          situação não muda mais.
        </Alert>
      ) : null}

      {blockedByAssignment ? (
        <Alert tone="info" title="Você não é o responsável por esta ocorrência">
          {report.assignedTo
            ? `O atendimento está com ${report.assignedTo.name}. Um agente só altera a situação das ocorrências atribuídas a si; coordenação e administração alteram qualquer uma.`
            : 'Nenhum responsável foi definido ainda. A atribuição é feita pela coordenação.'}{' '}
          Você pode registrar um andamento no histórico.
        </Alert>
      ) : null}

      {triage.length > 0 ? (
        <Section title="Triagem">
          <TriageForm report={report} transitions={triage} />
        </Section>
      ) : null}

      {mayAssign ? (
        <Section title="Responsável">
          <AssignForm
            reportId={report.id}
            agents={assignableAgents}
            currentAssigneeId={report.assignedTo?.id ?? null}
          />
        </Section>
      ) : null}

      {status.length > 0 ? (
        <Section title={isAssignee ? 'Encerrar o seu atendimento' : 'Encerrar o atendimento'}>
          <StatusForm reportId={report.id} transitions={status} />
        </Section>
      ) : null}

      <Section title="Registrar andamento">
        <UpdateForm reportId={report.id} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-4 first:border-0 first:pt-0">
      <h3 className="mb-2 text-sm font-medium text-ink">{title}</h3>
      {children}
    </div>
  );
}
