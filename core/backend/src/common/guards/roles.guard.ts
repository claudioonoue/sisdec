import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AgentRole } from '../../generated/prisma/enums.js';
import type { AuthenticatedAgent } from '../../modules/auth/authenticated-agent.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

/**
 * Autoriza a rota conforme o perfil do agente, respondendo `403` quando o perfil
 * não tem permissão (RF-API-31).
 *
 * Roda depois do `JwtAuthGuard`, então pode contar com `request.user`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<AgentRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Sem @Roles, basta estar autenticado.
    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedAgent }>();

    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException('Perfil sem permissão para esta operação');
    }

    return true;
  }
}
