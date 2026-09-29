import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/** Corpo de erro padrão da API, referenciado pelas respostas acrescentadas abaixo. */
const ERROR_SCHEMA = {
  type: 'object',
  properties: {
    statusCode: { type: 'number' },
    message: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
    error: { type: 'string' },
  },
} as const;

const RESPOSTAS_TRANSVERSAIS = {
  400: 'Dados inválidos',
  401: 'Token ausente ou inválido',
  500: 'Erro interno',
} as const;

/**
 * Monta o documento OpenAPI.
 *
 * Os códigos transversais — `400` em toda rota com corpo, `401` em toda rota
 * autenticada e `500` em todas — são acrescentados aqui, em vez de repetidos em
 * decoradores nos 27 endpoints. Repetir convidaria ao esquecimento: uma rota nova
 * nasceria sem eles e ninguém notaria (RNF-API-38).
 */
export function buildSwaggerDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('SISDEC — Sistema Integrado da Defesa Civil')
    .setDescription(
      'API de registro e acompanhamento de reclamações, sugestões e comunicações de risco à Defesa Civil.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  for (const operations of Object.values(document.paths)) {
    for (const [method, operation] of Object.entries(operations)) {
      if (!isOperation(method, operation)) {
        continue;
      }

      const temCorpo = method === 'post' || method === 'patch' || method === 'put';
      const exigeToken = Array.isArray(operation.security) && operation.security.length > 0;

      for (const [codigo, descricao] of Object.entries(RESPOSTAS_TRANSVERSAIS)) {
        if (codigo === '400' && !temCorpo) continue;
        if (codigo === '401' && !exigeToken) continue;
        // Uma descrição específica já declarada na rota tem precedência.
        if (operation.responses[codigo]) continue;

        operation.responses[codigo] = {
          description: descricao,
          content: { 'application/json': { schema: ERROR_SCHEMA } },
        };
      }
    }
  }

  return document;
}

function isOperation(
  method: string,
  value: unknown,
): value is { responses: Record<string, unknown>; security?: unknown[] } {
  return (
    ['get', 'post', 'patch', 'put', 'delete'].includes(method) &&
    typeof value === 'object' &&
    value !== null &&
    'responses' in value
  );
}
