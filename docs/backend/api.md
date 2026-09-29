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
  `pageSize` tem valor padrão **20** e **máximo 100** — valores acima do teto são recusados
  com `400`.

## 2. Endpoints públicos (Portal do Cidadão)

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/reports` | Registra uma nova ocorrência e retorna o número de protocolo |
| `GET` | `/reports/protocol/:protocolNumber` | Consulta pública da situação e do histórico visível |
| `POST` | `/reports/:id/attachments` | Envia fotos da ocorrência |
| `GET` | `/metadata` | Enumerações públicas com rótulo em pt-BR e limites de upload |
| `GET` | `/report-types` | Atalho para `metadata.reportTypes` |
| `GET` | `/attachments/:id` | Devolve o conteúdo do anexo, com o `Content-Type` correspondente |

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

### Exemplo — `GET /reports/protocol/:protocolNumber`

Consulta pública. Devolve a situação e o histórico visível, **sem nenhum dado pessoal do
cidadão** e sem identificar os agentes envolvidos:

```json
{
  "protocolNumber": "SISDEC-2026-000142",
  "category": "RISK_ALERT",
  "type": "DANGEROUS_TREE",
  "status": "IN_PROGRESS",
  "district": "Centro",
  "createdAt": "2026-09-07T18:20:00Z",
  "resolvedAt": null,
  "updates": [
    {
      "toStatus": "IN_PROGRESS",
      "comment": "Equipe acionada para vistoria no local.",
      "createdAt": "2026-09-08T09:10:00Z"
    }
  ],
  "attachments": [{ "id": "9a1b...", "url": "/api/v1/attachments/9a1b..." }]
}
```

Os campos `description`, `address`, `latitude`, `longitude`, `citizen` e `assignedTo`
**não** são devolvidos nesta rota, por serem capazes de identificar quem registrou a
ocorrência. `priority` também não: é uma classificação operacional interna, atribuída na
triagem, e expô-la ao público convida à contestação do critério. Em `updates` aparecem somente os andamentos com `visibleToCitizen = true`, e
apenas com a situação, o comentário e a data — nunca o agente autor.

### Exemplo — `GET /metadata`

Os frontends **nunca** mantêm enumerações fixas no código: eles as consomem deste endpoint,
que devolve o valor usado pela API junto do rótulo exibido ao usuário. É o que permite
acrescentar um tipo de ocorrência sem alterar os portais.

```json
{
  "reportTypes": [
    { "value": "FLOODING", "label": "Alagamento ou enchente", "urgent": false },
    { "value": "LANDSLIDE", "label": "Deslizamento de terra", "urgent": true },
    { "value": "FIRE", "label": "Incêndio em edificação", "urgent": true },
    { "value": "WILD_ANIMAL", "label": "Animal selvagem ou peçonhento", "urgent": false }
  ],
  "reportCategories": [
    { "value": "COMPLAINT", "label": "Reclamação" },
    { "value": "SUGGESTION", "label": "Sugestão" },
    { "value": "REQUEST", "label": "Solicitação" },
    { "value": "RISK_ALERT", "label": "Comunicação de risco" }
  ],
  "reportStatuses": [
    { "value": "RECEIVED", "label": "Recebida" },
    { "value": "TRIAGE", "label": "Em triagem" },
    { "value": "IN_PROGRESS", "label": "Em atendimento" },
    { "value": "RESOLVED", "label": "Resolvida" },
    { "value": "REJECTED", "label": "Improcedente" },
    { "value": "CANCELLED", "label": "Cancelada" }
  ],
  "upload": {
    "maxFiles": 5,
    "maxSizeMb": 10,
    "acceptedMimeTypes": ["image/jpeg", "image/png", "image/webp"]
  }
}
```

O campo `urgent` indica os tipos de risco imediato à vida — o Portal do Cidadão usa essa
marcação para reforçar o aviso de acionamento dos telefones de emergência, e a triagem no
Portal de Operações usa para sugerir prioridade alta.

O bloco `upload` reflete `MAX_UPLOAD_SIZE_MB` e os formatos aceitos pela API, de modo que os
portais validem o arquivo antes do envio **sem duplicar essas constantes** no seu código.

`reportStatuses` é público porque o Portal do Cidadão precisa rotular a situação na consulta
por protocolo. `priorities` e `agentRoles` **não** estão aqui: são enumerações de uso interno
e ficam em `GET /metadata/internal` (seção 4).

`GET /report-types` permanece como atalho, devolvendo apenas o conteúdo de
`metadata.reportTypes`.

### Exemplo — `POST /reports/:id/attachments`

Envio em `multipart/form-data`, campo `files`, até 5 arquivos por requisição.
Aceita `image/jpeg`, `image/png` e `image/webp`, com no máximo `MAX_UPLOAD_SIZE_MB` por
arquivo. A resposta traz a URL de leitura de cada anexo:

```json
[{ "id": "9a1b...", "fileName": "arvore.jpg", "url": "/api/v1/attachments/9a1b..." }]
```

A URL é sempre servida pela API — os frontends nunca acessam o disco nem um bucket
diretamente, o que mantém a troca de armazenamento invisível para eles.

O envio só é aceito enquanto a ocorrência está em `status = RECEIVED`, isto é, na janela
entre o registro e o início da triagem. Depois disso a rota responde `409`: sem essa
restrição, qualquer pessoa que conhecesse o `id` poderia anexar arquivos a uma ocorrência de
terceiros indefinidamente, inclusive já concluída. Anexos posteriores são incumbência do
agente, pelo histórico de andamentos.

`GET /attachments/:id` não exige autenticação, porque o Portal do Cidadão exibe as fotos na
consulta por protocolo. A proteção é o `id` ser um UUID não enumerável.

## 3. Autenticação (Portal de Operações)

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/login` | Recebe `email` e `password`, devolve o token JWT |
| `GET` | `/auth/me` | Dados do agente autenticado |

