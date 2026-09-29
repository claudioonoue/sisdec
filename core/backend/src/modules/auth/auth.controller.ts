import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentAgent } from '../../common/decorators/current-agent.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { AuthService } from './auth.service.js';
import type { AuthenticatedAgent } from './authenticated-agent.js';
import { AuthenticatedAgentDto, LoginResponseDto } from './dto/login-response.dto.js';
import { LoginDto } from './dto/login.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica um agente e devolve o token JWT' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Credenciais inválidas ou conta desativada — a resposta não distingue os casos',
  })
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.auth.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dados do agente autenticado' })
  @ApiOkResponse({ type: AuthenticatedAgentDto })
  me(@CurrentAgent() agent: AuthenticatedAgent): AuthenticatedAgentDto {
    return agent;
  }
}
