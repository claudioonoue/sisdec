# API REST

Contrato previsto para a API do SISDEC. Base: `http://localhost:3000/api/v1`.

> Proposta inicial — os endpoints serão confirmados durante a implementação.

## 1. Convenções

- Formato de entrada e saída: **JSON** (exceto o upload de anexos, `multipart/form-data`).
- Autenticação: cabeçalho `Authorization: Bearer <token>` (JWT).
- Datas em **ISO 8601 UTC**.
- Erros seguem o padrão do NestJS:

```json
{ "statusCode": 400, "message": ["description não pode ser vazio"], "error": "Bad Request" }
```

- Listagens são paginadas: `?page=1&pageSize=20`, com resposta
  `{ "data": [...], "total": 0, "page": 1, "pageSize": 20 }`.

## 2. Endpoints públicos (Portal do Cidadão)

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/reports` | Registra uma nova ocorrência e retorna o número de protocolo |
| `GET` | `/reports/protocol/:protocolNumber` | Consulta pública da situação e do histórico visível |
| `POST` | `/reports/:id/attachments` | Envia fotos da ocorrência |
| `GET` | `/report-types` | Lista os tipos de ocorrência disponíveis, com rótulo em pt-BR |

### Exemplo — `POST /reports`

```json
{
  "category": "RISK_ALERT",
  "type": "DANGEROUS_TREE",
  "description": "Árvore de grande porte inclinada sobre a calçada após a chuva.",
  "address": "Rua das Palmeiras, 120",
  "district": "Centro",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "citizen": { "name": "Maria Silva", "email": "maria@exemplo.com", "phone": "11999998888" }
}
```

Resposta `201`:

```json
{
  "id": "5f2c...",
  "protocolNumber": "SISDEC-2026-000142",
  "status": "RECEIVED",
  "createdAt": "2026-09-07T18:20:00Z"
}
```

O objeto `citizen` é opcional — quando ausente, a ocorrência é registrada como anônima.

### Exemplo — `GET /report-types`

Os frontends nunca mantêm a lista de tipos fixa no código: eles a consomem deste endpoint,
que devolve o valor usado pela API junto do rótulo exibido ao usuário.

```json
[
  { "value": "FLOODING", "label": "Alagamento ou enchente", "urgent": false },
  { "value": "LANDSLIDE", "label": "Deslizamento de terra", "urgent": true },
  { "value": "FIRE", "label": "Incêndio em edificação", "urgent": true },
  { "value": "WILD_ANIMAL", "label": "Animal selvagem ou peçonhento", "urgent": false }
]
```

O campo `urgent` indica os tipos de risco imediato à vida — o Portal do Cidadão usa essa
marcação para reforçar o aviso de acionamento dos telefones de emergência, e a triagem no
Portal de Operações usa para sugerir prioridade alta.

### Exemplo — `POST /reports/:id/attachments`

Envio em `multipart/form-data`, campo `files`, até 5 arquivos por requisição.
Aceita `image/jpeg`, `image/png` e `image/webp`, com no máximo `MAX_UPLOAD_SIZE_MB` por
arquivo. A resposta traz a URL de leitura de cada anexo:

```json
[{ "id": "9a1b...", "fileName": "arvore.jpg", "url": "/api/v1/attachments/9a1b..." }]
```

A URL é sempre servida pela API — os frontends nunca acessam o disco nem um bucket
diretamente, o que mantém a troca de armazenamento invisível para eles.

## 3. Autenticação (Portal de Operações)

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/login` | Recebe `email` e `password`, devolve o token JWT |
| `GET` | `/auth/me` | Dados do agente autenticado |

## 4. Endpoints restritos (agentes autenticados)

### Ocorrências

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| `GET` | `/reports` | todos | Lista com filtros: `status`, `type`, `category`, `priority`, `district`, `assignedToId`, `from`, `to`, `search` |
| `GET` | `/reports/:id` | todos | Detalhe completo, com anexos e histórico |
| `PATCH` | `/reports/:id/triage` | coordenador, admin | Define `type`, `priority` e move para `IN_PROGRESS` |
| `PATCH` | `/reports/:id/assign` | coordenador, admin | Define o agente responsável |
| `PATCH` | `/reports/:id/status` | todos | Altera a situação e registra o andamento |
| `POST` | `/reports/:id/updates` | todos | Adiciona uma observação ao histórico |

### Agentes

| Método | Rota | Perfis |
|---|---|---|
| `GET` | `/agents` | admin |
| `POST` | `/agents` | admin |
| `PATCH` | `/agents/:id` | admin |
| `PATCH` | `/agents/:id/deactivate` | admin |

### Painel

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/dashboard/summary` | Totais por situação, prioridade e tipo |
| `GET` | `/dashboard/by-district` | Ocorrências agrupadas por bairro |
| `GET` | `/dashboard/timeline` | Volume de registros por período |

## 5. Códigos de resposta

| Código | Situação |
|---|---|
| `200` | Requisição bem-sucedida |
| `201` | Recurso criado |
| `400` | Dados inválidos |
| `401` | Token ausente ou inválido |
| `403` | Perfil sem permissão para a operação |
| `404` | Recurso ou protocolo não encontrado |
| `409` | Conflito (ex.: e-mail de agente já cadastrado) |
| `500` | Erro interno |

## 6. Documentação interativa

A API exporá **Swagger** em `http://localhost:3000/api/docs` via `@nestjs/swagger`.
