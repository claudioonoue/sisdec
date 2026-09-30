import { describe, expect, it } from 'vitest';
import {
  NO_PRIORITY_SHAPE,
  PRIORITIES_BY_URGENCY,
  PRIORITY_SHAPE,
  PRIORITY_TONE,
} from './display';

/**
 * A forma do marcador existe porque **a cor sozinha não basta**: medidas com o
 * validador de paleta, as cores de crítica e alta ficam a ΔE 2,8 para
 * deuteranopia, e num mapa não há rótulo ao lado de cada ponto para desempatar.
 *
 * Se alguém um dia der a mesma forma a duas prioridades — por descuido ao
 * acrescentar uma quinta —, a segunda pista deixa de existir em silêncio, e o
 * mapa volta a depender só da cor. É isso que estes testes impedem.
 */
describe('formas do marcador por prioridade', () => {
  it('dá forma a toda prioridade', () => {
    for (const priority of PRIORITIES_BY_URGENCY) {
      expect(PRIORITY_SHAPE[priority]).toBeDefined();
    }
  });

  it('não repete forma entre prioridades', () => {
    const formas = PRIORITIES_BY_URGENCY.map((p) => PRIORITY_SHAPE[p]);

    expect(new Set(formas).size).toBe(formas.length);
  });

  it('distingue a ocorrência sem triagem de todas as prioridades', () => {
    const formas = PRIORITIES_BY_URGENCY.map((p) => PRIORITY_SHAPE[p]);

    expect(formas).not.toContain(NO_PRIORITY_SHAPE);
  });

  it('lista as prioridades da mais urgente para a menos urgente', () => {
    // A legenda segue esta ordem; uma ordem arbitrária atrapalharia a leitura.
    expect(PRIORITIES_BY_URGENCY).toEqual(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
  });

  it('mantém a cor coerente com o crachá da lista e do detalhe', () => {
    // O mesmo tom no mapa e nos crachás: o ponto e a linha da lista precisam
    // ser reconhecíveis como a mesma ocorrência.
    expect(PRIORITY_TONE.CRITICAL).toBe('danger');
    expect(PRIORITY_TONE.LOW).toBe('neutral');
  });
});
