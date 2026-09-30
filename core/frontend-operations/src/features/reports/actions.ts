'use server';

import { revalidatePath } from 'next/cache';
import type { ReportDetail } from '@/types/report';
import { FORWARDING_OUTCOME } from '@/types/report';
import { ApiError, userMessageFor } from '@/lib/api-error';
import { apiRequest } from '@/lib/api-client';
import { requireAgent } from '@/lib/session';
import type { ActionState } from '@/lib/action-state';

/**
 * Ações de atendimento da ocorrência.
 *
 * Todas seguem a mesma forma: chamam a API, e devolvem **o que a API respondeu**
 * ou a recusa em pt-BR. Nenhuma presume o resultado nem atualiza a tela por
 * conta própria (`RNF-OP-29`) — `revalidatePath` faz o servidor reconstruir o
 * detalhe a partir do estado que a API passou a ter, inclusive as transições
 * que agora estão disponíveis.
 *
 * Os dados digitados voltam no estado em caso de recusa (`RNF-OP-06`), para que
 * um comentário longo não se perca num `409`.
 */

/** Envolve a chamada, traduzindo a recusa e recarregando o detalhe no sucesso. */
async function run(
  reportId: string,
  values: Record<string, string>,
  call: () => Promise<unknown>,
): Promise<ActionState> {
  try {
    await call();
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: 'error', message: userMessageFor(error), values };
    }
    throw error;
  }

  // O detalhe e a lista mudaram: situação, histórico e ações disponíveis.
  revalidatePath(`/ocorrencias/${reportId}`);
  revalidatePath('/ocorrencias');

  return { status: 'success', message: SUCCESS_MESSAGES[values.intent] ?? 'Operação concluída.', values: {} };
}

const SUCCESS_MESSAGES: Record<string, string> = {
  startTriage: 'Triagem assumida. A ocorrência está agora sob a sua análise.',
  concludeTriage: 'Triagem concluída.',
  assign: 'Responsável definido.',
  changeStatus: 'Situação atualizada.',
  addUpdate: 'Andamento registrado no histórico.',
};

/** `PATCH /reports/:id/triage/start` — assume a triagem (RF-OP-62). */
export async function startTriage(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAgent();
  const reportId = String(formData.get('reportId'));

  return run(reportId, { intent: 'startTriage' }, () =>
    apiRequest<ReportDetail>(`/reports/${reportId}/triage/start`, { method: 'PATCH' }),
  );
}

/** `PATCH /reports/:id/triage` — conclui a triagem (RF-OP-31, RF-OP-63). */
export async function concludeTriage(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAgent();
  const reportId = String(formData.get('reportId'));
  const outcome = String(formData.get('outcome') ?? '');
  const type = String(formData.get('type') ?? '');
  const priority = String(formData.get('priority') ?? '');
  const comment = String(formData.get('comment') ?? '').trim();

  const values = { intent: 'concludeTriage', outcome, type, priority, comment };

  /*
   * As duas conferências abaixo repetem o que a API já recusa. Existem porque a
   * mensagem dela nomeia os campos do contrato — «priority é obrigatória»,
   * «comment é obrigatório na transição para REJECTED» —, e o agente não deve
   * ler nome de campo nem valor de enumeração em inglês (RNF-OP-05, RNF-OP-09).
   *
   * São regras do **endpoint de triagem**, fixadas pelo seu contrato, e não da
   * tabela de transições: encaminhar exige prioridade, recusar exige
   * justificativa. É por isso que não dependem de `requiresComment` — esse campo
   * é preenchido pelo estado da tela e ficaria desatualizado sem JavaScript.
   */
  if (outcome === FORWARDING_OUTCOME && !priority) {
    return {
      status: 'error',
      message: 'Escolha a prioridade para encaminhar a ocorrência ao atendimento.',
      values,
    };
  }

  if (outcome !== FORWARDING_OUTCOME && !comment) {
    return {
      status: 'error',
      message: 'Declarar a ocorrência improcedente exige uma justificativa.',
      values,
    };
  }

  return run(reportId, values, () =>
    apiRequest<ReportDetail>(`/reports/${reportId}/triage`, {
      method: 'PATCH',
      body: {
        outcome,
        ...(type && { type }),
        ...(priority && { priority }),
        ...(comment && { comment }),
      },
    }),
  );
}

/** `PATCH /reports/:id/assign` — define o responsável (RF-OP-33). */
export async function assignReport(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAgent();
  const reportId = String(formData.get('reportId'));
  const assignedToId = String(formData.get('assignedToId') ?? '');
  const values = { intent: 'assign', assignedToId };

  if (!assignedToId) {
    return { status: 'error', message: 'Escolha o agente responsável.', values };
  }

  return run(reportId, values, () =>
    apiRequest<ReportDetail>(`/reports/${reportId}/assign`, {
      method: 'PATCH',
      body: { assignedToId },
    }),
  );
}

/** `PATCH /reports/:id/status` — altera a situação (RF-OP-34, RF-OP-35). */
export async function changeStatus(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAgent();
  const reportId = String(formData.get('reportId'));
  const status = String(formData.get('status') ?? '');
  const comment = String(formData.get('comment') ?? '').trim();
  const requiresComment = formData.get('requiresComment') === 'true';

  const values = { intent: 'changeStatus', status, comment };

  // A exigência vem de `requiresComment`, que a API informou junto da transição
  // — não de uma lista de situações mantida aqui.
  if (requiresComment && !comment) {
    return { status: 'error', message: 'Esta mudança de situação exige um comentário.', values };
  }

  return run(reportId, values, () =>
    apiRequest<ReportDetail>(`/reports/${reportId}/status`, {
      method: 'PATCH',
      body: { status, ...(comment && { comment }) },
    }),
  );
}

/** `POST /reports/:id/updates` — registra andamento (RF-OP-36, RF-OP-37). */
export async function addUpdate(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAgent();
  const reportId = String(formData.get('reportId'));
  const comment = String(formData.get('comment') ?? '').trim();
  const visibleToCitizen = formData.get('visibleToCitizen') === 'true';

  const values = {
    intent: 'addUpdate',
    comment,
    visibleToCitizen: visibleToCitizen ? 'true' : 'false',
  };

  if (!comment) {
    return { status: 'error', message: 'Escreva o andamento antes de registrar.', values };
  }

  return run(reportId, values, () =>
    apiRequest(`/reports/${reportId}/updates`, {
      method: 'POST',
      body: { comment, visibleToCitizen },
    }),
  );
}
