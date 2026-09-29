import { describe, expect, it } from 'vitest';
import { canCoordinate, isAdmin } from './agent';

/**
 * Os perfis **não são hierárquicos no código**, por decisão da API: cada regra
 * lista quem pode. A hierarquia da documentação é convenção de produto, e
 * embuti-la esconderia quem de fato tem acesso a quê.
 *
 * Estas restrições são conveniência de interface — a autorização é sempre a da
 * API (`RNF-OP-14`). Errá-las não abre acesso indevido; oferece um controle que
 * resultaria em `403`, ou esconde um que funcionaria.
 */
describe('predicados de perfil', () => {
  it('só o administrador administra agentes (RF-OP-52)', () => {
    expect(isAdmin('ADMIN')).toBe(true);
    expect(isAdmin('COORDINATOR')).toBe(false);
    expect(isAdmin('AGENT')).toBe(false);
  });

  it('coordenação inclui o administrador, que faz tudo o que o coordenador faz', () => {
    expect(canCoordinate('COORDINATOR')).toBe(true);
    expect(canCoordinate('ADMIN')).toBe(true);
    expect(canCoordinate('AGENT')).toBe(false);
  });

  it('quem administra também coordena', () => {
    // Não é hierarquia embutida: é a conferência de que as duas listas não se
    // contradizem, que é o erro fácil de cometer ao editar uma delas.
    for (const role of ['ADMIN', 'COORDINATOR', 'AGENT'] as const) {
      if (isAdmin(role)) expect(canCoordinate(role)).toBe(true);
    }
  });
});
