import { describe, expect, it } from 'vitest';
import { PRIORITY_TONE, STATUS_TONE, URGENT_PRIORITIES } from './display';
import { labelFor } from '@/lib/enum-label';

/**
 * As enumerações do portal são tipos, não listas em tempo de execução — não há
 * como iterar `ReportStatus`. Estas listas existem só para este teste, e o
 * `Record` sem opcionais em `display.ts` é o que garante o outro sentido: dar um
 * valor novo à enumeração sem lhe dar tom **não compila**.
 */
const TODAS_AS_SITUACOES = [
  'RECEIVED',
  'TRIAGE',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED',
  'CANCELLED',
] as const;

const TODAS_AS_PRIORIDADES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

describe('tons de situação e prioridade', () => {
  it('nenhuma situação fica sem tom', () => {
    for (const status of TODAS_AS_SITUACOES) {
      expect(STATUS_TONE[status]).toBeDefined();
    }
    expect(Object.keys(STATUS_TONE)).toHaveLength(TODAS_AS_SITUACOES.length);
  });

  it('nenhuma prioridade fica sem tom', () => {
    for (const priority of TODAS_AS_PRIORIDADES) {
      expect(PRIORITY_TONE[priority]).toBeDefined();
    }
    expect(Object.keys(PRIORITY_TONE)).toHaveLength(TODAS_AS_PRIORIDADES.length);
  });

  it('destaca as duas prioridades mais urgentes, da maior para a menor', () => {
    expect(URGENT_PRIORITIES).toEqual(['CRITICAL', 'HIGH']);
  });
});

describe('labelFor', () => {
  const opcoes = [
    { value: 'RECEIVED', label: 'Recebida' },
    { value: 'TRIAGE', label: 'Em triagem' },
  ] as const;

  it('traduz o valor da API para o rótulo em pt-BR', () => {
    expect(labelFor(opcoes, 'TRIAGE')).toBe('Em triagem');
  });

  /**
   * O agente nunca deve ver `IN_PROGRESS` na tela (RF-OP-57). Quando falta o
   * rótulo, o que falta é na API — e a marca torna a falta visível em vez de
   * disfarçá-la com o valor em inglês.
   */
  it('nunca devolve o valor em inglês quando falta o rótulo', () => {
    expect(labelFor(opcoes, 'IN_PROGRESS' as 'RECEIVED')).toBe('—');
  });

  it('trata ausência de valor sem quebrar', () => {
    expect(labelFor(opcoes, null)).toBe('—');
    expect(labelFor(opcoes, undefined)).toBe('—');
    expect(labelFor([], 'RECEIVED')).toBe('—');
  });

  it('aceita um texto próprio para a ausência', () => {
    expect(labelFor(opcoes, null, 'Sem triagem')).toBe('Sem triagem');
  });
});
