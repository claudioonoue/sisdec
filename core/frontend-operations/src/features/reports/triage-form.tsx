'use client';

import { useState } from 'react';
import type { AvailableTransition, ReportDetail } from '@/types/report';
import { FORWARDING_OUTCOME, triageOutcomeFor } from '@/types/report';
import { useMetadata } from '@/features/metadata/metadata-provider';
import { labelFor } from '@/lib/enum-label';
import { ActionForm } from '@/components/ui/action-form';
import { concludeTriage, startTriage } from './actions';
import { PublicCommentWarning } from './public-comment-warning';

const FIELD = 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink';
const LABEL = 'block text-xs font-medium text-ink-muted';

/**
 * Triagem em duas etapas (RF-OP-62, RF-OP-31, RF-OP-63).
 *
 * Qual das duas aparece não é decidido aqui: vem de `availableTransitions`, que
 * a API resolve para este agente e esta ocorrência (`RF-API-72`). O portal não
 * conhece o ciclo de vida — se a lista trouxer a transição, o formulário existe.
 */
export function TriageForm({
  report,
  transitions,
}: {
  report: ReportDetail;
  transitions: AvailableTransition[];
}) {
  const triageStart = transitions.find((t) => t.owner === 'triage/start');
  const conclusions = transitions.filter((t) => t.owner === 'triage');

  if (triageStart) {
    return (
      <ActionForm
        action={startTriage}
        hidden={{ reportId: report.id }}
        submitLabel="Assumir a triagem"
        pendingLabel="Assumindo…"
      >
        <p className="text-sm text-ink-muted">
          Assumir sinaliza aos demais coordenadores que esta ocorrência já está sendo analisada.
        </p>
      </ActionForm>
    );
  }

  if (conclusions.length > 0) {
    return <ConcludeTriageForm report={report} conclusions={conclusions} />;
  }

  return null;
}

function ConcludeTriageForm({
  report,
  conclusions,
}: {
  report: ReportDetail;
  conclusions: AvailableTransition[];
}) {
  const metadata = useMetadata();
  const [chosen, setChosen] = useState(() => conclusions[0].to);

  const transition = conclusions.find((t) => t.to === chosen) ?? conclusions[0];
  // Encaminhar exige prioridade; declarar improcedente, não. A diferença é do
  // contrato do endpoint de triagem, não da tabela de transições.
  const forwarding = triageOutcomeFor(transition.to) === FORWARDING_OUTCOME;

  return (
    <ActionForm
      action={concludeTriage}
      hidden={{ reportId: report.id }}
      submitLabel={forwarding ? 'Encaminhar para atendimento' : 'Declarar improcedente'}
      pendingLabel="Concluindo…"
      tone={forwarding ? 'default' : 'danger'}
      // RNF-OP-07: a improcedência encerra a ocorrência e não tem volta.
      confirmation={
        forwarding
          ? undefined
          : 'Declarar esta ocorrência improcedente a encerra, e não há caminho de volta. Confirmar?'
      }
    >
      {(state) => (
        <>
          <fieldset>
            <legend className={LABEL}>Desfecho da triagem</legend>
            <div className="mt-1.5 space-y-1.5">
              {conclusions.map((option) => (
                <label key={option.to} className="flex items-center gap-2 text-sm text-ink">
                  {/*
                    O botão carrega o próprio `outcome`, e não alimenta um campo
                    oculto pelo estado: a escolha chega ao servidor mesmo sem
                    JavaScript.
                  */}
                  <input
                    type="radio"
                    name="outcome"
                    value={triageOutcomeFor(option.to)}
                    checked={chosen === option.to}
                    onChange={() => setChosen(option.to)}
                  />
                  {labelFor(metadata.reportStatuses, option.to)}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="type" className={LABEL}>
              Confirmar o tipo
            </label>
            <select
              id="type"
              name="type"
              defaultValue={state.values.type || report.type}
              className={`${FIELD} mt-1`}
            >
              {metadata.reportTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {forwarding ? (
            <div>
              <label htmlFor="priority" className={LABEL}>
                Prioridade
              </label>
              <select
                id="priority"
                name="priority"
                defaultValue={state.values.priority || report.suggestedPriority || ''}
                required
                className={`${FIELD} mt-1`}
              >
                <option value="">Escolha a prioridade</option>
                {metadata.priorities.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* RF-OP-32: a sugestão é dita, e permanece alterável. */}
              {report.suggestedPriority ? (
                <p className="mt-1 text-xs text-warning">
                  Tipo de risco imediato à vida — sugerida a prioridade{' '}
                  {labelFor(metadata.priorities, report.suggestedPriority)}. Pode ser alterada.
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label htmlFor="triage-comment" className={LABEL}>
              Justificativa{transition.requiresComment ? '' : ' (opcional)'}
            </label>
            <textarea
              id="triage-comment"
              name="comment"
              rows={3}
              required={transition.requiresComment}
              defaultValue={state.values.comment}
              className={`${FIELD} mt-1`}
            />
            <PublicCommentWarning />
          </div>
        </>
      )}
    </ActionForm>
  );
}
