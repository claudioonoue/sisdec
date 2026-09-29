# Registro de progresso

O que já foi construído no SISDEC, o que ainda não existe e qual é o próximo passo.

> Documento vivo: deve ser atualizado ao fim de cada etapa do
> [plano de implementação](plano-de-implementacao.md). Registra **estado**, não intenção —
> um item só é marcado como pronto quando está verificado e commitado.

Última atualização: **29 de setembro de 2026** — etapas B0 a B6 concluídas.

---

## 1. Situação em uma olhada

| Frente | Situação |
|---|---|
| Documentação do projeto | ✅ Completa para a etapa atual — 15 documentos |
| Requisitos (RF e RNF) | ✅ 332 requisitos, nas três aplicações |
| Contrato da API | ✅ 25 rotas especificadas e conferidas contra os requisitos |
| Plano de implementação | ✅ 20 etapas, cobrindo os 332 requisitos |
| Ambiente de desenvolvimento | ✅ PostgreSQL em Docker, `.env` das três aplicações |
| Scaffold das três aplicações | ✅ Sobem e respondem |
| Modelo de dados no Prisma | ✅ 5 entidades, 5 enumerações e a primeira migração aplicada |
| Fundação da API (etapa B0) | ✅ Concluída e verificada |
| Metadados públicos (etapa B1) | ✅ Concluída e verificada |
| Autenticação e agentes (etapa B2) | ✅ Concluída e verificada |
| Registro e consulta por protocolo (etapa B3) | ✅ Concluída e verificada |
| Anexos (etapa B4) | ✅ Concluída e verificada |
| Gestão de ocorrências (etapa B5) | ✅ Concluída e verificada |
| Mapa, exportação e painel (etapa B6) | ✅ Concluída e verificada |
| Contrato da API | ✅ **As 27 rotas implementadas**, conferidas contra `api.md` |
| **Fechamento da API (etapa B7)** | ⬜ Cobertura de testes e Swagger completo |
| **Telas dos portais** | ⬜ Apenas a página inicial do scaffold |

Em uma frase: **a API está funcionalmente completa; falta o fechamento de qualidade em B7.**

## 2. Linha do tempo

### 7 de setembro de 2026 — fundação do repositório

Commit `fbe3492`, 72 arquivos.

