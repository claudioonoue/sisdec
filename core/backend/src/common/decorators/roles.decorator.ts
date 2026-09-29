import { SetMetadata } from '@nestjs/common';
import type { AgentRole } from '../../generated/prisma/enums.js';

export const ROLES_KEY = 'roles';

/**
 * Restringe a rota aos perfis informados. Sem o decorador, qualquer agente
 * autenticado pode acessar.
 *
 * Os perfis não são hierárquicos aqui: liste todos os que podem acessar, como
 * `@Roles('COORDINATOR', 'ADMIN')`. A hierarquia descrita na documentação é
 * convenção de produto, não regra do guarda — deixá-la implícita no código
 * esconderia quem de fato tem acesso a cada rota.
 */
export const Roles = (...roles: AgentRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
