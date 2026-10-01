import { describe, expect, it } from 'vitest';
import { ApiError, apiErrorFromBody, apiErrorFromTransport, kindForStatus, userMessageFor } from './api-error';

describe('kindForStatus', () => {
  it('traduz os códigos que a API devolve', () => {
    expect(kindForStatus(400)).toBe('validation');
    expect(kindForStatus(404)).toBe('notFound');
    expect(kindForStatus(409)).toBe('conflict');
    expect(kindForStatus(429)).toBe('rateLimit');
    expect(kindForStatus(503)).toBe('unavailable');
  });

  it('trata qualquer outro código como falha do servidor', () => {
    expect(kindForStatus(500)).toBe('server');
    expect(kindForStatus(418)).toBe('server');
  });
});

describe('apiErrorFromBody', () => {
  it('guarda as mensagens de validação para o formulário apontar o campo', () => {
    const erro = apiErrorFromBody(400, {
      statusCode: 400,
      message: ['description não pode ser vazio', 'district não pode ser vazio'],
      error: 'Bad Request',
    });

    expect(erro.kind).toBe('validation');
    expect(erro.details).toHaveLength(2);
  });

  it('não mostra ao cidadão o nome de campo em inglês vindo da API', () => {
    const erro = apiErrorFromBody(400, {
      statusCode: 400,
      message: ['description não pode ser vazio'],
      error: 'Bad Request',
    });

    expect(erro.message).not.toContain('description');
    expect(erro.message).toMatch(/confira/i);
  });

  it('nenhuma mensagem exibida cita código de status ou jargão', () => {
    for (const status of [400, 404, 409, 429, 500, 503]) {
      const { message } = apiErrorFromBody(status, null);

      expect(message).not.toMatch(/\b[45]\d{2}\b/);
      expect(message).not.toMatch(/API|HTTP|servidor interno|stack/i);
      expect(message.length).toBeGreaterThan(20);
    }
  });

  it('repete os telefones de emergência quando o serviço está fora do ar', () => {
    expect(apiErrorFromBody(503, null).message).toContain('199');
    expect(apiErrorFromBody(503, null).message).toContain('193');
  });

  it('aguenta corpo que não é o envelope esperado', () => {
    for (const corpo of [null, 'texto solto', 42, {}, { message: null }]) {
      expect(() => apiErrorFromBody(500, corpo)).not.toThrow();
      expect(apiErrorFromBody(500, corpo).details).toEqual([]);
    }
  });

  it('aceita message em texto, não só em lista', () => {
    const erro = apiErrorFromBody(404, {
      statusCode: 404,
      message: 'Nenhuma ocorrência encontrada',
      error: 'Not Found',
    });

    expect(erro.details).toEqual(['Nenhuma ocorrência encontrada']);
  });
});

describe('apiErrorFromTransport', () => {
  it('distingue tempo esgotado de falha de rede', () => {
    const tempo = new Error('demorou');
    tempo.name = 'TimeoutError';

    expect(apiErrorFromTransport(tempo).kind).toBe('timeout');
    expect(apiErrorFromTransport(new Error('ECONNREFUSED')).kind).toBe('network');
  });

  it('orienta a conferir a conexão, que é a causa provável no celular', () => {
    expect(apiErrorFromTransport(new Error('x')).message).toMatch(/conex/i);
  });

  it('lembra os telefones de emergência quando não há conexão', () => {
    expect(apiErrorFromTransport(new Error('x')).message).toContain('199');
  });
});

describe('userMessageFor', () => {
  it('usa a mensagem da falha quando é um ApiError', () => {
    expect(userMessageFor(new ApiError(404, 'notFound', 'Não encontramos.'))).toBe(
      'Não encontramos.',
    );
  });

  it('nunca repassa a mensagem de um erro desconhecido', () => {
    const vazamento = new Error('Prisma: connect ECONNREFUSED 127.0.0.1:5432');

    const texto = userMessageFor(vazamento);
    expect(texto).not.toContain('Prisma');
    expect(texto).not.toContain('5432');
  });

  it('devolve texto também para valor que não é erro', () => {
    for (const valor of [undefined, null, 'string', { a: 1 }]) {
      expect(userMessageFor(valor).length).toBeGreaterThan(20);
    }
  });
});
