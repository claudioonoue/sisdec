import { BadRequestException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

function contexto(url = '/api/v1/reports', method = 'POST') {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });

  return {
    host: {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url, method }),
      }),
    } as never,
    status,
    json,
  };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('preserva a mensagem em lista do ValidationPipe (RF-API-58)', () => {
    const { host, status, json } = contexto();

    filter.catch(new BadRequestException(['description não pode ser vazio']), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: ['description não pode ser vazio'],
      error: 'Bad Request',
    });
  });

  it('mantém o formato para exceção com mensagem simples', () => {
    const { host, json } = contexto();

    filter.catch(new NotFoundException('Ocorrência não encontrada'), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, message: 'Ocorrência não encontrada' }),
    );
  });

  it('respeita o código de qualquer HttpException', () => {
    const { host, status } = contexto();

    filter.catch(new HttpException('Limite excedido', HttpStatus.TOO_MANY_REQUESTS), host);

    expect(status).toHaveBeenCalledWith(429);
  });

  it('converte erro não previsto em 500 genérico, sem vazar o detalhe (RNF-API-17)', () => {
    const { host, status, json } = contexto();

    filter.catch(new Error('conexão com o banco falhou em pg://user:senha@host'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Erro interno do servidor',
      error: 'Internal Server Error',
    });

    const corpo = JSON.stringify(json.mock.calls[0][0]);
    expect(corpo).not.toContain('senha');
    expect(corpo).not.toContain('pg://');
  });

  it('não quebra com valor lançado que não é Error', () => {
    const { host, status } = contexto();

    expect(() => filter.catch('string solta', host)).not.toThrow();
    expect(status).toHaveBeenCalledWith(500);
  });

  it('toda resposta sai com as três chaves do contrato', () => {
    for (const erro of [new BadRequestException('x'), new Error('y')]) {
      const { host, json } = contexto();
      filter.catch(erro, host);

      expect(Object.keys(json.mock.calls[0][0]).sort()).toEqual([
        'error',
        'message',
        'statusCode',
      ]);
    }
  });
});
