'use client';

import type { Agent } from '@/types/agent';
import { ActionForm } from '@/components/ui/action-form';
import { useMetadata } from '@/features/metadata/metadata-provider';
import { createAgent, updateAgent } from './actions';

const FIELD = 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink';
const LABEL = 'block text-xs font-medium text-ink-muted';

/**
 * Cadastro e edição de agente (RF-OP-48, RF-OP-50).
 *
 * O mesmo formulário serve aos dois: os campos são os mesmos, e a única
 * diferença é a senha — obrigatória ao cadastrar, opcional ao editar, onde
 * preenchê-la significa redefinir. Duas telas quase iguais divergiriam na
 * primeira alteração.
 *
 * Os perfis vêm de `GET /metadata/internal` (RF-OP-56): o portal não mantém a
 * lista deles.
 */
export function AgentForm({ agent }: { agent?: Agent }) {
  const metadata = useMetadata();
  const editando = Boolean(agent);

  return (
    <ActionForm
      action={editando ? updateAgent : createAgent}
      hidden={agent ? { agentId: agent.id } : {}}
      submitLabel={editando ? 'Salvar alterações' : 'Cadastrar agente'}
      pendingLabel="Salvando…"
    >
      {(state) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`name-${agent?.id ?? 'novo'}`} className={LABEL}>
              Nome
            </label>
            <input
              id={`name-${agent?.id ?? 'novo'}`}
              name="name"
              required
              defaultValue={state.values.name ?? agent?.name ?? ''}
              className={`${FIELD} mt-1`}
            />
          </div>

          <div>
            <label htmlFor={`email-${agent?.id ?? 'novo'}`} className={LABEL}>
              E-mail
            </label>
            <input
              id={`email-${agent?.id ?? 'novo'}`}
              name="email"
              type="email"
              required
              autoComplete="off"
              defaultValue={state.values.email ?? agent?.email ?? ''}
              className={`${FIELD} mt-1`}
            />
          </div>

          <div>
            <label htmlFor={`role-${agent?.id ?? 'novo'}`} className={LABEL}>
              Perfil
            </label>
            <select
              id={`role-${agent?.id ?? 'novo'}`}
              name="role"
              required
              defaultValue={state.values.role || agent?.role || ''}
              className={`${FIELD} mt-1`}
            >
              <option value="">Escolha o perfil</option>
              {metadata.agentRoles.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`password-${agent?.id ?? 'novo'}`} className={LABEL}>
              {editando ? 'Nova senha (deixe em branco para manter)' : 'Senha inicial'}
            </label>
            <input
              id={`password-${agent?.id ?? 'novo'}`}
              name="password"
              type="password"
              required={!editando}
              minLength={8}
              autoComplete="new-password"
              className={`${FIELD} mt-1`}
            />
            <p className="mt-1 text-xs text-ink-muted">
              Ao menos 8 caracteres. Informe-a ao agente por um canal seguro — ela não fica
              visível depois de salva.
            </p>
          </div>
        </div>
      )}
    </ActionForm>
  );
}
