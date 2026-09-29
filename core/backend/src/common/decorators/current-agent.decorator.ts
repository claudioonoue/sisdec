import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedAgent } from '../../modules/auth/authenticated-agent.js';

/** Agente autenticado, extraído do token já validado pelo `JwtAuthGuard`. */
export const CurrentAgent = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedAgent => {
    const request = context.switchToHttp().getRequest<Request & { user: AuthenticatedAgent }>();
    return request.user;
  },
);
