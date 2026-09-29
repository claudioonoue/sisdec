import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';

function contexto(user?: { role: string }) {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as never;
}

function guarda(metadados: { isPublic?: boolean; roles?: string[] }) {
  const reflector = {
    getAllAndOverride: vi.fn((key: string) =>
      key === 'isPublic' ? metadados.isPublic : metadados.roles,
    ),
  } as unknown as Reflector;

  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('libera rota pública mesmo sem agente', () => {
    expect(guarda({ isPublic: true }).canActivate(contexto())).toBe(true);
  });

  it('libera rota sem @Roles para qualquer agente autenticado', () => {
    expect(guarda({ roles: undefined }).canActivate(contexto({ role: 'AGENT' }))).toBe(true);
    expect(guarda({ roles: [] }).canActivate(contexto({ role: 'AGENT' }))).toBe(true);
  });

  it('libera quando o perfil está na lista', () => {
    expect(
      guarda({ roles: ['COORDINATOR', 'ADMIN'] }).canActivate(contexto({ role: 'ADMIN' })),
    ).toBe(true);
  });

  it('recusa com 403 quando o perfil não está na lista (RF-API-31)', () => {
    expect(() =>
      guarda({ roles: ['ADMIN'] }).canActivate(contexto({ role: 'AGENT' })),
    ).toThrow(ForbiddenException);
  });

  it('recusa quando não há agente na requisição', () => {
    expect(() => guarda({ roles: ['ADMIN'] }).canActivate(contexto())).toThrow(ForbiddenException);
  });

  it('não trata os perfis como hierárquicos: COORDINATOR não entra em rota de ADMIN', () => {
    expect(() =>
      guarda({ roles: ['ADMIN'] }).canActivate(contexto({ role: 'COORDINATOR' })),
    ).toThrow(ForbiddenException);
  });
});
