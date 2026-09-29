# Requisitos Funcionais — Backend (API)

Aplicação: **API do SISDEC** — `core/backend` (NestJS + PostgreSQL/Prisma), porta `3000`,
rotas sob `/api/v1`.

Documentos relacionados: [Visão geral](README.md) · [Modelo de dados](modelo-de-dados.md) ·
[API REST](api.md) · [Arquitetura](../arquitetura.md) ·
[Requisitos não funcionais](requisitos-nao-funcionais.md)

---

## 1. Convenções

- **Identificador**: `RF-API-nn`, único e permanente. Um requisito removido não tem o seu
  número reaproveitado. As linhas das tabelas seguem a **ordem do fluxo**, não a ordem
  numérica: um requisito acrescentado depois aparece na posição em que faz sentido ser lido,
  mantendo o seu número original.
- **Prioridade**:
  - **Essencial** — sem ele o sistema não cumpre o objetivo do projeto;
  - **Importante** — necessário para o uso adequado, mas o sistema funciona sem ele;
  - **Desejável** — agrega valor; pode ficar para uma versão futura.
- **Ator**: quem provoca a execução do requisito — *Cidadão* (via Portal do Cidadão, sem
  autenticação), *Agente*, *Coordenador*, *Administrador* (via Portal de Operações, com JWT)
  ou *Sistema* (comportamento automático).

---

## 2. Registro de ocorrências

