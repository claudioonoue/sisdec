'use client';

import { useState } from 'react';
import { ActionForm } from './action-form';
import { addUpdate } from './actions';

const FIELD = 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink';

/**
 * Registro de andamento (RF-OP-36, RF-OP-37).
 *
 * A visibilidade é escolha **explícita**, e o padrão é interno: um texto que vai
 * parar na consulta pública não deve chegar lá por descuido de quem não reparou
 * numa caixa já marcada.
 */
export function UpdateForm({ reportId }: { reportId: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <ActionForm
      action={addUpdate}
      reportId={reportId}
      submitLabel="Registrar andamento"
      pendingLabel="Registrando…"
    >
      {(state) => (
        <>
          <div>
            <label htmlFor="update-comment" className="block text-xs font-medium text-ink-muted">
              Andamento
            </label>
            <textarea
              id="update-comment"
              name="comment"
              rows={3}
              required
              defaultValue={state.values.comment}
              className={`${FIELD} mt-1`}
            />
          </div>

          {/*
            A caixa carrega o próprio nome e valor, em vez de alimentar um campo
            oculto pelo estado do React: assim a escolha chega ao servidor mesmo
            sem JavaScript. Caixa desmarcada não envia nada, e o servidor lê
            ausência como interno — que é o padrão certo.
          */}
          <label className="flex items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              name="visibleToCitizen"
              value="true"
              checked={visible}
              onChange={(event) => setVisible(event.target.checked)}
              className="mt-0.5"
            />
            <span>Visível ao cidadão</span>
          </label>

          {/* RF-OP-37: o alerta aparece quando a escolha é feita, e não antes. */}
          {visible ? (
            <p className="rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-warning">
              Este texto aparecerá na consulta pública por protocolo, para qualquer pessoa que
              tenha o número. Não inclua dado pessoal nem informação de uso interno.
            </p>
          ) : (
            <p className="text-xs text-ink-muted">
              O andamento fica interno e não aparece na consulta pública.
            </p>
          )}
        </>
      )}
    </ActionForm>
  );
}