- Monorepo com três projetos independentes em `core/`, sem workspaces
  ([decisão 01](arquitetura.md#5-decisões-técnicas-registradas)).
- `docker-compose.yml` com PostgreSQL 17, volume nomeado e *healthcheck*.
- Documentação inicial: [arquitetura](arquitetura.md), [glossário](glossario.md),
  [modelo de dados](backend/modelo-de-dados.md), [contrato da API](backend/api.md) e um
  `README.md` por aplicação.
- Decisões técnicas 01 a 10 registradas.
- Scaffold das três aplicações, com dependências instaladas e `.env.example`.

### 29 de setembro de 2026 — requisitos e alinhamento

Commits `4746bcb` e `07d5098`.

- Seis documentos de requisitos — RF e RNF em arquivos separados por aplicação.
- Verificação cruzada entre os requisitos, o contrato da API e o modelo de dados, que
  apontou **21 divergências**; todas resolvidas.
- Quatro decisões técnicas novas (11 a 14) e ajustes em `api.md`, `modelo-de-dados.md`,
  `glossario.md` e nos `README.md` das aplicações.

### 29 de setembro de 2026 — etapa B0: fundação da API

Primeira etapa de implementação, conforme o
[plano](plano-de-implementacao.md#b0-fundação).

- `schema.prisma` completo: 5 entidades, 5 enumerações, os 6 índices de `RNF-API-04`,
  `UNIQUE` em `protocolNumber` e chaves estrangeiras `RESTRICT` — sem exclusão em cascata.
- Primeira migração aplicada (`20260929041941_initial_schema`) e cliente gerado.
- `PrismaModule` e `PrismaService` com a conexão no ciclo de vida do Nest.
- Validação do ambiente na inicialização: subir sem variável obrigatória falha nomeando-a.
- Filtro global de exceções no formato `{ statusCode, message, error }`, sem *stack trace*.
- Interceptor de log com método, rota, código e duração — sem corpo, cabeçalho nem query.
- Utilitário de paginação com padrão 20 e teto 100.
- `GET /health` com o estado do banco, respondendo `503` quando inacessível.
- 14 testes unitários e 2 e2e; `tsc`, lint e build limpos.

Duas coisas que a etapa revelou e que o plano não previa:

- o **Prisma 7 exige um driver adapter explícito** — `@prisma/adapter-pg` passou a ser
  dependência da API;
- o **Express responde HTML** em caminho sem rota, antes de o Nest chegar ao filtro de
  exceções, o que quebraria `response.json()` nos portais. Resolvido com um *fallback*
  registrado depois de `app.init()`.

### 29 de setembro de 2026 — etapa B1: metadados públicos

Conforme o [plano](plano-de-implementacao.md#b1-metadados-públicos).

- `GET /metadata` sem autenticação, com `reportTypes` (14, cada um com `urgent`),
  `reportCategories` (4), `reportStatuses` (6) e o bloco `upload`.
- `GET /report-types` como atalho, devolvendo exatamente `metadata.reportTypes` — há teste
  e2e comparando as duas respostas.
- `urgent` marcado nos cinco tipos de risco imediato à vida.
- Limites de upload derivados da configuração efetiva: `maxSizeMb` vem de
  `MAX_UPLOAD_SIZE_MB`, e `maxFiles`/`acceptedMimeTypes` de `common/upload.constants.ts`, que
  o módulo `attachments` também usará em B4 — para a API não recusar arquivo que ela mesma
  anunciou como aceitável.
- Rótulos tipados como `Record<Enum, string>`: acrescentar um valor ao enum sem o rótulo
  **não compila**. Verificado removendo um rótulo e confirmando que o build quebra — é essa
  garantia que sustenta o `RNF-API-29`, já que os portais não mantêm mapa de tradução.
- 10 testes unitários e 6 e2e novos; os rótulos conferem exatamente com os exemplos de
  [api.md](backend/api.md), sem necessidade de alterar o contrato.

### 29 de setembro de 2026 — etapa B2: autenticação, agentes e metadados internos

Conforme o [plano](plano-de-implementacao.md#b2-autenticação-agentes-e-metadados-internos).

- `POST /auth/login` e `GET /auth/me`, com JWT assinado por `JWT_SECRET` e validade
  `JWT_EXPIRES_IN`.
- CRUD de agentes restrito ao administrador, com `409` em e-mail repetido, e-mail normalizado
  em minúsculas e desativação em vez de exclusão.
- `GET /metadata/internal` com `priorities` e `agentRoles`, exigindo autenticação.
- `seed.ts` idempotente criando o agente administrador — `npx prisma db seed` agora funciona,
  o que o README do backend já instruía.
- Senhas apenas como hash bcrypt de custo 10; `passwordHash` nunca lido do banco nas rotas que
  devolvem agente, por `select` explícito — e não removido depois na serialização.
- 31 testes unitários e 17 e2e novos; a suíte e2e cria e apaga os seus próprios agentes, e foi
  rodada duas vezes seguidas com o mesmo resultado.

Três decisões que valem registro:

- **O `JwtAuthGuard` é global**: o padrão é rota protegida, e a rota pública se declara com
  `@Public()`. Esquecer o decorador fecha a rota, em vez de abri-la.
- **Os perfis não são hierárquicos no guarda**: cada rota lista quem pode acessá-la. A
  hierarquia da documentação é convenção de produto; embuti-la no guarda esconderia quem de
  fato tem acesso a quê.
- **A estratégia JWT consulta o banco** em vez de confiar apenas no conteúdo do token, então
  desativar um agente revoga o acesso na mesma hora, sem esperar a expiração. Há teste e2e
  cobrindo exatamente isso.

Um obstáculo técnico resolvido no caminho: o cliente do Prisma 7 é gerado como fonte
TypeScript com especificadores `.js`, que só o `tsc` resolve — o `seed.ts` não rodava pelo
Node. Configurei `importFileExtension = "ts"` no gerador e liguei
`rewriteRelativeImportExtensions` no `tsconfig.json`, então o mesmo código serve ao build
(que emite `.js`) e à execução direta pelo Node.

### 29 de setembro de 2026 — etapa B3: registro e consulta pública

Conforme o [plano](plano-de-implementacao.md#b3-registro-e-consulta-pública-de-ocorrências).
É o núcleo do sistema: o fluxo do cidadão já funciona ponta a ponta.

- `POST /reports` sem autenticação, com `citizen` opcional, `status = RECEIVED` e `priority`
  nula — ocorrência e cidadão gravados na mesma transação.
- Protocolo `SISDEC-AAAA-NNNNNN` com sequência anual, derivada do maior protocolo do ano e não
  de uma contagem de registros, que daria número repetido se algum dia houvesse exclusão.
- `GET /reports/protocol/:protocolNumber` devolvendo apenas os campos públicos, com o
  protocolo tolerante a caixa e espaços, e `404` para protocolo inexistente ou malformado.
- *Rate limiting* nas rotas públicas de escrita e no login: 10 registros/min, 30 consultas/min
  e 5 logins/min, com `429` no envelope padrão.
- 14 testes unitários e 21 e2e novos.

**O teste de concorrência encontrou um defeito de projeto.** A mitigação prevista no plano —
`UNIQUE` no banco mais nova tentativa em caso de colisão — não resiste a registros
simultâneos: 20 requisições disputando o mesmo número resolvem a disputa em até 20 rodadas,
muito acima de qualquer limite razoável de tentativas, e a maioria falhava com violação de
unicidade. A geração passou a ser serializada por um *advisory lock* do PostgreSQL preso ao
ano, liberado no commit; o `UNIQUE` continua como garantia final. Confirmei que o teste pega o
defeito removendo o *lock* e vendo as violações voltarem.

Duas decisões de privacidade, ambas cobertas por teste:

- a consulta pública **não** devolve `description`, `address`, coordenadas, `citizen`,
  `assignedTo` nem o `id` interno da ocorrência — o teste procura o nome, o e-mail, o telefone
  e a rua no corpo serializado, em vez de apenas conferir a ausência das chaves;
- `priority` também fica fora, e há teste que atribui `CRITICAL` à ocorrência antes de
  consultar, para garantir que o valor não escapa.

A limpeza das suítes e2e passou a usar um marcador gravado na descrição, em vez da lista de
protocolos montada durante as asserções: quando o teste de concorrência quebrou, os registros
criados ficaram no banco justamente porque a lista nunca chegou a ser preenchida.

### 29 de setembro de 2026 — etapa B4: anexos

Conforme o [plano](plano-de-implementacao.md#b4-anexos). Fecha o fluxo do cidadão.

- `StorageService` como fronteira do armazenamento e `LocalStorageService` gravando em
  `UPLOAD_DIR`, escolhido por `STORAGE_DRIVER` em um único ponto — o provider do módulo.
- `POST /reports/:id/attachments`: até 5 arquivos, tipo verificado **pela assinatura dos bytes**
  e não pelo `Content-Type` nem pela extensão, e teto de tamanho vindo de `MAX_UPLOAD_SIZE_MB`.
- Anexo aceito apenas enquanto a ocorrência está em `RECEIVED`, com `409` depois disso.
- `GET /attachments/:id` servindo em fluxo, com o tipo gravado no registro.
- 26 testes unitários e 14 e2e novos.

Quatro pontos que valem registro:

- **O nome do arquivo é gerado pela aplicação.** O nome original é guardado no banco, mas nunca
  chega ao disco: além de poder conter `../`, ele carrega dado do cidadão. Há teste enviando
  um arquivo chamado `../../etc/passwd`.
- **O lote inteiro é conferido antes de qualquer gravação**, para que um arquivo recusado no
  meio não deixe os anteriores no disco — verificado por teste que confere o `UPLOAD_DIR`
  antes e depois de um envio recusado.
- **O download precisou de `StreamableFile`.** Devolver o `Readable` cru fazia o Nest
  serializá-lo como JSON: o `Content-Type` saía correto e o corpo era o objeto do stream. O
  teste compara os bytes com o arquivo enviado, e foi o que pegou — um teste que só conferisse
  o cabeçalho teria passado servindo lixo.
- **A consulta pública não expõe o nome do arquivo**, que pode conter dado do cidadão; devolve
  apenas o `id` e a URL.

Uma divergência de documentação corrigida: a interface `StorageService` esboçada em
[arquitetura.md](arquitetura.md#armazenamento-de-anexos-decisão-07) devolvia `Promise<Buffer>`
na leitura, o que contraria o `RNF-API-06`, e recebia o `Express.Multer.File`, o que amarraria
a interface ao framework HTTP — justamente o contrário do que ela existe para permitir. O
documento foi alinhado à implementação.

### 29 de setembro de 2026 — etapa B5: gestão de ocorrências

Conforme o [plano](plano-de-implementacao.md#b5-gestão-de-ocorrências). A maior etapa da API:
o ciclo de vida completo, com histórico e autorização.

- `GET /reports` com os nove filtros combináveis e paginação, e `GET /reports/:id` com dados do
  cidadão, anexos e histórico integral.
- Triagem em duas etapas: `PATCH /reports/:id/triage/start` e `PATCH /reports/:id/triage` com
  `outcome: ACCEPT | REJECT`.
- `GET /reports/assignable-agents` e `PATCH /reports/:id/assign`, recusando agente inativo.
- `PATCH /reports/:id/status` e `POST /reports/:id/updates`.
- 11 testes unitários e 28 e2e novos.

Três decisões de projeto:

- **A tabela de transições virou dado, não código espalhado.** Cada aresta declara o endpoint
  responsável, os perfis que podem executá-la e se exige comentário. Há teste conferindo que
  toda situação do enum é alcançável e que a improcedência tem exatamente um caminho — a falha
  que a verificação cruzada encontrou na documentação não pode voltar sem quebrar o teste.
- **Um único método aplica toda mudança de situação** (`RF-API-42`). É onde a transição é
  conferida, a autorização é aplicada, o `ReportUpdate` é gravado na mesma transação e o
  `resolvedAt` é preenchido — e onde o envio de aviso ao cidadão entrará numa versão futura.
- **`GET /reports/assignable-agents` é declarado antes de `GET /reports/:id`.** O Express casa
  as rotas na ordem de registro; declarada depois, `assignable-agents` cairia no parâmetro de
  id e viraria um `400` de UUID.

A atribuição de responsável também grava andamento, para que a troca seja rastreável — o
requisito pedia rastreabilidade das mudanças de situação, e trocar o responsável sem deixar
registro deixaria um buraco no histórico.

### 29 de setembro de 2026 — etapa B6: mapa, exportação e painel

Conforme o [plano](plano-de-implementacao.md#b6-mapa-exportação-e-painel). Com ela, **as 27
rotas do contrato estão implementadas** — conferido comparando o Swagger com as tabelas de
[api.md](backend/api.md), sem sobra nem falta dos dois lados.

- `GET /reports/map`: sem paginação, formato enxuto, apenas abertas quando não há filtro de
  situação, teto de 500 com `truncated` e contagem das omitidas por falta de coordenadas.
- `GET /reports/export` em CSV, restrito a coordenador e administrador.
- `GET /dashboard/summary`, `/by-district` e `/timeline`, com recorte por período.
- 15 testes e2e novos.

Três decisões:

- **O painel agrega no banco**, com `groupBy` e `count`. A *timeline* precisou de SQL
  direto, porque o Prisma não agrupa por expressão derivada de coluna — e trazer as linhas para
  agrupar em memória seria exatamente o que o `RNF-API-05` proíbe, justamente na tela mais
  acessada pelos agentes.
- **A exportação é um gerador assíncrono**, escrita lote a lote conforme o cursor avança: o CSV
  inteiro nunca fica em memória. Sai com BOM, para o Excel não corromper os acentos, e com `;`
  como separador, que o Excel em pt-BR reconhece sem pedir configuração.
- **As ocorrências sem prioridade entram no painel como `SEM_PRIORIDADE`**, em vez de sumirem.
  Antes da triagem a prioridade é nula, e omiti-las faria a soma por prioridade não fechar com
  o total — há teste conferindo que fecha.

### Em andamento — ainda não commitado

- [Plano de implementação](plano-de-implementacao.md), com 20 etapas.
- Este registro de progresso.
- Tudo o que a etapa B6 produziu.

## 3. O que está pronto, em detalhe

### 3.1 Infraestrutura e ambiente

| Item | Estado |
|---|---|
| PostgreSQL 17 em contêiner, com volume e *healthcheck* | ✅ |
| Portas fixadas nos scripts: API 3000, Operações 3001, Cidadão 3002 | ✅ |
| `.env` e `.env.example` das três aplicações | ✅ |
| `prisma7.config.ts` lendo `DATABASE_URL` | ✅ |

### 3.2 Scaffold das aplicações

| Aplicação | Versões | O que já roda |
|---|---|---|
| API | NestJS 12, Prisma 7.10, TypeScript 6, Vitest 4.1 | Sobe com prefixo `/api/v1`, CORS por `CORS_ORIGINS`, `ValidationPipe` com `whitelist` e `forbidNonWhitelisted`, e Swagger em `/api/docs` |
| Portal de Operações | Next.js 16.3, React 19.2, Tailwind 4, Leaflet 1.9 | Página inicial do scaffold |
| Portal do Cidadão | Next.js 16.3, React 19.2, Tailwind 4, Leaflet 1.9 | Página inicial do scaffold |

Dependências de domínio da API já instaladas: `@nestjs/jwt`, `passport-jwt`, `bcrypt`,
`class-validator`, `@nestjs/swagger`, `@prisma/client` e os tipos do `multer`. A única
dependência nova prevista em todo o plano é `@nestjs/throttler`.

### 3.3 Documentação

| Documento | Conteúdo |
|---|---|
| [arquitetura.md](arquitetura.md) | Visão geral, tecnologias, 14 decisões registradas e os três pontos de troca previstos |
| [glossario.md](glossario.md) | 15 termos do domínio, com o nome correspondente no código |
| [backend/modelo-de-dados.md](backend/modelo-de-dados.md) | 5 entidades, 5 enumerações, ciclo de vida com tabela de transições e 11 regras de negócio |
| [backend/api.md](backend/api.md) | 25 rotas, com exemplos de requisição e resposta e 10 códigos de resposta |
| [plano-de-implementacao.md](plano-de-implementacao.md) | 20 etapas, dependências, caminho crítico e riscos |
| 6 documentos de requisitos | Detalhados em 3.4 |
| 3 `README.md` de aplicação + índice | Visão geral e execução de cada projeto |

### 3.4 Requisitos

| Aplicação | Funcionais | Não funcionais | Prefixo |
|---|---|---|---|
| API | 70 | 51 | `RF-API` / `RNF-API` |
| Portal de Operações | 65 | 56 | `RF-OP` / `RNF-OP` |
| Portal do Cidadão | 42 | 48 | `RF-CID` / `RNF-CID` |
| **Total** | **177** | **155** | — |

Cada requisito tem identificador permanente e prioridade; cada RNF tem ainda a forma de
verificação. Cada documento de RF registra também o escopo negativo da versão.

### 3.5 Verificação cruzada e decisões que ela gerou

A conferência entre requisitos, contrato e modelo de dados apontou 21 divergências, em quatro
grupos: contradições de contrato (8), campos que precisavam ser anuláveis (3), lacunas no
contrato (6) e correções menores (4). Todas resolvidas. As de maior alcance:

| # | Problema encontrado | Resolução |
|---|---|---|
| 1 | A situação `TRIAGE` era inalcançável, e por isso **não havia caminho** para marcar uma ocorrência como improcedente | Triagem em duas etapas ([decisão 11](arquitetura.md#5-decisões-técnicas-registradas)) |
| 2 | O coordenador precisava atribuir responsável, mas a lista de agentes era restrita ao administrador | `GET /reports/assignable-agents` |
| 3 | Não havia como obter os rótulos em pt-BR das enumerações, o que tornava dois RNF inexequíveis | `GET /metadata` e `GET /metadata/internal` ([decisão 12](arquitetura.md#5-decisões-técnicas-registradas)) |
| 4 | O teto de paginação impedia o mapa de exibir o volume exigido pelo seu próprio RNF | `GET /reports/map` e `GET /reports/export`, sem paginação ([decisão 13](arquitetura.md#5-decisões-técnicas-registradas)) |
| 5 | Qualquer pessoa com o `id` podia anexar arquivos a uma ocorrência de terceiros; e o agente podia alterar ocorrência que não era sua | Janela de `RECEIVED` para anexos e restrição ao responsável ([decisão 14](arquitetura.md#5-decisões-técnicas-registradas)) |

`priority`, `resolvedAt` e `comment` passaram a ser anuláveis no modelo de dados — os três
eram obrigatórios em um esquema que só os preenche depois.

### 3.6 Conferências automatizadas em vigor

A documentação é verificada por conferências que qualquer alteração futura deve manter:

- todo identificador de requisito é único e a numeração não tem lacunas;
- todo link e toda âncora entre documentos resolvem;
- as 25 rotas aparecem tanto no contrato quanto nos requisitos, nos dois sentidos;
- todo código de resposta citado em requisito existe na tabela do contrato;
- toda situação do ciclo de vida é alcançável pela tabela de transições;
- toda decisão citada existe no registro da arquitetura;
- os 332 requisitos estão cobertos por alguma etapa do plano.

## 4. O que ainda não existe

Registrado explicitamente, para que a ausência não seja confundida com esquecimento:

- **nenhum módulo de domínio na API** — `auth`, `agents`, `reports`, `report-updates`,
  `attachments` e `dashboard` ainda não existem; das 25 rotas do contrato, só `GET /health`
  está no ar;
- **nenhuma tela** nos dois portais além da página inicial gerada pelo `create-next-app`;
- **nenhum cliente HTTP** nos portais, nenhum tipo compartilhado com a API.

## 5. Próximo passo

**Etapa B7 — Fechamento da API**, do
[plano de implementação](plano-de-implementacao.md#b7-fechamento-da-api): cobertura de testes
das regras centrais, Swagger completo com DTOs e códigos de resposta, e conferência da lista de
requisitos não funcionais.

Depois dela a API está pronta, e o trabalho segue nos portais — **O1 e C1 já destravadas**.

## 6. Como manter este documento

Ao concluir cada etapa do plano:

1. mover a etapa para a linha do tempo, com a data e os commits;
2. atualizar a tabela da seção 1 e remover da seção 4 o que deixou de ser verdade;
3. apontar o próximo passo na seção 5;
4. registrar em [arquitetura.md](arquitetura.md#5-decisões-técnicas-registradas) qualquer
   decisão técnica nova que a etapa tenha exigido.
