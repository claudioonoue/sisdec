import type { AgentRole } from './enums';

/** Resposta de `GET /auth/me` e bloco `agent` de `POST /auth/login`. */
export interface AuthenticatedAgent {
  id: string;
  name: string;
  email: string;
  role: AgentRole;
}

/** Resposta de `POST /auth/login`. */
export interface LoginResponse {
  accessToken: string;
  agent: AuthenticatedAgent;
}

/**
 * Os predicados de perfil moram junto dos tipos porque comparar com `'ADMIN'` é
 * escrever um valor de enumeração: por `RNF-OP-45`, esses literais não podem
 * aparecer fora de `types/`. As telas perguntam `isAdmin(agent.role)`.
 *
 * As restrições de tela são conveniência de interface — a autorização de
 * verdade é sempre a da API (`RNF-OP-14`).
 */
export function isAdmin(role: AgentRole): boolean {
  return role === 'ADMIN';
}

/** Coordenador ou administrador — quem tria e atribui responsável. */
export function canCoordinate(role: AgentRole): boolean {
  return role === 'ADMIN' || role === 'COORDINATOR';
}
