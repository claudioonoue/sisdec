import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import type { AuthenticatedAgent } from './authenticated-agent.js';
import { type JwtPayload, AuthService } from './auth.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<EnvironmentVariables, true>,
    private readonly auth: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Token expirado é recusado pela própria estratégia, com 401 (RNF-API-16).
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
    });
  }

  validate(payload: JwtPayload): Promise<AuthenticatedAgent> {
    return this.auth.resolveAgentFromToken(payload);
  }
}
