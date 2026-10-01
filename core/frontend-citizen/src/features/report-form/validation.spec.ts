import { describe, expect, it } from 'vitest';
import { emptyDraft, type ReportDraft } from './draft';
import { firstInvalidStep, isStepValid, validateStep } from './validation';

function draft(extra: Partial<ReportDraft> = {}): ReportDraft {
  return { ...emptyDraft, ...extra };
}

/** Rascunho completo e válido, base dos testes de etapa. */
const COMPLETO = draft({
  category: 'RISK_ALERT',
  type: 'DANGEROUS_TREE',
  address: 'Rua das Palmeiras, 120, em frente à praça',
  district: 'Centro',
  description: 'Árvore inclinada sobre a calçada depois da chuva de ontem.',
  anonymous: true,
});

describe('etapa 1 — o que aconteceu', () => {
  it('exige categoria e tipo', () => {
    expect(validateStep(0, draft())).toEqual({
      category: expect.any(String),
      type: expect.any(String),
    });
  });

  it('aceita quando ambos estão escolhidos', () => {
    expect(isStepValid(0, COMPLETO)).toBe(true);
  });

  it('não exige nada além disso na primeira etapa', () => {
    expect(isStepValid(0, draft({ category: 'COMPLAINT', type: 'OTHER' }))).toBe(true);
  });
});

describe('etapa 2 — onde foi', () => {
  it('exige endereço e bairro', () => {
    expect(Object.keys(validateStep(1, draft())).sort()).toEqual(['address', 'district']);
  });

  it('recusa campo só com espaços', () => {
    expect(isStepValid(1, draft({ address: '   ', district: '  ' }))).toBe(false);
  });

  it('não exige coordenadas — o ponto no mapa é complementar (RF-CID-13)', () => {
    expect(isStepValid(1, draft({ address: 'Rua X, 1', district: 'Centro' }))).toBe(true);
  });
});

describe('etapa 3 — detalhes', () => {
  it('exige a descrição', () => {
    expect(validateStep(2, draft())).toHaveProperty('description');
  });

  it('pede mais texto quando o relato é curto demais', () => {
    expect(validateStep(2, draft({ description: 'caiu' })).description).toMatch(/ao menos/);
  });

  it('aceita a partir do mínimo que a API aceita', () => {
    expect(isStepValid(2, draft({ description: '1234567890' }))).toBe(true);
  });

  it('recusa relato acima do limite', () => {
    expect(validateStep(2, draft({ description: 'a'.repeat(5001) })).description).toMatch(/longo/);
  });

  it('não conta espaços nas pontas como conteúdo', () => {
    expect(isStepValid(2, draft({ description: `   ${'a'.repeat(9)}   ` }))).toBe(false);
  });
});

describe('etapa 4 — seus dados', () => {
  it('aceita a etapa inteira vazia: identificar-se é opcional (RF-CID-17)', () => {
    expect(isStepValid(3, draft())).toBe(true);
  });

  it('aceita quem escolheu não se identificar, ignorando o que foi digitado', () => {
    expect(isStepValid(3, draft({ anonymous: true, email: 'nao-e-email' }))).toBe(true);
  });

  it('exige o nome quando a pessoa deixa algum contato', () => {
    expect(validateStep(3, draft({ email: 'maria@exemplo.com' }))).toHaveProperty('name');
    expect(validateStep(3, draft({ phone: '11999998888' }))).toHaveProperty('name');
  });

  it('aceita nome sozinho, sem contato', () => {
    expect(isStepValid(3, draft({ name: 'Maria Silva' }))).toBe(true);
  });

  it('recusa e-mail malformado', () => {
    for (const email of ['maria', 'maria@', '@exemplo.com', 'maria@exemplo']) {
      expect(validateStep(3, draft({ name: 'Maria', email }))).toHaveProperty('email');
    }
  });

  it('aceita e-mail válido', () => {
    expect(isStepValid(3, draft({ name: 'Maria', email: 'maria@exemplo.com' }))).toBe(true);
  });

  it('aceita telefone com DDD, com ou sem pontuação', () => {
    for (const phone of ['11999998888', '(11) 99999-8888', '+55 11 99999-8888']) {
      expect(isStepValid(3, draft({ name: 'Maria', phone }))).toBe(true);
    }
  });

  it('recusa telefone curto demais ou com letras', () => {
    for (const phone of ['1199', 'nao-tenho']) {
      expect(validateStep(3, draft({ name: 'Maria', phone }))).toHaveProperty('phone');
    }
  });
});

describe('etapa 5 — revisão', () => {
  it('não acrescenta validação própria', () => {
    expect(validateStep(4, COMPLETO)).toEqual({});
  });
});

describe('firstInvalidStep', () => {
  it('devolve null quando tudo está válido', () => {
    expect(firstInvalidStep(COMPLETO)).toBeNull();
  });

  it('aponta a primeira etapa pendente, não a última', () => {
    expect(firstInvalidStep(draft())).toBe(0);
    expect(firstInvalidStep({ ...COMPLETO, address: '' })).toBe(1);
    expect(firstInvalidStep({ ...COMPLETO, description: '' })).toBe(2);
  });

  it('pega o campo apagado depois de a pessoa voltar uma etapa', () => {
    // O cenário que o `isStepValid` da etapa atual não cobriria: preencher tudo,
    // voltar à etapa 2, apagar o bairro e tentar enviar da revisão.
    expect(firstInvalidStep({ ...COMPLETO, district: '' })).toBe(1);
  });

  it('considera a etapa de contato quando o nome foi apagado', () => {
    expect(
      firstInvalidStep({ ...COMPLETO, anonymous: false, name: '', email: 'maria@exemplo.com' }),
    ).toBe(3);
  });
});

describe('índice de etapa fora da faixa', () => {
  it('não lança', () => {
    expect(validateStep(99, draft())).toEqual({});
    expect(validateStep(-1, draft())).toEqual({});
  });
});