### Exemplo — `GET /auth/me`

```json
{
  "id": "7c3d...",
  "name": "Ana Souza",
  "email": "ana@exemplo.gov.br",
  "role": "COORDINATOR"
}
```

O `passwordHash` nunca é devolvido por nenhuma rota da API.

## 4. Endpoints restritos (agentes autenticados)

### Ocorrências

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| `GET` | `/reports` | todos | Lista com filtros: `status`, `type`, `category`, `priority`, `district`, `assignedToId`, `from`, `to`, `search`; ordenação por `sort` e `order` |
| `GET` | `/reports/:id` | todos | Detalhe completo, com anexos e histórico |
| `GET` | `/reports/map` | todos | Ocorrências com coordenadas, em formato enxuto e **sem paginação**, para plotagem no mapa |
| `GET` | `/reports/export` | coordenador, admin | Exporta em **CSV** a lista filtrada, sem paginação |
| `PATCH` | `/reports/:id/triage/start` | coordenador, admin | Assume a triagem: `RECEIVED → TRIAGE` |
| `PATCH` | `/reports/:id/triage` | coordenador, admin | Conclui a triagem: define `type` e `priority` e, conforme `outcome`, move para `IN_PROGRESS` ou `REJECTED` |
| `PATCH` | `/reports/:id/assign` | coordenador, admin | Define o agente responsável |
| `PATCH` | `/reports/:id/status` | responsável, coordenador, admin | Altera a situação e registra o andamento |
| `POST` | `/reports/:id/updates` | todos | Adiciona uma observação ao histórico |
| `GET` | `/reports/assignable-agents` | coordenador, admin | Agentes ativos (`id` e `name`) disponíveis para atribuição |

### Ordenação de `GET /reports`

```
?sort=createdAt|priority   padrão: createdAt
?order=asc|desc            padrão: desc
```

A ordenação é do **banco**, não do portal: a listagem é paginada, e ordenar a página corrente
reordenaria vinte linhas em vez da lista (`RNF-OP-20`). Os campos aceitos são uma lista
branca — os dois que o `RF-OP-19` pede, e que `RNF-API-04` mantém indexados; qualquer outro
valor responde `400`.

Duas garantias do resultado:

- as ocorrências **sem prioridade** ficam por último nas duas direções. Prioridade nula é
  ausência de classificação — a ocorrência ainda não passou pela triagem —, e não a prioridade
  mais baixa;
- a ordem fecha sempre por um campo único, de modo que empates não mudem de posição entre uma
  consulta e outra, o que faria a paginação repetir e pular registros.

### Exemplo — `GET /reports/map`

Aceita os mesmos filtros de `GET /reports` e devolve apenas o necessário para plotar o ponto,
**sem paginação** — o teto de `pageSize` (100) impediria exibir o mapa completo:

```json
{
  "data": [
    {
      "id": "5f2c...",
      "protocolNumber": "SISDEC-2026-000142",
      "type": "DANGEROUS_TREE",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "latitude": -23.5505,
      "longitude": -46.6333
    }
  ],
  "total": 1,
  "omittedWithoutCoordinates": 3,
  "truncated": false
}
```

