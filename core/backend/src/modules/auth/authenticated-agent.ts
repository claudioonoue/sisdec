import type { AgentRole } from '../../generated/prisma/enums.js';

/**
 * Agente autenticado, anexado à requisição pela estratégia JWT.
 *
 * Não carrega `passwordHash` — nem poderia: a estratégia seleciona no banco
 * apenas estes campos (RNF-API-08).
 */
export interface AuthenticatedAgent {
  id: string;
  name: string;
  email: string;
  role: AgentRole;
}
