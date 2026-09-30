'use client';

import { useState } from 'react';
import type { AvailableTransition } from '@/types/report';
import { useMetadata } from '@/features/metadata/metadata-provider';
import { labelFor } from '@/lib/enum-label';
import { ActionForm } from '@/components/ui/action-form';
import { changeStatus } from './actions';
import { PublicCommentWarning } from './public-comment-warning';

const FIELD = 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink';
const LABEL = 'block text-xs font-medium text-ink-muted';

/**
 * Mudança de situação (RF-OP-34, RF-OP-35).
 *
 * As opções são **as que a API ofereceu** — nada é derivado da situação atual
 * aqui. A exigência de comentário também vem de lá, em `requiresComment`, e não
 * de uma lista de situações mantida no portal.
 */
export function StatusForm({
  reportId,
  transitions,
}: {
  reportId: string;
  transitions: AvailableTransition[];
}) {
  const metadata = useMetadata();
  const [chosen, setChosen] = useState(() => transitions[0].to);

  const transition = transitions.find((t) => t.to === chosen) ?? transitions[0];
  const label = labelFor(metadata.reportStatuses, transition.to);

  return (
    <ActionForm
      action={changeStatus}
      hidden={{ reportId: reportId }}
      submitLabel={`Marcar como ${label.toLowerCase()}`}
      pendingLabel="Registrando…"
      tone="danger"
      // RNF-OP-07: toda transição daqui encerra o atendimento.
      confirmation={`Marcar esta ocorrência como ${label.toLowerCase()} encerra o atendimento. Confirmar?`}
    >
      {(state) => (
        <>
          <input type="hidden" name="requiresComment" value={String(transition.requiresComment)} />

          <div>
            <label htmlFor="status" className={LABEL}>
              Nova situação
            </label>
            <select
              id="status"
              name="status"
              value={chosen}
              onChange={(event) => setChosen(event.target.value as typeof chosen)}
              className={`${FIELD} mt-1`}
            >
              {transitions.map((option) => (
                <option key={option.to} value={option.to}>
                  {labelFor(metadata.reportStatuses, option.to)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status-comment" className={LABEL}>
              Comentário{transition.requiresComment ? '' : ' (opcional)'}
            </label>
            <textarea
              id="status-comment"
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