- sem filtro de situação, devolve apenas as ocorrências **abertas** (`RECEIVED`, `TRIAGE`,
  `IN_PROGRESS`);
- ocorrências sem coordenadas não entram em `data` e são contadas em
  `omittedWithoutCoordinates`, para que o portal possa informar quantas ficaram de fora;
- o resultado é limitado a **500** registros; ao atingir o teto, `truncated` vem `true` e o
  portal orienta o agente a estreitar os filtros.

### Exemplo — `GET /reports/export`

Aceita os mesmos filtros de `GET /reports` e responde `text/csv` com
`Content-Disposition: attachment`, uma linha por ocorrência e cabeçalho em pt-BR. Existe para
que a exportação **não** seja montada no navegador a partir de páginas sucessivas da listagem.

### Exemplo — triagem em duas etapas

A triagem é modelada em duas ações porque `TRIAGE` é um **estado real**: ele sinaliza que um
coordenador já assumiu a análise, evitando que dois profissionais triem a mesma ocorrência, e
é o estado a partir do qual a improcedência pode ser declarada.

```
PATCH /reports/:id/triage/start     →  RECEIVED → TRIAGE     (sem corpo)
PATCH /reports/:id/triage           →  TRIAGE → IN_PROGRESS | REJECTED
```

Corpo da conclusão:

```json
{
  "type": "DANGEROUS_TREE",
  "priority": "HIGH",
  "outcome": "ACCEPT",
  "comment": "Risco confirmado por vistoria remota das fotos."
}
```

- `outcome: "ACCEPT"` move para `IN_PROGRESS` e exige `type` e `priority`;
- `outcome: "REJECT"` move para `REJECTED` e exige `comment` — `priority` é dispensável;
- concluir a triagem de uma ocorrência que não esteja em `TRIAGE` responde `400`.

### Exemplo — `GET /reports/assignable-agents`

Devolve o mínimo necessário para a atribuição, apenas de agentes com `active = true`:

```json
[{ "id": "7c3d...", "name": "Ana Souza" }]
```

O cadastro completo de agentes segue restrito ao administrador em `GET /agents` — esta rota
existe para que o coordenador possa atribuir um responsável **sem** receber e-mails e perfis.

### Metadados internos

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| `GET` | `/metadata/internal` | todos | Enumerações de uso interno, com rótulo em pt-BR |

```json
{
  "priorities": [
    { "value": "LOW", "label": "Baixa" },
    { "value": "MEDIUM", "label": "Média" },
    { "value": "HIGH", "label": "Alta" },
    { "value": "CRITICAL", "label": "Crítica" }
  ],
  "agentRoles": [
    { "value": "AGENT", "label": "Agente" },
    { "value": "COORDINATOR", "label": "Coordenador" },
    { "value": "ADMIN", "label": "Administrador" }
  ]
}
```

O Portal de Operações consome `GET /metadata` e `GET /metadata/internal`; o Portal do Cidadão
consome apenas o primeiro.

### Agentes

| Método | Rota | Perfis |
|---|---|---|
| `GET` | `/agents` | admin |
| `POST` | `/agents` | admin |
| `PATCH` | `/agents/:id` | admin |
| `PATCH` | `/agents/:id/deactivate` | admin |

### Painel

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| `GET` | `/dashboard/summary` | todos | Totais por situação, prioridade e tipo |
| `GET` | `/dashboard/by-district` | todos | Ocorrências agrupadas por bairro |
| `GET` | `/dashboard/timeline` | todos | Volume de registros por período |

Os três endpoints aceitam o recorte opcional por período (`?from=&to=`), em ISO 8601.

## 5. Códigos de resposta

| Código | Situação |
|---|---|
| `200` | Requisição bem-sucedida |
| `201` | Recurso criado |
| `400` | Dados inválidos |
| `401` | Token ausente ou inválido |
| `403` | Perfil sem permissão para a operação |
| `404` | Recurso ou protocolo não encontrado |
| `409` | Conflito com o estado atual (e-mail de agente já cadastrado; anexo enviado a ocorrência que já saiu de `RECEIVED`) |
| `429` | Limite de requisições excedido (registro de ocorrência, anexos e login) |
| `500` | Erro interno |
| `503` | Serviço indisponível (ex.: banco de dados inacessível) |

## 6. Verificação de disponibilidade

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Estado da aplicação e da conexão com o banco de dados |

```json
{ "status": "ok", "database": "up" }
```

Responde `503` quando o banco está inacessível.

## 7. Documentação interativa

A API exporá **Swagger** em `http://localhost:3000/api/docs` via `@nestjs/swagger`.
