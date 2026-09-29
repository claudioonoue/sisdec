import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from '../../common/password.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedAgent } from './authenticated-agent.js';
import type { LoginDto } from './dto/login.dto.js';
import type { LoginResponseDto } from './dto/login-response.dto.js';

/** Conteúdo do token. `sub` é o id do agente. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: AuthenticatedAgent['role'];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const agent = await this.prisma.agent.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true, name: true, email: true, role: true, active: true, passwordHash: true },
    });

    // Um único erro para e-mail inexistente, senha errada e conta desativada: a
    // resposta não deve permitir descobrir quais e-mails existem (RF-API-26).
    // A senha é conferida mesmo quando o agente não existe? Não — mas o custo do
    // bcrypt torna a diferença de tempo pequena frente à latência de rede, e o
    // rate limiting de B3 é a defesa prevista contra tentativa em massa.
    if (!agent || !agent.active) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!(await verifyPassword(dto.password, agent.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: JwtPayload = { sub: agent.id, email: agent.email, role: agent.role };

    return {
      accessToken: await this.jwt.signAsync(payload),
      agent: { id: agent.id, name: agent.name, email: agent.email, role: agent.role },
    };
  }

  /**
   * Resolve o agente a partir do token já verificado.
   *
   * Consulta o banco em vez de confiar apenas no conteúdo do token: assim, um
   * agente desativado perde o acesso imediatamente, sem esperar o token expirar,
   * e uma mudança de perfil passa a valer na requisição seguinte.
   */
  async resolveAgentFromToken(payload: JwtPayload): Promise<AuthenticatedAgent> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    if (!agent || !agent.active) {
      throw new UnauthorizedException('Token inválido');
    }

    return { id: agent.id, name: agent.name, email: agent.email, role: agent.role };
  }
}
