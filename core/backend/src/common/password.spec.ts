import { BCRYPT_COST, hashPassword, verifyPassword } from './password.js';

describe('password', () => {
  it('usa custo de no mínimo 10 (RNF-API-07)', () => {
    expect(BCRYPT_COST).toBeGreaterThanOrEqual(10);
  });

  it('gera hash bcrypt que não contém a senha em claro', async () => {
    const hash = await hashPassword('senha-do-agente');

    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(hash).not.toContain('senha-do-agente');
  });

  it('registra o custo configurado no próprio hash', async () => {
    expect(await hashPassword('x')).toContain(`$${BCRYPT_COST}$`);
  });

  it('gera hashes diferentes para a mesma senha (salt por hash)', async () => {
    expect(await hashPassword('igual')).not.toBe(await hashPassword('igual'));
  });

  it('confere a senha correta e recusa a errada', async () => {
    const hash = await hashPassword('senha-do-agente');

    await expect(verifyPassword('senha-do-agente', hash)).resolves.toBe(true);
    await expect(verifyPassword('outra-senha', hash)).resolves.toBe(false);
  });
});
