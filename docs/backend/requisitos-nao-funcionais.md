# Requisitos Não Funcionais — Backend (API)

Aplicação: **API do SISDEC** — `core/backend` (NestJS + PostgreSQL/Prisma), porta `3000`.

Documentos relacionados: [Visão geral](README.md) · [Modelo de dados](modelo-de-dados.md) ·
[API REST](api.md) · [Arquitetura](../arquitetura.md) ·
[Requisitos funcionais](requisitos-funcionais.md)

---

## 1. Convenções

- **Identificador**: `RNF-API-nn`, único e permanente.
- **Prioridade**: **Essencial**, **Importante** ou **Desejável**.
- **Verificação**: como o atendimento ao requisito é comprovado.
- Os valores de referência de desempenho consideram o ambiente desta etapa: execução local
  (`localhost`), PostgreSQL em contêiner Docker e base com volume de dados de demonstração
  ([decisão 10](../arquitetura.md#5-decisões-técnicas-registradas)).

---

## 2. Desempenho

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-API-01 | Responder às consultas de leitura simples (`GET /reports/:id`, `GET /reports/protocol/:protocolNumber`, `GET /metadata`) em até **500 ms** no ambiente local. | Importante | Medição do tempo de resposta em teste manual ou automatizado |
| RNF-API-02 | Responder à listagem paginada de ocorrências (`GET /reports`, 20 registros por página) em até **1 s** com a base de demonstração. | Importante | Medição do tempo de resposta |
| RNF-API-03 | Limitar `pageSize` a um máximo de **100** registros nas listagens paginadas, para impedir consultas capazes de degradar a API. As rotas deliberadamente sem paginação têm o seu próprio limite: `GET /reports/map` corta em 500 registros e sinaliza `truncated`; `GET /reports/export` responde em fluxo. | Essencial | Teste automatizado com `pageSize` acima do limite e com recorte amplo no mapa |
| RNF-API-04 | Manter índices no banco para os campos usados em filtro e ordenação: `protocolNumber` (único), `status`, `type`, `priority`, `district`, `assignedToId` e `createdAt`. | Importante | Inspeção do `schema.prisma` e da migração gerada |
| RNF-API-05 | Calcular os indicadores do painel por agregação no banco, sem carregar a lista completa de ocorrências para a memória da aplicação. | Importante | Revisão de código do módulo `dashboard` |
| RNF-API-06 | Transmitir em fluxo (*stream*) o conteúdo dos anexos e o CSV de `GET /reports/export`, sem carregar o arquivo nem o resultado completo em memória. | Importante | Revisão de código dos módulos `attachments` e `reports` |

## 3. Segurança

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-API-07 | Armazenar senhas de agentes exclusivamente como hash **bcrypt**, com custo mínimo de 10 — nunca em texto claro ou com cifragem reversível. | Essencial | Revisão de código e inspeção da tabela `Agent` |
| RNF-API-08 | Não expor o `passwordHash` em nenhuma resposta, log ou mensagem de erro. | Essencial | Teste automatizado sobre as respostas de `/agents` e `/auth` |
| RNF-API-09 | Validar e sanear toda entrada externa por DTOs com `class-validator`, rejeitando campos não declarados (*whitelist*). | Essencial | Teste automatizado com campos extras no corpo |
| RNF-API-10 | Executar todo acesso ao banco pelo Prisma, com parâmetros vinculados, sem concatenação de SQL a partir de entrada do usuário. | Essencial | Revisão de código |
| RNF-API-11 | Aceitar requisições apenas das origens declaradas em `CORS_ORIGINS`, sem uso de `*` em ambiente publicado. | Essencial | Teste de requisição a partir de origem não autorizada |
| RNF-API-12 | Manter segredos (`JWT_SECRET`, `DATABASE_URL`) exclusivamente em variáveis de ambiente, fora do controle de versão — o repositório contém apenas `.env.example`. | Essencial | Inspeção do `.gitignore` e do histórico do repositório |
| RNF-API-13 | Verificar o tipo do arquivo recebido também pelo seu conteúdo, e não apenas pela extensão ou pelo `Content-Type` declarado. | Importante | Teste com arquivo renomeado para `.jpg` |
| RNF-API-14 | Gravar os anexos com nome gerado pela aplicação, jamais com o nome original enviado, impedindo travessia de diretório (`../`). | Essencial | Revisão de código do `LocalStorageService` e teste com nome malicioso |
| RNF-API-15 | Aplicar limite de requisições (*rate limiting*) nas rotas públicas de registro de ocorrência, de envio de anexos e de login. | Importante | Teste de requisições sucessivas acima do limite |
| RNF-API-16 | Expirar o token JWT conforme `JWT_EXPIRES_IN` (padrão `8h`) e recusar tokens expirados com `401`. | Essencial | Teste automatizado com token expirado |
| RNF-API-17 | Não revelar, em mensagens de erro, detalhes internos como *stack trace*, nome de tabela ou versão de biblioteca. | Essencial | Inspeção das respostas `500` em modo produção |
| RNF-API-18 | Verificar a autorização por perfil no servidor, sem depender de qualquer restrição aplicada pelos frontends. | Essencial | Teste automatizado chamando rota restrita com perfil `AGENT` |

## 4. Confiabilidade e integridade

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-API-19 | Garantir a unicidade do `protocolNumber` por restrição `UNIQUE` no banco, e não apenas por verificação na aplicação. | Essencial | Inspeção da migração e teste de inserção concorrente |
| RNF-API-20 | Executar em uma única transação as operações que gravam mais de uma entidade (registro de ocorrência com cidadão; mudança de situação com andamento), de modo que uma falha não deixe dados parciais. | Essencial | Revisão de código e teste de falha simulada |
| RNF-API-21 | Tratar o histórico de andamentos como **somente-adição**: nenhuma rotina da aplicação altera ou remove um `ReportUpdate`. | Essencial | Revisão de código e busca por operações de `update`/`delete` na entidade |
| RNF-API-22 | Preservar a integridade referencial por chaves estrangeiras, sem exclusão em cascata de ocorrências, andamentos ou agentes. | Essencial | Inspeção do `schema.prisma` |
| RNF-API-23 | Manter o esquema do banco versionado em migrações Prisma aplicáveis em ordem, sem alteração manual da estrutura. | Essencial | Presença e execução de `prisma/migrations` |
| RNF-API-24 | Responder `503` ou `500` de forma controlada quando o banco estiver indisponível, sem encerrar o processo da aplicação. | Importante | Teste com o contêiner do PostgreSQL parado |
| RNF-API-25 | Armazenar e devolver todas as datas em **ISO 8601 UTC**, sem depender do fuso horário do servidor. | Essencial | Teste automatizado sobre os campos de data |

## 5. Manutenibilidade e portabilidade

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-API-26 | Organizar o código em módulos NestJS por domínio (`auth`, `agents`, `reports`, `report-updates`, `attachments`, `dashboard`), cada um com `module`, `controller`, `service` e `dto/`. | Essencial | Inspeção da árvore de pastas |
| RNF-API-27 | Concentrar o acesso a disco e a qualquer SDK de armazenamento no módulo `attachments`: nenhum service fora dele conhece caminho de arquivo, `fs` ou SDK da AWS ([decisão 07](../arquitetura.md#armazenamento-de-anexos-decisão-07)). | Essencial | Busca por `fs`/`path` fora de `modules/attachments` |
| RNF-API-28 | Selecionar a implementação de `StorageService` em um único ponto — o provider do `AttachmentsModule` —, a partir de `STORAGE_DRIVER`. | Essencial | Revisão de código do `AttachmentsModule` |
| RNF-API-29 | Permitir que os frontends obtenham as enumerações e os seus rótulos por `GET /metadata` e `GET /metadata/internal`, de modo que a troca de um `enum` por uma tabela não altere o contrato da API nem as interfaces. | Essencial | Inspeção dos endpoints e ausência de lista fixa nos frontends |
| RNF-API-30 | Versionar as rotas sob o prefixo `/api/v1`, preservando o contrato publicado dentro da versão. | Essencial | Inspeção da configuração em `main.ts` |
| RNF-API-31 | Escrever todo o código-fonte em TypeScript com modo estrito ativado, sem uso de `any` implícito. | Essencial | Execução de `tsc --noEmit` sem erros |
| RNF-API-32 | Manter o código livre de apontamentos do **oxlint** na configuração do projeto. | Importante | Execução do script de lint sem erros |
| RNF-API-33 | Obter toda a configuração de variáveis de ambiente, validadas na inicialização, falhando de imediato quando uma variável obrigatória estiver ausente. | Importante | Execução da aplicação sem `.env` |
| RNF-API-34 | Manter o `.env.example` atualizado com todas as variáveis utilizadas. | Importante | Comparação entre `.env.example` e o uso no código |

## 6. Qualidade e testes

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-API-35 | Cobrir com testes unitários (**Vitest**) as regras de negócio centrais: geração de protocolo, transições do ciclo de vida, filtro do histórico visível e autorização por perfil. | Essencial | Execução da suíte de testes |
| RNF-API-36 | Cobrir com testes end-to-end os fluxos principais: registro de ocorrência, consulta por protocolo, login e triagem. | Importante | Execução de `test/` com a configuração e2e |
| RNF-API-37 | Executar a suíte de testes sem depender de dados residuais, preparando e limpando o seu próprio estado. | Importante | Duas execuções consecutivas da suíte com o mesmo resultado |
| RNF-API-38 | Documentar no Swagger todos os endpoints, com os seus DTOs de entrada e saída e os códigos de resposta possíveis. | Importante | Inspeção de `/api/docs` |

## 7. Observabilidade

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-API-39 | Registrar em log toda requisição recebida com método, rota, código de resposta e duração. | Importante | Inspeção da saída da aplicação |
| RNF-API-40 | Registrar em log os erros `500` com informação suficiente para diagnóstico, sem expor esse detalhe na resposta ao cliente. | Importante | Provocação de erro interno e inspeção do log |
| RNF-API-41 | Não registrar em log senhas, tokens JWT ou dados pessoais do cidadão. | Essencial | Inspeção do log durante login e registro de ocorrência |

## 8. Privacidade e conformidade

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-API-42 | Coletar do cidadão apenas nome, e-mail e telefone, todos opcionais, e somente quando ele optar por se identificar (minimização de dados). | Essencial | Inspeção do DTO de registro de ocorrência |
| RNF-API-43 | Não expor dados pessoais do cidadão em nenhuma rota pública ou não autenticada. | Essencial | Teste automatizado sobre a resposta da consulta por protocolo |
| RNF-API-44 | Restringir a leitura dos dados pessoais do cidadão a agentes autenticados, no detalhe da ocorrência. | Essencial | Teste automatizado de acesso sem token |
| RNF-API-45 | Registrar o autor e a data de toda mudança de situação de ocorrência, garantindo a rastreabilidade das ações dos agentes. | Essencial | Inspeção da tabela `ReportUpdate` após uma transição |

## 9. Restrições tecnológicas

| ID | Restrição | Origem |
|---|---|---|
| RNF-API-46 | Plataforma **Node.js 20+** com **NestJS 12** em TypeScript (ESM). | [Decisão 02](../arquitetura.md#5-decisões-técnicas-registradas) |
| RNF-API-47 | Banco de dados **PostgreSQL 17**, acessado exclusivamente pelo **Prisma 7**. | [Decisão 04](../arquitetura.md#5-decisões-técnicas-registradas) |
| RNF-API-48 | Autenticação por **JWT**, aplicada somente aos agentes — o cidadão não se autentica. | [Decisões 05 e 06](../arquitetura.md#5-decisões-técnicas-registradas) |
| RNF-API-49 | Anexos gravados em **disco local** (`UPLOAD_DIR`) nesta versão, atrás da interface `StorageService`. | [Decisão 07](../arquitetura.md#armazenamento-de-anexos-decisão-07) |
| RNF-API-50 | Execução em `localhost`, com o PostgreSQL em contêiner Docker; publicação na internet fica para etapa futura. | [Decisão 10](../arquitetura.md#5-decisões-técnicas-registradas) |
| RNF-API-51 | Documentação, rótulos e mensagens de erro em **pt-BR**; identificadores de código, tabelas, campos e endpoints em **inglês**. | [Convenções da documentação](../README.md#3-convenções-da-documentação) |
