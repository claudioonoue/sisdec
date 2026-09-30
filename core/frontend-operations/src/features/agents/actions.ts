'use server';

import { revalidatePath } from 'next/cache';
import type { Agent } from '@/types/agent';
import type { ActionState } from '@/lib/action-state';
import { ApiError, userMessageFor } from '@/lib/api-error';
import { apiRequest } from '@/lib/api-client';
import { requireAgent } from '@/lib/session';
import { isAdmin } from '@/types/agent';

/**
 * Cadastro de agentes — restrito ao administrador (RF-OP-47 a RF-OP-54).
 *
 * Cada ação confere o perfil antes de chamar a API. Isso **não** é a proteção:
 * a API recusa de qualquer forma (`RNF-OP-14`). É para que uma requisição
 * forjada a partir da tela de outro perfil falhe aqui, com mensagem em pt-BR, em
 * vez de produzir um `403` cru vindo de outra camada.
 */

async function requireAdmin() {
  const agent = await requireAgent();
  if (!isAdmin(agent.role)) {
    throw new ApiError(403, 'permission', 'Apenas o administrador gerencia agentes.');
  }
  return agent;
}

async function run(values: Record<string, string>, call: () => Promise<unknown>, sucesso: string) {
  try {
    await call();
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: 'error' as const, message: userMessageFor(error), values };
    }
    throw error;
  }

  revalidatePath('/agentes');
  return { status: 'success' as const, message: sucesso, values: {} };
}

/** `POST /agents` (RF-OP-48, RF-OP-49). */
export async function createAgent(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const role = String(formData.get('role') ?? '');
  const values = { name, email, role };

  if (!name || !email || !role) {
    return { status: 'error', message: 'Preencha nome, e-mail e perfil.', values };
  }

  // A API exige 8 caracteres e devolve «password deve ter ao menos 8 caracteres»
  // — nome de campo em inglês, que o agente não deve ler (RNF-OP-05).
  if (password.length < 8) {
    return { status: 'error', message: 'A senha inicial precisa de ao menos 8 caracteres.', values };
  }

  return run(
    values,
    () => apiRequest<Agent>('/agents', { method: 'POST', body: { name, email, password, role } }),
    `Agente ${name} cadastrado.`,
  );
}

/** `PATCH /agents/:id` (RF-OP-50). */
export async function updateAgent(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get('agentId'));
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const role = String(formData.get('role') ?? '');
  const password = String(formData.get('password') ?? '');
  const values = { name, email, role };

  if (!name || !email || !role) {
    return { status: 'error', message: 'Nome, e-mail e perfil não podem ficar vazios.', values };
  }

  if (password && password.length < 8) {
    return { status: 'error', message: 'A nova senha precisa de ao menos 8 caracteres.', values };
  }

  return run(
    values,
    () =>
      apiRequest<Agent>(`/agents/${id}`, {
        method: 'PATCH',
        // A senha só vai quando foi digitada: mandar string vazia seria pedir à
        // API para trocar a senha por nada.
        body: { name, email, role, ...(password && { password }) },
      }),
    password ? `Dados de ${name} atualizados, com nova senha.` : `Dados de ${name} atualizados.`,
  );
}

/** `PATCH /agents/:id/deactivate` (RF-OP-51, RF-OP-54). */
export async function deactivateAgent(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get('agentId'));
  const name = String(formData.get('name') ?? 'o agente');

  // RF-OP-54. A API também recusa; aqui a recusa chega antes, com o motivo.
  if (id === admin.id) {
    return {
      status: 'error',
      message: 'Você não pode desativar a sua própria conta — perderia o acesso a esta tela.',
      values: {},
    };
  }

  return run(
    {},
    () => apiRequest<Agent>(`/agents/${id}/deactivate`, { method: 'PATCH' }),
    `${name} foi desativado. O registro continua no sistema, preservando o histórico.`,
  );
}
