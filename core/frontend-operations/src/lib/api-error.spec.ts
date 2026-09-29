import { describe, expect, it } from 'vitest';
import {
  ApiError,
  apiErrorFromBody,
  apiErrorFromTransport,
  kindForStatus,
  userMessageFor,
} from './api-error';

/**
 * Toda falha que chega ao agente passa por aqui. O `RNF-OP-05` pede pt-BR sem
 * código técnico, e o `RNF-OP-25` proíbe tela de erro técnico ou página em
 * branco — o que significa que **nenhuma** entrada pode escapar sem mensagem.
 */
describe('kindForStatus', () => {
  it('traduz os códigos do contrato para o vocabulário do portal', () => {
    expect(kindForStatus(400)).toBe('validation');
    expect(kindForStatus(401)).toBe('authentication');
    expect(kindForStatus(403)).toBe('permission');
    expect(kindForStatus(404)).toBe('notFound');
    expect(kindForStatus(409)).toBe('conflict');
    expect(kindForStatus(429)).toBe('rateLimit');
    expect(kindForStatus(503)).toBe('unavailable');
  });

  it('trata código desconhecido como erro do sistema, e não como sucesso', () => {
    expect(kindForStatus(418)).toBe('server');
    expect(kindForStatus(500)).toBe('server');
  });
});

describe('apiErrorFromBody', () => {
  it('aproveita as mensagens de validação da API, que são mais precisas', () => {
    const error = apiErrorFromBody(400, {
      statusCode: 400,
      message: ['district não pode ser vazio'],
    });

    expect(error.kind).toBe('validation');
    expect(error.details).toEqual(['district não pode ser vazio']);
    expect(error.message).toContain('district');
  });

  it('não repassa a mensagem de 401, que é do login e não da tela', () => {
    const error = apiErrorFromBody(401, { statusCode: 401, message: 'Unauthorized' });

    expect(error.message).not.toContain('Unauthorized');
    expect(error.message).toContain('sessão');
  });

  it('dá mensagem mesmo quando o corpo não é o envelope esperado', () => {
    // Um proxy no meio pode devolver HTML; a falha não pode ficar sem texto.
    for (const corpo of [null, undefined, '<html>502</html>', {}, { message: [] }]) {
      const error = apiErrorFromBody(502, corpo);
      expect(error.message.length).toBeGreaterThan(0);
    }
  });
});

describe('apiErrorFromTransport', () => {
  it('distingue tempo esgotado de falha de rede', () => {
    const timeout = new Error('demorou');
    timeout.name = 'TimeoutError';

    expect(apiErrorFromTransport(timeout).kind).toBe('timeout');
    expect(apiErrorFromTransport(new TypeError('fetch failed')).kind).toBe('network');
  });

  it('diz que a API não respondeu, em vez de nomear a exceção', () => {
    expect(apiErrorFromTransport(new TypeError('fetch failed')).message).toContain('API do SISDEC');
  });
});

describe('userMessageFor', () => {
  it('dá mensagem para qualquer coisa, inclusive o que não é ApiError', () => {
    for (const qualquer of [new Error('interno'), 'texto solto', null, undefined, 42]) {
      expect(userMessageFor(qualquer).length).toBeGreaterThan(0);
    }
  });

  it('não vaza detalhe interno de erro que não veio da API', () => {
    expect(userMessageFor(new Error('Cannot read properties of undefined'))).not.toContain(
      'undefined',
    );
  });

  it('usa a mensagem já traduzida quando a falha veio da API', () => {
    const error = new ApiError(409, 'conflict', 'Mensagem de conflito.');
    expect(userMessageFor(error)).toBe('Mensagem de conflito.');
  });
});
