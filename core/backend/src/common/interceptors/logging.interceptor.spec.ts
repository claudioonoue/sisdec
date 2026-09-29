import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor.js';

function contexto(url: string, method = 'GET', statusCode = 200) {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => ({ method, url, body: { password: 'nao-deve-aparecer' } }),
      getResponse: () => ({ statusCode }),
    }),
  } as never;
}

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let registrado: string[];

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    registrado = [];
    vi.spyOn(Logger.prototype, 'log').mockImplementation((msg: unknown) => {
      registrado.push(String(msg));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registra método, rota, código e duração (RNF-API-39)', async () => {
    const handler = { handle: () => of('ok') };

    await new Promise((resolve) =>
      interceptor.intercept(contexto('/api/v1/health'), handler).subscribe(resolve),
    );

    expect(registrado[0]).toMatch(/^GET \/api\/v1\/health 200 — \d+ms$/);
  });

  it('registra também quando a requisição falha', async () => {
    const handler = { handle: () => throwError(() => new Error('falhou')) };

    await new Promise((resolve) =>
      interceptor
        .intercept(contexto('/api/v1/reports', 'POST', 500), handler)
        .subscribe({ error: resolve }),
    );

    expect(registrado[0]).toContain('POST /api/v1/reports');
  });

  it('não registra a query string, que pode carregar termo de busca (RNF-API-41)', async () => {
    const handler = { handle: () => of('ok') };

    await new Promise((resolve) =>
      interceptor
        .intercept(contexto('/api/v1/reports?search=Maria+Silva&assignedToId=abc'), handler)
        .subscribe(resolve),
    );

    expect(registrado[0]).not.toContain('Maria');
    expect(registrado[0]).not.toContain('search');
    expect(registrado[0]).toContain('/api/v1/reports ');
  });

  it('não registra o corpo da requisição, onde a senha viajaria', async () => {
    const handler = { handle: () => of('ok') };

    await new Promise((resolve) =>
      interceptor.intercept(contexto('/api/v1/auth/login', 'POST'), handler).subscribe(resolve),
    );

    expect(registrado.join('\n')).not.toContain('nao-deve-aparecer');
  });

  it('não interfere em contexto que não seja HTTP', async () => {
    const handler = { handle: () => of('valor') };
    const naoHttp = { getType: () => 'rpc' } as never;

    const resultado = await new Promise((resolve) =>
      interceptor.intercept(naoHttp, handler).subscribe(resolve),
    );

    expect(resultado).toBe('valor');
    expect(registrado).toHaveLength(0);
  });
});
