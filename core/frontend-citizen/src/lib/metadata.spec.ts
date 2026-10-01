import { describe, expect, it } from 'vitest';
import { labelOf, urgentTypes } from './metadata';
import type { PublicMetadata } from '@/types/metadata';

const METADATA: PublicMetadata = {
  reportTypes: [
    { value: 'FLOODING', label: 'Alagamento ou enchente', urgent: false },
    { value: 'FIRE', label: 'Incêndio em edificação', urgent: true },
    { value: 'LANDSLIDE', label: 'Deslizamento de terra', urgent: true },
  ],
  reportCategories: [
    { value: 'COMPLAINT', label: 'Reclamação' },
    { value: 'RISK_ALERT', label: 'Comunicação de risco' },
  ],
  reportStatuses: [
    { value: 'RECEIVED', label: 'Recebida' },
    { value: 'IN_PROGRESS', label: 'Em atendimento' },
  ],
  upload: { maxFiles: 5, maxSizeMb: 10, acceptedMimeTypes: ['image/jpeg'] },
};

describe('labelOf', () => {
  it('devolve o rótulo em pt-BR servido pela API', () => {
    expect(labelOf(METADATA.reportStatuses, 'IN_PROGRESS')).toBe('Em atendimento');
    expect(labelOf(METADATA.reportCategories, 'RISK_ALERT')).toBe('Comunicação de risco');
  });

  it('cai no próprio valor quando a API não conhece o termo', () => {
    // Acontece se a API ganhar um valor novo e o portal estiver com metadados
    // em cache. Melhor exibir o valor cru do que uma célula vazia.
    expect(labelOf(METADATA.reportStatuses, 'INVENTADO' as 'RECEIVED')).toBe('INVENTADO');
  });

  it('devolve texto vazio para ausência de valor, sem lançar', () => {
    expect(labelOf(METADATA.reportStatuses, null)).toBe('');
    expect(labelOf(METADATA.reportStatuses, undefined)).toBe('');
  });
});

describe('urgentTypes', () => {
  it('seleciona só os tipos marcados pela API, preservando a ordem', () => {
    expect(urgentTypes(METADATA).map((t) => t.value)).toEqual(['FIRE', 'LANDSLIDE']);
  });

  it('não decide urgência por conta própria', () => {
    const semUrgentes: PublicMetadata = {
      ...METADATA,
      reportTypes: METADATA.reportTypes.map((t) => ({ ...t, urgent: false })),
    };

    expect(urgentTypes(semUrgentes)).toEqual([]);
  });
});