| ID | Requisito | Ator | Prioridade |
|---|---|---|---|
| RF-API-01 | Receber o registro de uma nova ocorrência em `POST /reports`, com `category`, `type`, `description`, `address` e `district` obrigatórios, e `latitude`/`longitude` opcionais, devolvendo `201` com `id`, `protocolNumber`, `status` e `createdAt`. | Cidadão | Essencial |
| RF-API-02 | Gerar, no momento do registro, um número de protocolo único no formato `SISDEC-AAAA-NNNNNN`, com sequência reiniciada a cada ano. | Sistema | Essencial |
| RF-API-03 | Impedir qualquer alteração do `protocolNumber` após a criação da ocorrência. | Sistema | Essencial |
| RF-API-04 | Aceitar o registro **anônimo**: quando o objeto `citizen` não é enviado, a ocorrência é gravada com `citizenId` nulo. | Cidadão | Essencial |
| RF-API-05 | Gravar os dados do cidadão quando informados (`name` obrigatório; `email` e `phone` opcionais) e vinculá-los à ocorrência. | Cidadão | Essencial |
| RF-API-06 | Atribuir `status = RECEIVED` a toda ocorrência recém-registrada. | Sistema | Essencial |
| RF-API-07 | Validar o corpo da requisição e rejeitar dados inválidos com `400` e mensagens de erro em pt-BR, indicando o campo recusado. | Sistema | Essencial |
| RF-API-08 | Recusar `type` ou `category` fora das enumerações previstas no [modelo de dados](modelo-de-dados.md#3-enumerações). | Sistema | Essencial |
| RF-API-09 | Registrar `createdAt` e manter `updatedAt` a cada alteração da ocorrência. | Sistema | Essencial |

## 3. Tipos de ocorrência

| ID | Requisito | Ator | Prioridade |
|---|---|---|---|
| RF-API-62 | Expor `GET /metadata`, **sem autenticação**, devolvendo com rótulo em pt-BR as enumerações `reportTypes` (com o indicador `urgent`), `reportCategories` e `reportStatuses`, além do bloco `upload` com `maxFiles`, `maxSizeMb` e `acceptedMimeTypes`. | Cidadão, Agente | Essencial |
| RF-API-63 | Expor `GET /metadata/internal`, restrito a agentes autenticados, devolvendo com rótulo em pt-BR as enumerações de uso interno `priorities` e `agentRoles`. | Agente | Essencial |
| RF-API-10 | Manter `GET /report-types` como atalho, devolvendo apenas o conteúdo de `metadata.reportTypes`. | Cidadão, Agente | Importante |
| RF-API-11 | Marcar `urgent = true` para os tipos de risco imediato à vida: `FIRE`, `VEGETATION_FIRE`, `HAZARDOUS_MATERIAL`, `STRUCTURE_COLLAPSE` e `LANDSLIDE`. | Sistema | Essencial |
| RF-API-12 | Manter `GET /report-types` acessível sem autenticação, para consumo pelo Portal do Cidadão. | Cidadão | Essencial |
| RF-API-64 | Derivar o bloco `upload` de `GET /metadata` da configuração efetiva da API (`MAX_UPLOAD_SIZE_MB` e formatos aceitos), para que os portais não repliquem essas constantes. | Sistema | Essencial |

## 4. Consulta pública por protocolo

| ID | Requisito | Ator | Prioridade |
|---|---|---|---|
| RF-API-13 | Expor `GET /reports/protocol/:protocolNumber`, sem autenticação, devolvendo categoria, tipo, situação, bairro, datas, anexos e histórico visível da ocorrência. | Cidadão | Essencial |
| RF-API-14 | Omitir da consulta pública os dados pessoais do cidadão (`name`, `email`, `phone`), a identificação dos agentes envolvidos e os campos capazes de localizar quem registrou (`description`, `address`, `latitude`, `longitude`). | Sistema | Essencial |
| RF-API-65 | Omitir `priority` da consulta pública, por ser classificação operacional interna. | Sistema | Essencial |
| RF-API-15 | Devolver no histórico público apenas os andamentos com `visibleToCitizen = true`. | Sistema | Essencial |
| RF-API-16 | Responder `404` quando o protocolo consultado não existir. | Sistema | Essencial |

## 5. Anexos

| ID | Requisito | Ator | Prioridade |
|---|---|---|---|
| RF-API-17 | Receber fotos em `POST /reports/:id/attachments`, via `multipart/form-data`, no campo `files`, com no máximo **5 arquivos por requisição**. | Cidadão | Essencial |
| RF-API-18 | Aceitar exclusivamente os tipos `image/jpeg`, `image/png` e `image/webp`, recusando os demais com `400`. | Sistema | Essencial |
| RF-API-19 | Recusar arquivos maiores que `MAX_UPLOAD_SIZE_MB` com `400`. | Sistema | Essencial |
| RF-API-20 | Gravar o arquivo através do `StorageService` selecionado pela variável `STORAGE_DRIVER`, persistindo `fileName`, `storedPath`, `mimeType` e `sizeInBytes`. | Sistema | Essencial |
| RF-API-21 | Devolver, para cada anexo enviado, `id`, `fileName` e a `url` de leitura servida pela própria API. | Sistema | Essencial |
| RF-API-22 | Servir o conteúdo do anexo em `GET /attachments/:id`, com o `Content-Type` correspondente. | Cidadão, Agente | Essencial |
| RF-API-23 | Recusar o envio de anexos para uma ocorrência inexistente, respondendo `404`. | Sistema | Importante |
| RF-API-69 | Aceitar anexos apenas enquanto a ocorrência estiver em `status = RECEIVED`, recusando com `409` depois disso, para impedir que terceiros que conheçam o `id` anexem arquivos a uma ocorrência já em atendimento ou concluída. | Sistema | Essencial |
| RF-API-24 | Listar os anexos de uma ocorrência dentro do detalhe devolvido por `GET /reports/:id`. | Agente | Essencial |

## 6. Autenticação e autorização

| ID | Requisito | Ator | Prioridade |
|---|---|---|---|
| RF-API-25 | Autenticar o agente em `POST /auth/login` a partir de `email` e `password`, conferindo a senha contra o `passwordHash` (bcrypt) e devolvendo um token JWT. | Agente | Essencial |
| RF-API-26 | Responder `401` a credenciais inválidas, sem informar se o erro foi no e-mail ou na senha. | Sistema | Essencial |
| RF-API-27 | Recusar o login de agente com `active = false`. | Sistema | Essencial |
| RF-API-28 | Assinar o token com `JWT_SECRET` e aplicar a validade definida em `JWT_EXPIRES_IN`. | Sistema | Essencial |
| RF-API-29 | Expor `GET /auth/me`, devolvendo `id`, `name`, `email` e `role` do agente autenticado. | Agente | Essencial |
| RF-API-30 | Exigir `Authorization: Bearer <token>` válido em todas as rotas restritas, respondendo `401` quando ausente ou inválido. | Sistema | Essencial |
| RF-API-31 | Autorizar cada rota restrita conforme o perfil (`ADMIN`, `COORDINATOR`, `AGENT`), respondendo `403` quando o perfil não tiver permissão. | Sistema | Essencial |

## 7. Gestão de ocorrências (agentes autenticados)

| ID | Requisito | Ator | Prioridade |
|---|---|---|---|
| RF-API-32 | Listar ocorrências em `GET /reports` com filtros combináveis por `status`, `type`, `category`, `priority`, `district`, `assignedToId`, `from`, `to` e `search` (protocolo ou descrição). | Agente | Essencial |
| RF-API-33 | Paginar a listagem de ocorrências (`?page=&pageSize=`), devolvendo `data`, `total`, `page` e `pageSize`. | Agente | Essencial |
| RF-API-71 | Ordenar a listagem de ocorrências por `?sort=createdAt\|priority` e `?order=asc\|desc`, com `createdAt` decrescente como padrão, mantendo as ocorrências sem prioridade ao fim e a paginação estável. Campo fora dessa lista é recusado com `400`. | Agente | Importante |
| RF-API-72 | Devolver em `GET /reports/:id` o campo `availableTransitions` com as transições de situação que **o agente autenticado** pode executar na ocorrência agora — cada uma com a situação alcançada, o endpoint responsável e se exige comentário —, resolvidas pelos mesmos critérios que a execução aplica. | Agente | Importante |
| RF-API-73 | Expor a noção de ocorrência **em aberto** nas três superfícies que dela dependem: o filtro `?open=true` em `GET /reports` (com `status` explícito tendo precedência), o campo `openByPriority` em `GET /dashboard/summary` e o campo `open` em `GET /reports/:id`. A lista de situações abertas é derivada da tabela de transições, não mantida à parte. | Agente | Importante |
| RF-API-34 | Devolver em `GET /reports/:id` o detalhe completo: relato, localização, dados do cidadão (quando houver), anexos e histórico integral. | Agente | Essencial |
| RF-API-67 | Expor `GET /reports/map`, sem paginação e em formato enxuto (`id`, `protocolNumber`, `type`, `status`, `priority`, coordenadas), aceitando os mesmos filtros de `GET /reports`; sem filtro de situação devolve apenas as ocorrências abertas, informa em `omittedWithoutCoordinates` quantas foram omitidas por não ter coordenadas e sinaliza `truncated` ao atingir o teto de 500 registros. | Agente | Essencial |
| RF-API-70 | Expor `GET /reports/export`, restrito a coordenador e administrador, devolvendo em `text/csv` a lista filtrada pelos mesmos critérios de `GET /reports`, sem paginação e com cabeçalho em pt-BR. | Coordenador, Administrador | Importante |
| RF-API-60 | Permitir que um coordenador assuma a triagem em `PATCH /reports/:id/triage/start`, movendo a ocorrência de `RECEIVED` para `TRIAGE`, de modo que o estado sinalize que a análise já tem responsável. | Coordenador, Administrador | Essencial |
| RF-API-35 | Concluir a triagem em `PATCH /reports/:id/triage`, confirmando o `type`, definindo a `priority` e movendo a ocorrência para `IN_PROGRESS` (`outcome: ACCEPT`) ou `REJECTED` (`outcome: REJECT`) — restrito a coordenador e administrador. | Coordenador, Administrador | Essencial |
| RF-API-66 | Exigir `comment` na conclusão de triagem com `outcome: REJECT`, e recusar com `400` a conclusão de triagem de ocorrência que não esteja em `TRIAGE`. | Sistema | Essencial |
| RF-API-36 | Sugerir prioridade `HIGH` ou `CRITICAL` na triagem de ocorrências cujo tipo esteja marcado como `urgent`. | Sistema | Importante |
| RF-API-61 | Expor `GET /reports/assignable-agents` a todo agente autenticado, devolvendo apenas `id` e `name` dos agentes com `active = true`, para a atribuição de responsável e para o filtro da listagem. A **ação** de atribuir segue restrita a coordenador e administrador. | Agente | Essencial |
| RF-API-37 | Atribuir um agente responsável em `PATCH /reports/:id/assign` — restrito a coordenador e administrador. | Coordenador, Administrador | Essencial |
| RF-API-38 | Recusar a atribuição de ocorrência a agente inexistente ou inativo. | Sistema | Importante |
| RF-API-39 | Alterar a situação da ocorrência em `PATCH /reports/:id/status`, aceitando apenas as transições atribuídas a esse endpoint na [tabela de transições](modelo-de-dados.md#4-ciclo-de-vida-da-ocorrência) — `IN_PROGRESS → RESOLVED` e `IN_PROGRESS → CANCELLED` — e recusando as demais com `400`. | Agente | Essencial |
| RF-API-68 | Recusar com `403` a alteração de situação feita por agente de perfil `AGENT` que não conste como `assignedToId` da ocorrência; coordenador e administrador alteram qualquer ocorrência. | Sistema | Essencial |
| RF-API-40 | Registrar em `ReportUpdate`, a cada transição de situação, o agente autor, `fromStatus`, `toStatus`, o comentário e a data. | Sistema | Essencial |
| RF-API-41 | Preencher `resolvedAt` automaticamente na transição para `RESOLVED`. | Sistema | Essencial |
| RF-API-42 | Concentrar toda mudança de situação em um único ponto do service de ocorrências, de modo que o envio de aviso ao cidadão possa ser acrescentado ali numa versão futura ([decisão 09](../arquitetura.md#5-decisões-técnicas-registradas)). | Sistema | Essencial |
| RF-API-43 | Permitir o registro de observação no histórico em `POST /reports/:id/updates`, com o indicador `visibleToCitizen` definido pelo agente. | Agente | Essencial |
| RF-API-44 | Impedir a alteração ou exclusão de registros de `ReportUpdate` já gravados. | Sistema | Essencial |

## 8. Gestão de agentes

| ID | Requisito | Ator | Prioridade |
|---|---|---|---|
| RF-API-45 | Listar agentes em `GET /agents`, com perfil e situação de ativação — restrito ao administrador. | Administrador | Essencial |
| RF-API-46 | Cadastrar agente em `POST /agents` com `name`, `email`, senha e `role`, gravando a senha apenas como hash bcrypt. | Administrador | Essencial |
| RF-API-47 | Recusar o cadastro de agente com e-mail já existente, respondendo `409`. | Sistema | Essencial |
| RF-API-48 | Alterar os dados de um agente em `PATCH /agents/:id`, incluindo o perfil. | Administrador | Essencial |
| RF-API-49 | Desativar o agente em `PATCH /agents/:id/deactivate` (`active = false`), sem excluir o registro, preservando o histórico de andamentos. | Administrador | Essencial |
| RF-API-50 | Nunca devolver o `passwordHash` em qualquer resposta da API. | Sistema | Essencial |
| RF-API-51 | Criar, na carga inicial (`seed`), um agente com perfil `ADMIN` para o primeiro acesso ao Portal de Operações. | Sistema | Essencial |

## 9. Painel de indicadores

| ID | Requisito | Ator | Prioridade |
|---|---|---|---|
| RF-API-52 | Expor `GET /dashboard/summary` com os totais de ocorrências por situação, por prioridade e por tipo. | Agente | Essencial |
| RF-API-53 | Expor `GET /dashboard/by-district` com as ocorrências agrupadas por bairro. | Agente | Importante |
| RF-API-54 | Expor `GET /dashboard/timeline` com o volume de registros por período. | Agente | Importante |
| RF-API-55 | Aceitar recorte por período (`from`, `to`) nos endpoints do painel. | Agente | Desejável |

## 10. Requisitos de apoio

| ID | Requisito | Ator | Prioridade |
|---|---|---|---|
| RF-API-56 | Publicar a documentação interativa da API (Swagger) em `/api/docs`. | Agente | Importante |
| RF-API-57 | Liberar por CORS apenas as origens declaradas em `CORS_ORIGINS`. | Sistema | Essencial |
| RF-API-58 | Padronizar as respostas de erro no formato `{ statusCode, message, error }`. | Sistema | Essencial |
| RF-API-59 | Expor um endpoint de verificação de disponibilidade (`GET /health`) informando o estado da conexão com o banco, respondendo `503` quando o banco estiver inacessível. | Sistema | Importante |

---

## 11. Fora do escopo desta versão

Registrado para evitar ambiguidade na avaliação dos requisitos acima:

- envio de e-mail ou SMS ao cidadão ([decisão 09](../arquitetura.md#5-decisões-técnicas-registradas));
- cadastro e login de cidadão — o acompanhamento é feito apenas por protocolo ([decisão 05](../arquitetura.md#5-decisões-técnicas-registradas));
- armazenamento de anexos em nuvem (S3) — previsto como ponto de troca, não implementado ([decisão 07](../arquitetura.md#armazenamento-de-anexos-decisão-07));
- integração com sistemas externos da Prefeitura ou de outros órgãos;
- recuperação de senha por autoatendimento — a redefinição é feita pelo administrador.
