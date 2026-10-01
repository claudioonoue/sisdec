import { describe, expect, it } from 'vitest';
import { EMERGENCY_NOTICE, EMERGENCY_PHONES } from './emergency';

/**
 * Os telefones aparecem em várias telas e em mensagens de erro. Um número
 * divergente em qualquer uma delas é um defeito grave — alguém pode ligar.
 */
describe('telefones de emergência', () => {
  it('traz os dois números previstos pelo requisito (RF-CID-02)', () => {
    expect(EMERGENCY_PHONES.map((p) => p.number)).toEqual(['199', '193']);
  });

  it('nomeia quem atende cada número', () => {
    expect(EMERGENCY_PHONES.find((p) => p.number === '199')?.who).toBe('Defesa Civil');
    expect(EMERGENCY_PHONES.find((p) => p.number === '193')?.who).toBe('Bombeiros');
  });

  it('o valor de discagem não tem espaço nem pontuação, para o link tel: funcionar', () => {
    for (const phone of EMERGENCY_PHONES) {
      expect(phone.dial).toMatch(/^\d+$/);
      expect(phone.dial).toBe(phone.number);
    }
  });

  it('o aviso curto cita os dois números e diz que não substitui a emergência', () => {
    expect(EMERGENCY_NOTICE).toContain('199');
    expect(EMERGENCY_NOTICE).toContain('193');
    expect(EMERGENCY_NOTICE).toMatch(/não substitui/i);
  });
});
