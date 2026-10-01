# Registro de progresso

O que já foi construído no SISDEC, o que ainda não existe e qual é o próximo passo.

> Documento vivo: deve ser atualizado ao fim de cada etapa do
> [plano de implementação](plano-de-implementacao.md). Registra **estado**, não intenção —
> um item só é marcado como pronto quando está verificado e commitado.

Última atualização: **1º de outubro de 2026** — API e Portal de Operações concluídos, e
**as 20 etapas do plano concluídas**.

---

## 1. Situação em uma olhada

| Frente | Situação |
|---|---|
| Documentação do projeto | ✅ Completa para a etapa atual — 17 documentos |
| Requisitos (RF e RNF) | ✅ 335 requisitos, nas três aplicações |
| Contrato da API — especificação | ✅ 27 rotas especificadas e conferidas contra os requisitos |
| Plano de implementação | ✅ 20 etapas, cobrindo os 335 requisitos |
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
| Fechamento da API (etapa B7) | ✅ Concluída e verificada |
| Contrato da API — implementação | ✅ **As 27 rotas implementadas**, conferidas contra `api.md` |
| Fundação e sessão do Portal de Operações (etapa O1) | ✅ Concluída e verificada |
| Lista e detalhe da ocorrência (etapa O2) | ✅ Concluída e verificada |
| Atendimento da ocorrência (etapa O3) | ✅ Concluída e verificada |
| Painel de indicadores (etapa O4) | ✅ Concluída e verificada |
| Mapa de ocorrências (etapa O5) | ✅ Concluída e verificada |
| Gestão de agentes (etapa O6) | ✅ Concluída e verificada |
| Fechamento do Portal de Operações (etapa O7) | ✅ Concluída — três conferências manuais pendentes |
| Conjunto de dados de demonstração | ✅ `make seed-demo`, documentado em [dados-de-demonstracao.md](backend/dados-de-demonstracao.md) |
| Atalhos de desenvolvimento | ✅ `Makefile` na raiz, sem acoplar os três projetos |
| Fundação e orientação do Portal do Cidadão (etapa C1) | ✅ Concluída e verificada |
| Formulário de registro, sem o mapa (etapa C2) | ✅ Concluída e verificada |
| Mapa e localização (etapa C3) | ✅ Concluída e verificada |
| Protocolo e acompanhamento (etapa C4) | ✅ Concluída e verificada |
| Fechamento do Portal do Cidadão (etapa C5) | ✅ Concluída — conferências de navegador pendentes |
| **Conferências que exigem navegador** | ⬜ Responsividade em larguras reais, navegadores e leitor de tela |

Em uma frase: **as 20 etapas do plano estão concluídas** — 27 rotas, 284 testes no backend, 53
no Portal de Operações e 181 no do Cidadão. **Resta o que exige um navegador de verdade.**

| Métrica | Hoje |
|---|---|
| Rotas da API implementadas | 27 de 27 do contrato |
| Testes no backend | 160 unitários + 124 end-to-end |
| Testes no Portal de Operações | 53 |
| Testes no Portal do Cidadão | 181 |
| Requisitos especificados | 335, dos quais 248 das duas aplicações já prontas |
| Etapas do plano concluídas | **20 de 20** |

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

### 29 de setembro de 2026 — etapa B7: fechamento da API

Conforme o [plano](plano-de-implementacao.md#b7-fechamento-da-api). **Encerra a API**: as 8
etapas do backend estão concluídas.

- Testes unitários das regras centrais que faltavam: autorização por responsável e por perfil
  no `ReportsManagementService`, o filtro global de exceções e o interceptor de log.
- Swagger completo: **27 operações e 33 esquemas de DTO, com zero lacunas** — conferido por
  auditoria do documento gerado, que exige resumo, resposta de sucesso, `400` em toda rota com
  corpo, `401` em toda rota autenticada e `500` em todas.
- Conferência da [lista de RNF](backend/requisitos-nao-funcionais.md) contra a API rodando.
- 41 testes unitários e 1 e2e novos. Total: **143 unitários e 104 e2e**.

Duas decisões:

- **Os códigos transversais são acrescentados ao documento OpenAPI**, em `swagger-document.ts`,
  e não repetidos em decoradores nas 27 rotas. Repetir convidaria ao esquecimento: uma rota
  nova nasceria sem eles e ninguém notaria.
- **A auditoria do Swagger é um script conferível**, não uma revisão visual: ela é que garante
  que o `RNF-API-38` continue valendo quando uma rota for acrescentada.

A conferência dos RNF encontrou um defeito: um protocolo contendo **byte nulo** virava `500`,
porque o PostgreSQL recusa o caractere. Entrada malformada deve virar `404`, não erro interno
(`RNF-API-09`). A normalização passou a descartar caracteres de controle, como já descartava
espaços. O teste correspondente precisou ser corrigido duas vezes até afirmar a propriedade
certa — o que importa não é o código ser `404`, e sim **nunca ser 500**.

Também conferi, contra a API no ar: CORS recusando origem não listada, nenhum `.env`
versionado, ausência de SQL cru inseguro, nenhuma rotina que altere ou remova `ReportUpdate`,
prefixo `/api/v1` obrigatório, `500` sem vazar detalhe interno e datas em ISO 8601 UTC. Os
tempos de resposta ficaram entre 1 ms e 19 ms, bem dentro dos tetos de 500 ms e 1 s.

### 29 de setembro de 2026 — etapa O1: fundação e sessão do Portal de Operações

Conforme o [plano](plano-de-implementacao.md#o1-fundação-e-sessão). Primeira etapa fora da
API: o portal já autentica, navega e fala com a API ponta a ponta.

- Cliente HTTP único em `lib/api-client.ts`, com tempo limite de 10 s, envio do token e
  tradução de toda falha para mensagem em pt-BR (`lib/api-error.ts`).
- Tipos da API em `types/`, um arquivo por assunto — e o **único** lugar do portal onde os
  valores das enumerações aparecem.
- Carga de `GET /metadata` e `GET /metadata/internal` junto da sessão, entregue às telas de
  servidor e, por um provider, aos componentes de navegador.
- `/login` com guarda de rotas em `src/proxy.ts`, `GET /auth/me` a cada requisição,
  encerramento explícito por `/sair` e retorno à tela pretendida após expiração.
- Moldura com navegação permanente, perfil do agente em pt-BR e o acesso a `/agentes`
  restrito ao administrador; `/`, `/ocorrencias`, `/mapa` e `/agentes` existem como destinos,
  declarando qual etapa as constrói.
- `tsc --noEmit`, lint e `next build` limpos.

**A decisão que moldou o portal inteiro foi a do `RNF-OP-12`**, registrada como
[decisão 15](arquitetura.md#7-sessão-do-portal-de-operações-decisão-15): o token em cookie
`httpOnly` **não pode ser lido pelo JavaScript da página**, então não é o navegador que monta
o cabeçalho `Authorization`. As telas passaram a ser Server Components e as operações, Server
Actions. O ganho não é só o token fora do alcance de script: como o cliente HTTP importa a
leitura do cookie, **o empacotador recusa** qualquer componente de navegador que tente
importá-lo — a fronteira do `RNF-OP-44` é verificada, não confiada à disciplina. Foi
exatamente assim que ela se fez valer: o provider de metadados importava o tradutor de
rótulos de `lib/metadata.ts` e arrastava o cliente HTTP para o pacote do navegador. O build
quebrou e apontou a cadeia inteira; o tradutor virou módulo próprio, sem importação de
servidor.

**Um defeito que o build não pega.** Um arquivo `'use server'` só pode exportar funções
assíncronas — o valor inicial do estado do formulário, exportado de `actions.ts`, era
registrado como se fosse uma segunda ação de servidor. `tsc`, lint e `next build` passaram
limpos; o envio do formulário respondia `500`. Só apareceu ao submeter o login de verdade.
O estado foi para `features/auth/sign-in-state.ts`.

Duas outras decisões:

- **A moldura autenticada vive no layout raiz**, e não em um grupo de rotas, para que exista
  *uma* decisão sobre quando a navegação aparece: há sessão, ou não há. O `/login` cai no
  mesmo layout e simplesmente não recebe a moldura.
- **O portal é somente claro.** Manter um tema escuro dobraria a superfície a conferir em
  contraste — inclusive nas cores de situação e prioridade que O2 acrescenta — sem servir ao
  contexto de uso descrito nos RNF: estação de trabalho interna, em ambiente iluminado.

A verificação foi feita contra a API no ar, com o portal respondendo: rota protegida sem
sessão desvia para `/login` **antes de renderizar** e sem nenhum dado no corpo; o token não
aparece no HTML entregue; `/login` com sessão desvia para o painel; sair apaga o cookie;
token inválido leva a `/sair?motivo=expirada` e volta ao login com o aviso e o destino
guardados; coordenador recebe `404` em `/agentes` e não vê o item na navegação; e o login
funciona **sem JavaScript**, com a senha errada devolvendo mensagem genérica e preservando o
e-mail digitado. Com a API desligada, as três telas mostram a mensagem de indisponibilidade —
nenhuma em branco, nenhuma técnica.

### 29 de setembro de 2026 — seed de demonstração

Não é etapa do plano: é ferramenta de trabalho, criada porque as etapas O2 a O6 não podem ser
construídas contra um banco vazio.

- `prisma/seed-demo.ts` e `npm run seed:demo`, **separados** do `seed.ts`: aquele cria o
  agente do primeiro acesso, que é dado de produção; este cria dado que só serve para
  exercitar as telas. O de demonstração fica fora do `prisma7.config.ts`, então
  `prisma db seed` nunca o executa.
- Quatro contas — coordenador, dois agentes e um agente **inativo**. A segunda conta de agente
  e a inativa não são enfeite: `RF-OP-64` exige um agente que **não** seja o responsável, e
  `RF-OP-53` exige um inativo para distinguir na lista.
- 14 ocorrências cobrindo as seis situações, as quatro prioridades, seis bairros, com e sem
  coordenadas, identificadas e anônimas, espalhadas nos últimos 40 dias, com 24 andamentos.

**Não apaga nada**, por duas razões. A primeira é a de sempre: um seed que limpa o banco
apaga o trabalho de quem o roda por engano. A segunda é do domínio — o `ReportUpdate` é
somente-adição, e uma rotina do repositório que removesse andamentos contradiria a
propriedade que a etapa B5 estabeleceu, mesmo sendo ferramenta de desenvolvimento. As contas
são criadas ou atualizadas pelo e-mail, sem sobrescrever senha trocada pela API; as
ocorrências só entram em banco sem nenhuma, e `SEED_DEMO_FORCE=1` insere assim mesmo.

Os protocolos continuam a sequência do ano a partir do maior já gravado, reaproveitando o
`protocol-number.ts` da API — conferido registrando uma ocorrência pela API depois do seed e
vendo sair `SISDEC-2026-000015`. A suíte e2e continua passando com os dados de demonstração no
banco (104 testes), e eles sobrevivem à execução dela: a limpeza das suítes de fato só alcança
o que elas mesmas criaram.

### 29 de setembro de 2026 — etapa O2: lista e detalhe da ocorrência

Conforme o [plano](plano-de-implementacao.md#o2-lista-e-detalhe-da-ocorrência).

- `/ocorrencias` com tabela semântica, nove filtros combináveis, busca com atraso de 400 ms,
  ordenação por data e por prioridade, paginação e atalho para as próprias ocorrências.
- `/ocorrencias/[id]` com relato, fotos com ampliação, mapa do ponto, dados do cidadão ou a
  marca de registro anônimo, e histórico distinguindo interno de visível ao cidadão.
- `<ReportMap>` em `components/map/`, o único ponto do portal que importa o Leaflet.
- Extensão do seed de demonstração com fotos.

**A etapa revelou uma lacuna entre os dois documentos de requisitos.** O `RF-OP-19` pede
ordenação da lista por data e por prioridade; o `RNF-OP-20` proíbe ordenar no navegador — e
com razão, porque a lista é paginada e ordenar a página corrente reordenaria vinte linhas em
vez da lista. Só que **nenhum requisito da API previa ordenação**: `GET /reports` sempre
devolvia por data decrescente. Não era divergência entre dois textos, como as 21 que a
verificação cruzada encontrou; era uma ausência nos dois, que só aparece ao construir a tela.
Entrou como `RF-API-71`, com lista branca de dois campos — não um nome de coluna vindo da
query —, ocorrências sem prioridade sempre ao fim e desempate por `id`, sem o qual a paginação
repete e pula linhas em caso de empate. Seis testes e2e e sete unitários.

Três decisões da tela:

- **Os filtros vivem na URL**, não em estado de componente. `RF-OP-21` (lista recarregável e
  compartilhável) e `RNF-OP-03` (filtros preservados ao voltar do detalhe) saem de graça
  disso: voltar é navegar para a mesma URL, e não há estado a restaurar. O detalhe carrega o
  recorte em um parâmetro, então **a volta funciona até para quem chegou por um link colado**,
  sem depender do histórico do navegador.
- **As cores de situação e prioridade moram em `types/`**, junto das enumerações, porque a
  chave do mapa é um valor da API e o `RNF-OP-45` restringe esses literais àquela pasta. São
  `Record` sem opcionais: acrescentar uma situação sem lhe dar cor **não compila**.
- **A ampliação da foto é um `<dialog>` nativo**, que já traz foco preso, fechamento por Esc e
  fundo inerte — um `role="dialog"` próprio exigiria reimplementar tudo isso.

Dois defeitos encontrados ao exercitar a tela:

- **a lista dizia "nenhuma ocorrência registrada ainda" em qualquer página além da última** —
  falso, e enganoso: o recorte tinha 14 resultados, só não naquela página. São três estados
  vazios distintos, e confundi-los engana quem abre um link compartilhado cujo recorte
  encolheu. Agora a página além da última diz quantas existem e leva à primeira;
- **as miniaturas voltavam `400`**: o Next 16 recusa otimizar imagem cujo host resolva para IP
  privado, porque um otimizador que busca qualquer endereço vira porta de SSRF para a rede
  interna. Como nesta etapa a API roda em `localhost`, a exceção foi ligada **apenas em
  desenvolvimento** — em produção a API terá endereço público e a permissão deixa de ser
  necessária. A miniatura saiu com 965 bytes contra 7,7 kB do arquivo íntegro (`RNF-OP-24`).

**O `RF-OP-30` não fecha aqui**, ao contrário do que o plano previa: "oferecer apenas as ações
compatíveis" pressupõe ações, e elas são a etapa O3. O que existe já é a metade que cabia
agora — o aviso do `RF-OP-64`, dizendo o motivo de um agente não poder agir, aparece antes dos
botões existirem. Decidir se o portal espelha a tabela de transições da API ou se a API passa
a devolvê-la no detalhe fica para O3: espelhar duplica uma regra que já divergiu uma vez neste
projeto.

Uma limitação de contrato registrada: **o filtro por responsável só aparece para coordenador e
administrador**, porque `GET /reports/assignable-agents` é restrito a esses perfis e não há
outra rota que liste agentes. Para o agente comum o recorte equivalente é o atalho "Minhas
ocorrências" (`RF-OP-20`).

Verificado contra a API no ar, com os dados de demonstração: nenhum valor em inglês na tela;
filtros, ordenação por prioridade e paginação conferidos linha a linha contra o banco; os três
estados vazios; recorte inválido mantém os filtros à vista com a mensagem de recusa; a volta do
detalhe reconstrói o recorte; id inexistente e id malformado dão `404`; o Leaflet **não**
aparece em nenhum script do painel nem da lista; e um agente vê o aviso na ocorrência de outro
e não o vê na sua.

### 29 de setembro de 2026 — extensão do seed: fotos de demonstração

- Sete fotos em quatro ocorrências, duas delas já em atendimento — o caso em que o agente de
  fato abre a galeria.
- As imagens são **geradas** (`prisma/demo-image.ts`, PNG com faixas de cor), e não binários
  versionados: o envio confere o tipo pela assinatura do arquivo, então precisam ser imagens de
  verdade; e serem sintéticas deixa evidente que o dado é de demonstração.

**O seed não grava no disco.** Ele envia pelo `POST /reports/:id/attachments`, o mesmo endpoint
que o Portal do Cidadão usará. Gravar direto em `UPLOAD_DIR` furaria por fora o limite da
[decisão 07](arquitetura.md#armazenamento-de-anexos-decisão-07) — só `modules/attachments`
conhece caminho de arquivo — sem aparecer em nenhuma busca por `fs` nos módulos. Em troca, as
fotos de demonstração percorrem a mesma conferência de assinatura, tamanho e quantidade que as
reais.

Isso obrigou a criar cada ocorrência em três fases: recebida como o cidadão a deixa, depois as
fotos — a API só as aceita em `RECEIVED` (`RF-API-69`) —, e só então a situação atual e o
histórico. A API é exigida **apenas** para os anexos: sem ela, o seed avisa e segue, e um banco
de demonstração sem fotos continua servindo.

### 29 de setembro de 2026 — etapa O3: atendimento

Conforme o [plano](plano-de-implementacao.md#o3-atendimento). Fecha o ciclo de vida da
ocorrência dentro do portal: o que a API sabia fazer desde B5 agora tem tela.

- Triagem em duas etapas, atribuição de responsável, mudança de situação e registro de
  andamento, todos como *Server Actions*.
- `RF-API-72` na API: `GET /reports/:id` passou a devolver `availableTransitions`, resolvida
  para quem pergunta.

**A decisão que abriu a etapa** está registrada como
[decisão 16](arquitetura.md#8-transições-oferecidas-pela-api-decisão-16): quais ações o detalhe
oferece é **calculado pela API**, não por uma cópia da tabela de transições no portal. A tabela
já divergiu uma vez aqui — foi ela que deixou a situação `TRIAGE` inalcançável —, e a
[decisão 12](arquitetura.md#5-decisões-técnicas-registradas) já fixara o princípio um nível
abaixo, nas enumerações. Copiá-la traria junto uma regra de autorização, a do responsável; o
`RNF-OP-14` continua valendo nas duas opções, mas só na cópia a conveniência pode passar a
**discordar** da proteção em silêncio.

Na API, a conferência de perfil e a do responsável viraram predicados nomeados usados tanto
pela listagem quanto pela execução — uma implementação, não duas. Um teste unitário afirma que
concordam em toda combinação de situação, perfil e atribuição; um e2e afirma a propriedade da
qual a tela depende: **o que é oferecido é aceito, e o que não é oferecido é recusado**.

Duas ações não são transição de situação e seguem decididas no portal: atribuir responsável
(coordenação) e registrar andamento (todos). São uma linha cada, fixadas pelo contrato de cada
rota.

**Três defeitos que só o uso mostrou**, os dois primeiros na mesma família — estado do React
onde deveria haver campo de formulário:

- **a escolha "visível ao cidadão" não chegava ao servidor sem JavaScript.** A caixa alimentava
  um campo oculto pelo estado, e sem JS ia sempre `false`: o agente marcaria a caixa e o
  andamento seria gravado como interno, sem nada indicar o contrário. A caixa passou a carregar
  o próprio `name` e `value`; desmarcada não envia nada, e ausência é interno — o padrão certo.
  Mesma correção no botão de desfecho da triagem;
- **o comentário de encerramento vai a público, e a tela não avisava.** A API marca **toda**
  mudança de situação como visível ao cidadão, para que o acompanhamento por protocolo mostre o
  andamento — comportamento de B5, não defeito. Mas o `RF-OP-37` só previa o aviso no
  andamento com caixa de visibilidade, e este caso é o mais fácil de errar justamente por não
  ter caixa nenhuma para marcar. O aviso passou a acompanhar também os comentários de triagem e
  de mudança de situação;
- **as recusas da API chegavam ao agente com nome de campo em inglês** — «priority é
  obrigatória», «comment é obrigatório na transição para REJECTED». São mensagens escritas para
  quem integra, não para quem atende, e o `RNF-OP-05` pede pt-BR sem código técnico. As duas
  conferências passaram a ser feitas antes do envio, com texto do portal. Elas repetem regras do
  **endpoint de triagem** — encaminhar exige prioridade, recusar exige justificativa —, fixadas
  pelo contrato daquela rota e não pela tabela de transições, que continua sendo só da API.

Uma consequência de projeto que vale registrar: `requiresComment` é preenchido pelo estado da
tela e **fica desatualizado sem JavaScript**. Onde a exigência é decisiva ela não depende mais
desse campo; onde ele é apenas conveniência, a API segue como juíza. É a degradação certa —
sem JS a tela avisa um pouco menos cedo, mas nunca grava o que não devia.

Verificado contra a API no ar, percorrendo os formulários **sem JavaScript**: assumir triagem →
encaminhar com prioridade → atribuir → encerrar, conferindo situação, prioridade, responsável e
histórico no banco a cada passo. O agente que não é o responsável não vê a seção de
encerramento e vê o motivo; encerrar sem comentário é recusado junto ao campo; a ocorrência
encerrada diz que a situação não muda mais e mantém o histórico aberto; o andamento marcado
como visível aparece na consulta pública por protocolo, que continua sem vazar dado pessoal.

### 29 de setembro de 2026 — etapa O4: painel

Conforme o [plano](plano-de-implementacao.md#o4-painel).

- Indicadores de cabeçalho, distribuições por situação, prioridade, tipo e bairro, gráfico de
  volume diário e recorte por período.
- `RF-API-73` na API: a noção de ocorrência **em aberto** passou a ser explícita.

**A lacuna desta etapa** foi a terceira do mesmo padrão. O `RF-OP-10` pede destaque para as
críticas e altas **ainda não concluídas**, mas `byPriority` contava todas, e o filtro da lista
não sabia separar as abertas. Nos dados de demonstração a diferença é gritante: *3 altas no
total, 1 ainda em aberto* — o painel anunciaria o triplo do que exige atenção. A noção entrou
em três superfícies de uma vez (filtro `?open=true`, `openByPriority` no resumo e `open` no
detalhe), e a lista de situações abertas passou a ser **derivada da tabela de transições** em
vez de escrita à mão: ela existia copiada em dois services da API e num terceiro lugar do
portal.

Vale nomear o padrão, já registrado no
[plano](plano-de-implementacao.md#5-cobertura-dos-requisitos): os requisitos da API foram
escritos do ponto de vista da API, e os dos portais do ponto de vista das telas. As costuras
aparecem exatamente onde uma tela precisa de um recorte que a API não previu — e só aparecem
ao construir a tela, não relendo os documentos.

Duas decisões de visualização, tomadas com o validador de paleta na mão:

- **as barras do painel têm um matiz só.** A barra codifica magnitude; quem diz de qual
  situação ou bairro se trata é o rótulo ao lado. Medidas pelo validador, as cores de
  prioridade do portal ficam a **ΔE 2,8 para deuteranopia** entre crítica e alta —
  indistinguíveis. Elas continuam válidas onde estão, porque sempre acompanham rótulo
  (`RNF-OP-31`), mas usá-las como série de gráfico seria pedir à cor o que ela não entrega;
- **a linha "Aguardando triagem" não é clicável.** A API não tem filtro para ausência de
  prioridade, e um link para as recebidas daria um número diferente do exibido — as em triagem
  também estão sem prioridade. Link que leva a outro recorte é pior do que link nenhum.

**Dois defeitos encontrados ao exercitar a tela:**

- **as dicas de valor do gráfico saíam vazias.** O React 19 trata `<title>` como elemento
  especial e descarta o conteúdo quando recebe vários filhos — o meu tinha interpolação de data
  e de número. `tsc`, lint e build passaram limpos, e o HTML trazia catorze `<title></title>`.
  Passou a receber uma única string;
- **um valor de enumeração escapou de `types/`**, num endereço montado por *template string*.
  A busca que eu vinha usando procurava o literal entre aspas e não o via. A conferência do
  `RNF-OP-45` passou a ser por palavra, sem exigir aspas.

Também corrigi um defeito da API que só apareceu porque os novos testes escrevem em paralelo:
**os seis números do resumo eram lidos em consultas concorrentes**, então uma ocorrência
registrada no meio fazia a soma por situação não fechar com o total. Passaram a ser lidos numa
transação `RepeatableRead` — um painel que se contradiz é pior do que um painel alguns
milissegundos mais velho. A suíte e2e foi rodada três vezes seguidas com o mesmo resultado.

Verificado contra a API no ar: cada indicador leva a uma lista cujo total **bate com o número
exibido** — conferido nos cinco recortes; o período acompanha os links; o gráfico tem rótulo
acessível, valor por barra e tabela alternativa aberta por `<details>`.

### 29 de setembro de 2026 — testes do portal e abertura da lista de agentes

Duas coisas fora do plano, ambas pedidas depois de O4.

**Suíte de testes do Portal de Operações** — 48 testes nesta data, Vitest + Testing Library;
as etapas O5 a O7 a levaram a 53. O alvo são as
peças que **decidem** algo, não as telas inteiras: o recorte lido da URL e a sua ida e volta, a
tradução de falhas da API, os rótulos das enumerações, os predicados de perfil, a formatação de
datas no fuso fixado, e os dois componentes do painel. Telas e Server Actions ficam de fora —
dependem da API no ar, e continuam verificadas pelo percurso manual.

O teste mais útil é o do gráfico: ele reintroduz a condição do defeito do React 19 — `<title>`
com vários filhos vem vazio — e **falha**. Conferi desfazendo a correção e vendo o teste quebrar,
porque um teste de regressão que nunca falhou não protege nada.

Instalar o Vitest exigiu subir o `@types/node` do portal de `^20` para `^24`, que é a versão do
Node em uso e a mesma do backend.

**`GET /reports/assignable-agents` deixou de ser restrito à coordenação.** A restrição
acompanhava a *ação* de atribuir, e vazou para uma *leitura* que o `RF-OP-16` — filtro por
responsável, essencial para o perfil *Agente* — precisa. O filtro sumia justamente para o perfil
mais numeroso. Não havia o que proteger: a resposta traz só `id` e `name`, os mesmos nomes que o
agente já lê na coluna "Responsável". `PATCH /reports/:id/assign` segue restrito, e há teste e2e
afirmando os dois lados.

### 30 de setembro de 2026 — etapa O5: mapa

Conforme o [plano](plano-de-implementacao.md#o5-mapa). O `<ReportMap>` já existia desde O2,
servindo um ponto no detalhe; aqui ele passou a servir o conjunto.

- `/mapa` com os pontos abertos, filtros por situação, tipo, prioridade e período, resumo ao
  acionar o ponto com acesso ao detalhe, legenda, aviso de teto atingido e contagem das
  omitidas sem coordenadas.

**A cor por prioridade ganhou forma junto.** O `RF-OP-42` pede diferenciação por cor, e o
validador de paleta mostrou na etapa anterior que crítica e alta ficam a **ΔE 2,8 para
deuteranopia**. Numa lista isso é tolerável, porque o rótulo está ao lado; num mapa de
alfinetes não há rótulo nenhum. Cada prioridade passou a ter forma própria — triângulo,
losango, quadrado, círculo — e a ocorrência sem triagem um anel vazado. A legenda mostra as
duas pistas juntas, e há teste afirmando que nenhuma forma se repete: se alguém acrescentar uma
quinta prioridade e reaproveitar uma forma, a segunda pista sumiria em silêncio.

Duas decisões:

- **O balão é montado como elemento do DOM**, não como texto HTML. O conteúdo inclui dados
  vindos da API, e concatenar marcação é exatamente o que o `RNF-OP-17` proíbe; com
  `textContent` não há como um relato do cidadão virar marcação. A busca por `innerHTML` e
  `dangerouslySetInnerHTML` no portal continua vazia;
- **a lista dos mesmos pontos está sempre presente**, aberta por um `<details>`, e não é um
  plano B que aparece no erro. O `RF-OP-46` pede a tela utilizável sem o mapa, e um caminho que
  só roda na falha é um caminho que ninguém testa. Ela serve igualmente a quem navega por
  teclado, para quem um mapa de alfinetes não diz nada.

Verificado contra a API no ar: os quatro filtros recortam o mapa e o recorte atravessa para a
lista; a legenda traz as cinco formas distintas; o `tileLayer` **não** aparece em nenhum script
do painel, da lista nem de agentes. O aviso de teto atingido foi exercitado de verdade —
inseri 520 ocorrências com coordenadas, a API devolveu `truncated: true` com 500 pontos, a tela
avisou, e a carga foi removida em seguida.

Um susto que não era defeito: a nota da legenda aparecia **depois** da lista no HTML. É o
*streaming* fora de ordem do React, que emite o trecho num `<div hidden>` e o recoloca por
script — o meu extrator de texto descartava os scripts e via a ordem crua.

### 30 de setembro de 2026 — etapa O6: gestão de agentes

Conforme o [plano](plano-de-implementacao.md#o6-gestão-de-agentes). Última etapa de construção
do Portal de Operações; resta O7, o fechamento.

- `/agentes` restrita ao administrador, com a relação, o cadastro, a edição de dados e perfil,
  a redefinição de senha e a desativação com confirmação.

Três decisões:

- **A casca das ações virou `components/ui/action-form.tsx`**, sem saber o que é ocorrência. Ela
  nasceu em O3 amarrada a `reportId`; agora recebe os campos ocultos de quem chama. O bloqueio
  do botão durante o envio, a confirmação, o anúncio do resultado e a limpeza após o sucesso
  continuam num lugar só — que é o ponto de ter a casca;
- **cadastrar e editar usam o mesmo formulário.** A única diferença é a senha: obrigatória ao
  cadastrar, opcional ao editar, onde preenchê-la redefine. Duas telas quase iguais divergiriam
  na primeira alteração;
- **a edição e a desativação ficam dentro da linha da tabela**, num `<details>`. Uma tela à
  parte faria o administrador perder de vista quem está editando.

Uma recusa que a tela passou a dar antes da API: senha com menos de 8 caracteres. A API
responde «password deve ter ao menos 8 caracteres» — nome de campo em inglês, que o
`RNF-OP-05` não quer na tela. O conflito de e-mail repetido, ao contrário, é repassado como
vem: a mensagem da API já é uma frase em pt-BR, sem jargão.

Verificado contra a API no ar, pelos formulários e **sem JavaScript**: a coordenadora recebe
`404` em `/agentes`; o administrador cadastra, e o mesmo e-mail de novo devolve o conflito
compreensível; a alteração de perfil chega ao banco; o administrador **não** consegue desativar
a própria conta e a dele continua ativa; o agente desativado é rotulado como inativo na lista,
some de `assignable-agents` e recebe `401` no login. As contas de teste foram removidas em
seguida.

### 30 de setembro de 2026 — etapa O7: fechamento do Portal de Operações

Conforme o [plano](plano-de-implementacao.md#o7-fechamento-do-portal). **Encerra o Portal de
Operações**: as sete etapas estão concluídas.

- Exportação da lista em CSV, com o recorte aplicado, restrita a coordenação e administração.
- Conferência da [lista de RNF](frontend-operations/requisitos-nao-funcionais.md).

**A exportação precisou de um *route handler*, não de um link para a API.** O token vive em
cookie `httpOnly`, então o navegador não consegue autenticar a chamada sozinho. O servidor do
Next lê o cookie, chama a API e **repassa o corpo em fluxo** — a API o gera lote a lote
justamente para que a exportação não dependa do tamanho da base, e bufferizá-lo aqui desfaria
isso. A falha também desce como arquivo: o acionamento foi um download e o navegador já saiu da
página, então devolver HTML de erro mostraria a tela técnica que o `RNF-OP-25` proíbe.

**Um defeito que só apareceu ao abrir o arquivo.** O CSV trazia `RISK_ALERT`, `IN_PROGRESS`,
`HIGH` — o cabeçalho vinha em pt-BR desde B6, mas as linhas, não. O `RF-API-70` só prometia o
cabeçalho; o `RNF-OP-09` é que proíbe mostrar ao agente os valores em inglês, e uma planilha
que ele abre é interface como qualquer tela. A geração passou a usar os mesmos rótulos que
`GET /metadata` serve aos portais, de modo que planilha e tela não divirjam, e a ausência de
prioridade virou "Sem triagem" em vez de célula vazia — célula vazia se confunde com dado
faltando.

**A conferência de contraste pegou uma margem frágil.** Medi os dez pares texto/fundo do portal
pela fórmula do WCAG 2.1: todos passavam, mas `success` sobre `success-soft` dava 4,51 contra o
mínimo de 4,5 — um ajuste de matiz e quebraria. O tom foi escurecido para 6,0:1.

O que foi conferido por código, na aplicação gerada: **nenhum** campo de formulário sem rótulo
associado nas três telas com filtros; os oito cabeçalhos da tabela de ocorrências com `scope`;
nenhuma chamada a `console` no código do portal; nenhum `dangerouslySetInnerHTML` nem
`innerHTML`; nenhum elemento não interativo com `onClick` — o percurso por teclado se apoia em
`a`, `button`, `select`, `input`, `details` e `dialog` nativos; só `NEXT_PUBLIC_API_URL` como
variável de ambiente, e o `.env.example` em dia.

**O que não pude conferir**, e fica registrado como tal: a inspeção em **1280 px e 768 px**
(`RNF-OP-39`, `RNF-OP-40`), os **navegadores** (`RNF-OP-41`) e o **leitor de tela**
(`RNF-OP-35`). Não há navegador neste ambiente; o que fiz foi conferir a estrutura que
sustenta esses requisitos, não operá-los. São três verificações manuais que continuam
pendentes.

### 30 de setembro de 2026 — atalhos de desenvolvimento e documentação do conjunto de demonstração

Dois acréscimos de apoio, fora da sequência de etapas do plano.

- **`Makefile` na raiz**, com `make setup` para a primeira execução do zero e `make dev` para
  subir banco, API e os dois portais juntos. Ele **não é um sistema de build**: só entra na
  pasta certa e chama o comando que já existe ali.

  Foi um `Makefile`, e não um `package.json` na raiz, de propósito: um `package.json` ali
  criaria um quarto projeto Node, com `node_modules` e resolução de dependências próprios —
  exatamente o acoplamento que a [decisão 01](arquitetura.md#5-decisões-técnicas-registradas)
  evita ao manter os três projetos de `core/` independentes. Apagar o `Makefile` não impede
  nenhum deles de ser instalado ou executado, e é esse o teste de que nada foi acoplado.

- **[dados-de-demonstracao.md](backend/dados-de-demonstracao.md)**, descrevendo o que
  `make seed-demo` cria: as contas de cada perfil, as ocorrências em situações diferentes e as
  fotos. Existe porque quem for avaliar o trabalho precisa saber com que credenciais entrar e o
  que esperar de cada tela — informação que, sem documento, viveria só na cabeça de quem
  escreveu o seed.

### 1º de outubro de 2026 — etapa C1: fundação e orientação do Portal do Cidadão

Conforme o [plano](plano-de-implementacao.md#c1-fundação-e-orientação). Começa a **Parte III**.

- Cliente HTTP único em `lib/`, sobre `NEXT_PUBLIC_API_URL`, com tempo limite de 15 s e
  tradução das falhas para texto que o cidadão entende. Consome **apenas** `GET /metadata`.
- Layout *mobile first* a partir de 320 px, com atalho "ir para o conteúdo", cabeçalho que dá
  acesso às orientações de qualquer tela e rodapé com os telefones.
- Página inicial com os dois caminhos — registrar e acompanhar — e o aviso de **199 / 193**.
- `/orientacoes`, com as situações que exigem ligação imediata, o que fazer antes da chegada da
  equipe e como ajudar o atendimento.
- 41 testes.

Quatro decisões:

- **O aviso de emergência vem antes dos dois caminhos**, na página inicial. Se a pessoa está
  diante de um risco imediato, a informação mais útil da página não é como registrar uma
  ocorrência. Os números são links `tel:`, para que um toque no celular já inicie a chamada.
- **Os telefones vivem em um só lugar** (`lib/emergency.ts`), porque aparecem em várias telas e
  dentro de mensagens de erro. Um número divergente em uma delas seria um defeito grave —
  alguém pode ligar. Há teste conferindo os dois números e o formato de discagem.
- **A lista de situações urgentes vem da API**, dos tipos marcados como `urgent`. Escrevê-la à
  mão faria esta página divergir do formulário de registro, que usa a mesma marcação para
  reforçar o aviso — e divergir justamente sobre o que é urgente.
- **O contraste é medido por teste**, sobre o próprio `globals.css`: dez pares texto/fundo pela
  fórmula do WCAG 2.1, mais o branco sobre os fundos de botão. Um ajuste de matiz passa a ser
  medido, em vez de depender de alguém lembrar de refazer a conta à mão. A área de toque de
  44 px é aplicada por seletor de elemento, para que um botão novo nasça com ela.

**Um defeito de comportamento que só apareceu ao rodar a aplicação.** A página de orientações
era pré-gerada no build. Com a API fora do ar nesse momento, a **tela de falha era assada na
página** e servida assim por uma hora inteira, mesmo com a API já de volta — e esta é a página
que diz quando ligar 199. Ela passou a ser renderizada por requisição, mantendo o cache de uma
hora apenas na chamada a `GET /metadata`: o conteúdo é quase todo estático, então o custo é
baixo, e a página volta sozinha quando a API volta.

**Uma verificação minha estava errada, e quase passou.** Ao testar o caso frio — sem cache e sem
API —, a página aparecia completa, o que eu interpretei como degradação elegante. Era uma
instância antiga do servidor, que não havia morrido: a nova falhava com `EADDRINUSE` e eu lia a
velha, com os metadados em memória. Só notei ao conferir o log do processo. Refeito o teste com
o servidor certo, o comportamento é o previsto: mensagem compreensível, telefones repetidos e
nenhum erro técnico.

### 1º de outubro de 2026 — etapa C2: formulário de registro, sem o mapa

Conforme o [plano](plano-de-implementacao.md#c2-formulário-de-registro-sem-o-mapa). O cidadão já
registra uma ocorrência com fotos e recebe o protocolo.

- Formulário em cinco etapas, com indicação de progresso em texto, validação por etapa e
  retorno sem perda do que foi digitado.
- Etapa 1 reforça o aviso de emergência quando o tipo escolhido é de risco imediato à vida.
- Etapa 3 com descrição e até 5 fotos, com prévia, remoção e recusa local pelos limites vindos
  de `metadata.upload`.
- Etapa 4 com nome, e-mail e telefone opcionais, e "prefiro não me identificar".
- Etapa 5 com revisão e atalho para corrigir cada etapa, e o envio em duas chamadas.
- 66 testes novos; 107 no portal.

Quatro decisões:

- **O estado vive no cliente**, porque as fotos são objetos `File`. Mantê-las no servidor
  exigiria subi-las antes de a pessoa terminar de preencher, e uma desistência deixaria arquivos
  órfãos no `UPLOAD_DIR`.
- **A validação é função pura, fora do React** (`validation.ts`). É o que permite testá-la sem
  montar a tela, e concentra a decisão de "pode avançar?" em um lugar em vez de espalhá-la pelos
  componentes de cada etapa.
- **O envio confere o rascunho inteiro, não só a etapa atual.** Alguém pode preencher tudo,
  voltar à etapa 2, apagar o bairro e tentar enviar da revisão; `firstInvalidStep` leva de volta
  à etapa pendente em vez de deixar a API recusar. Há teste para esse percurso.
- **Falha nas fotos não apaga o registro** (`RF-CID-24`). A ocorrência já está criada quando o
  envio dos anexos começa, então o protocolo aparece de todo modo, com um aviso — esconder o
  número tiraria da pessoa a única forma de acompanhar o atendimento.

**Um defeito de acessibilidade que o teste pegou.** Três botões e links montavam o nome
acessível juntando texto visível com um `<span class="sr-only">`. O JSX colapsa o espaço entre os
dois, e o leitor de tela anunciaria "Removera foto arvore.jpg" e "SISDEC— início". Passaram a
declarar `aria-label` por inteiro, e há teste fixando o comportamento. O defeito é invisível na
tela: só aparece ao pedir o nome acessível, que é exatamente o que o teste faz.

**Uma divergência no plano, corrigida.** O `RNF-CID-23` (compressão das fotos no navegador)
estava listado na cobertura de C2, mas a tarefa correspondente é de C5. A atribuição foi
movida; a compressão não entrou nesta etapa.

Sobre a tela de confirmação: o protocolo já aparece em destaque ao final do envio, para que o
fluxo de C2 esteja completo. A rota dedicada `/registrar/confirmacao`, com botão de copiar e o
alerta de guardar o número, é a etapa **C4**.

### 1º de outubro de 2026 — etapa C3: mapa e localização

Conforme o [plano](plano-de-implementacao.md#c3-mapa-e-localização). O ponto no mapa fecha o
registro; o ciclo cidadão → agente está completo.

- `<LocationPicker>` em `components/map/`, carregado com `dynamic(..., { ssr: false })`.
- Botão "usar a minha localização", e marcação à mão por toque ou arrasto do marcador.
- Coordenadas no rascunho, no envio e na revisão; registro segue aceito sem elas.
- 11 testes novos; 134 no portal.

Quatro decisões:

- **O Leaflet está em exatamente um arquivo**, e os seus tipos aparecem só dentro da
  implementação — a interface pública trabalha com `{ latitude, longitude }`. Conferido por
  busca: nenhuma menção a `leaflet` fora de `components/map/`.
- **O mapa só é montado quando a pessoa pede.** Serve a dois requisitos de uma vez: quem vai
  apenas acompanhar um protocolo não baixa o Leaflet (`RNF-CID-22` — está num chunk próprio de
  148 K, e o HTML inicial de `/registrar` não o menciona), e deixa explícito que o ponto é
  opcional (`RF-CID-13`).
- **A localização é pedida apenas por acionamento** (`RNF-CID-33`). Nada no carregamento toca em
  `navigator.geolocation` — o navegador não deve exibir pedido de permissão sem a pessoa ter
  pedido. Há teste conferindo que montar o componente não chama `getCurrentPosition`.
- **As coordenadas aparecem em texto, ao lado do mapa.** Quem usa leitor de tela não tem como ler
  a posição de um marcador; sem isso, não haveria confirmação de que a escolha foi registrada.

**Duas regras de lint que apontaram erros reais**, e não ruído. `react-hooks/refs` pegou uma
escrita em referência durante a renderização — o React pode descartar uma renderização pela
metade, e a escrita passou para um efeito. `react-hooks/set-state-in-effect` pegou um estado que
só existia para espelhar a presença de `navigator.geolocation`; a verificação passou para o
momento do acionamento e o estado desapareceu. Sem suporte, o botão continua visível e explica o
motivo, em vez de sumir sem dizer por quê.

**Um teste meu estava escrito errado.** Dois casos falhavam por não encontrar o `role="alert"`:
eu usava `.click()` cru, que não libera a atualização de estado do React para a asserção
seguinte. Trocado por `fireEvent.click`, que envolve em `act`. Os testes que já passavam o
faziam porque verificavam a chamada do mock, não o que a tela mostra depois.

Verificado contra a pilha no ar: uma ocorrência registrada com ponto grava as coordenadas no
banco e **aparece no mapa do Portal de Operações**; uma sem ponto é aceita e contada em
`omittedWithoutCoordinates`.

### 1º de outubro de 2026 — etapa C4: protocolo e acompanhamento

Conforme o [plano](plano-de-implementacao.md#c4-protocolo-e-acompanhamento). **O sistema funciona
ponta a ponta**: o cidadão registra, recebe o protocolo e acompanha; os agentes atendem.

- `/registrar/confirmacao` com o protocolo como elemento de maior destaque, botão de copiar com
  confirmação visual e o alerta de que é a única forma de acompanhar.
- `/acompanhar` com a consulta por protocolo, tolerante a caixa e espaços.
- `/acompanhar/[protocolo]` com a situação, a explicação do que ela significa, os dados públicos
  e o histórico visível.
- 28 testes novos; 162 no portal.

Quatro decisões:

- **O protocolo vai na URL da confirmação.** É o que permite recarregar a página, imprimi-la ou
  salvá-la (`RF-CID-29`) — não aconteceria se ele vivesse só na memória do formulário.
- **A tela distingue número malformado de ocorrência inexistente.** São problemas diferentes e a
  orientação muda: num caso mostrar a forma esperada, no outro sugerir conferir um dígito. Um
  `404` genérico para os dois seria mais simples e menos útil.
- **O botão de copiar tem recurso alternativo.** `navigator.clipboard` não existe em contexto
  inseguro nem em todo navegador, e aqui a falha é grave: sem o número a pessoa perde o único meio
  de acompanhar. Há `document.execCommand` como alternativa e, se nem ele funcionar, a orientação
  de anotar à mão — nunca um silêncio.
- **A situação vem com uma explicação, além do rótulo.** A API devolve "Em triagem", que é curto
  por natureza; a frase diz o que está acontecendo. É a diferença entre informar e comunicar — e
  na improcedência ela remete ao histórico, onde está o motivo.

**A privacidade foi verificada por ausência, contra a pilha no ar.** Criei uma ocorrência
identificada, levei-a a `IN_PROGRESS`, acrescentei um andamento visível e outro interno, e
procurei no HTML da página: o andamento interno, o nome, o e-mail, o telefone, o endereço, a
descrição e a prioridade — em inglês e em pt-BR — **nenhum apareceu**. É o tipo de requisito que
só se confirma procurando o que não deve estar lá.

O tipo `PublicReport` ajuda nisso: ele declara exatamente os campos que a API devolve, então a
tela não tem como exibir um dado pessoal por descuido — ele não existe no tipo.

**Um teste meu estava errado de novo**, e pela mesma razão da etapa anterior: eu afirmei o
formato de data como `29/09/2026 09:00`, e o `Intl` em pt-BR produz vírgula — `29/09/2026, 09:00`.
Corrigida a expectativa, não o código. A asserção agora é sobre a forma, não sobre o valor: a hora
depende do fuso de quem lê, e fixá-la amarraria o teste à máquina que o roda.

### 1º de outubro de 2026 — etapa C5: fechamento do Portal do Cidadão

Conforme o [plano](plano-de-implementacao.md#c5-fechamento-do-portal). **Encerra as 20 etapas do
plano.**

- Redução das fotos no navegador antes do envio (`RNF-CID-23`), com as decisões em funções puras
  e o desenho no canvas isolado.
- Conferência de contraste ampliada de 10 para **16 pares** texto/fundo, levantados das classes
  efetivamente usadas nas telas.
- Pacote inicial medido, comprimido: **172 KB** no início e **181 KB** no registro, contra o teto
  de 300 KB do `RNF-CID-25`. O Leaflet não entra em nenhuma página.
- 19 testes novos; **181** no portal.

Três decisões sobre a compressão:

- **O tipo do arquivo é preservado.** JPEG continua JPEG. Trocar o formato faria o conteúdo
  divergir do que o nome diz — a API decide pelo conteúdo, então um `.png` recodificado como JPEG
  seria aceito, mas o registro ficaria confuso de ler.
- **A validação ocorre antes da redução**, sobre o arquivo original. É o tamanho que a pessoa
  escolheu que vale para o limite; reduzir primeiro faria um arquivo acima do teto passar em
  silêncio.
- **A compressão nunca lança.** É uma otimização: formato que o navegador não decodifica, memória
  insuficiente, canvas bloqueado — em todos os casos o original segue válido, e o registro não pode
  depender disso (`RNF-CID-26`). Também não troca o arquivo por um ganho menor que 5%, nem quando o
  resultado ficou maior, o que acontece ao recodificar PNG pequeno.

**Um risco de layout que a conferência encontrou.** O nome do arquivo recusado na lista de fotos
não tinha quebra permitida: um nome longo e sem espaços — comum em foto de celular — estouraria a
largura em 320 px, exatamente o que o `RNF-CID-08` proíbe. Corrigido com `break-words`, e a
verificação varreu todos os pontos que escrevem texto longo no DOM: nenhum outro ficou de fora.

Conferido por código, na aplicação gerada: **nenhum** campo de formulário sem rótulo associado;
`lang="pt-BR"`, atalho para o conteúdo e `<main>` identificado; `fieldset` com `legend` em cada
etapa; regiões `aria-live` nas mensagens; nenhuma chamada a `console`; nenhum
`dangerouslySetInnerHTML` nem `innerHTML`; nenhum elemento não interativo com `onClick` — o
percurso por teclado se apoia em `a`, `button`, `select`, `input`, `textarea` e `label` nativos;
nenhum `tabIndex` positivo; o anel de foco definido uma vez em `:focus-visible`; só
`NEXT_PUBLIC_API_URL` como variável de ambiente.

Verificado contra a pilha no ar: as seis rotas respondem, a inexistente dá `404`, e com a API fora
do ar — **sem cache e com o processo certo confirmado pelo PID e pelo log**, lição da etapa C1 —
as telas que dependem dela mostram falha compreensível com os telefones de emergência, enquanto a
página inicial, estática, segue respondendo.

**O que não pude conferir**, e fica registrado como tal: o percurso por teclado operado de fato, o
leitor de tela (`RNF-CID-15`, `RNF-CID-18`), a inspeção em larguras reais (`RNF-CID-08`,
`RNF-CID-10`), os navegadores (`RNF-CID-11`) e a medição de carregamento em 3G simulado
(`RNF-CID-21`). Conferi a estrutura que sustenta esses requisitos; operá-los exige um navegador,
que não existe neste ambiente. Somam-se às três pendências equivalentes do Portal de Operações.

## 3. O que está pronto, em detalhe

### 3.1 Infraestrutura e ambiente

| Item | Estado |
|---|---|
| PostgreSQL 17 em contêiner, com volume e *healthcheck* | ✅ |
| Portas fixadas nos scripts: API 3000, Operações 3001, Cidadão 3002 | ✅ |
| `.env` e `.env.example` das três aplicações | ✅ |
| `prisma7.config.ts` lendo `DATABASE_URL` | ✅ |
| Seed de produção (administrador) e seed de demonstração, separados | ✅ |

### 3.2 Scaffold das aplicações

| Aplicação | Versões | O que já roda |
|---|---|---|
| API | NestJS 12, Prisma 7.10, TypeScript 6, Vitest 4.1 | As 27 rotas do contrato, com prefixo `/api/v1`, CORS por `CORS_ORIGINS`, `ValidationPipe` com `whitelist` e `forbidNonWhitelisted`, e Swagger em `/api/docs` |
| Portal de Operações | Next.js 16.3, React 19.2, Tailwind 4, Leaflet 1.9 | **Concluído** — etapas O1 a O7 |
| Portal do Cidadão | Next.js 16.3, React 19.2, Tailwind 4, Leaflet 1.9 | **Concluído** — etapas C1 a C5 |

Dependências da API acrescentadas durante a implementação, ambas registradas na etapa em que
entraram: **`@prisma/adapter-pg`** (B0 — o Prisma 7 exige um *driver adapter* explícito, o que o
plano não previa) e **`@nestjs/throttler`** (B3). As demais já vinham do scaffold:
`@nestjs/jwt`, `passport-jwt`, `bcrypt`, `class-validator`, `@nestjs/swagger`, `@prisma/client`
e os tipos do `multer`.

### 3.3 Telas do Portal de Operações

Sete etapas concluídas, com 53 testes nas peças que decidem algo:

| Tela | Rota | O que faz |
|---|---|---|
| Login | `/login` | E-mail e senha, token em cookie `httpOnly`, guarda de rotas e expiração |
| Painel | `/` | Indicadores por situação, prioridade e tipo, com destaque para as críticas em aberto |
| Lista de ocorrências | `/ocorrencias` | Filtros combináveis refletidos na URL, busca por protocolo, paginação e exportação em CSV |
| Detalhe | `/ocorrencias/[id]` | Relato, fotos, mapa do ponto, dados do cidadão ou marca de anônima, e histórico |
| Atendimento | `/ocorrencias/[id]` | Triagem em duas etapas, atribuição, conclusão e andamentos |
| Mapa | `/mapa` | Ocorrências abertas plotadas, cor por prioridade com legenda textual |
| Agentes | `/agentes` | Cadastro, alteração de perfil e desativação — só administrador |

As três conferências manuais pendentes estão na seção 4.

### 3.4 Documentação

| Documento | Conteúdo |
|---|---|
| [arquitetura.md](arquitetura.md) | Visão geral, tecnologias, 14 decisões registradas e os três pontos de troca previstos |
| [glossario.md](glossario.md) | 15 termos do domínio, com o nome correspondente no código |
| [backend/modelo-de-dados.md](backend/modelo-de-dados.md) | 5 entidades, 5 enumerações, ciclo de vida com tabela de transições e 11 regras de negócio |
| [backend/api.md](backend/api.md) | 27 rotas, com exemplos de requisição e resposta e 10 códigos de resposta |
| [plano-de-implementacao.md](plano-de-implementacao.md) | 20 etapas, dependências, caminho crítico e riscos |
| [backend/dados-de-demonstracao.md](backend/dados-de-demonstracao.md) | Contas, senhas e as 14 ocorrências do seed, e o que cada uma exercita |
| 6 documentos de requisitos | Detalhados em 3.5 |
| 3 `README.md` de aplicação + índice | Visão geral e execução de cada projeto |

### 3.5 Requisitos

| Aplicação | Funcionais | Não funcionais | Prefixo |
|---|---|---|---|
| API | 73 | 51 | `RF-API` / `RNF-API` |
| Portal de Operações | 65 | 56 | `RF-OP` / `RNF-OP` |
| Portal do Cidadão | 42 | 48 | `RF-CID` / `RNF-CID` |
| **Total** | **180** | **155** | — |

Cada requisito tem identificador permanente e prioridade; cada RNF tem ainda a forma de
verificação. Cada documento de RF registra também o escopo negativo da versão.

### 3.6 Verificação cruzada e decisões que ela gerou

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

### 3.7 Conferências automatizadas em vigor

A documentação é verificada por conferências que qualquer alteração futura deve manter:

- todo identificador de requisito é único e a numeração não tem lacunas;
- todo link e toda âncora entre documentos resolvem;
- as 27 rotas aparecem tanto no contrato quanto nos requisitos, nos dois sentidos;
- todo código de resposta citado em requisito existe na tabela do contrato;
- toda situação do ciclo de vida é alcançável pela tabela de transições;
- toda decisão citada existe no registro da arquitetura;
- os 335 requisitos estão cobertos por alguma etapa do plano.

E, no código:

- o Swagger gerado tem resumo, resposta de sucesso, `400` em toda rota com corpo, `401` em toda
  rota autenticada e `500` em todas — 27 operações, 33 esquemas, zero lacunas;
- as rotas implementadas conferem com as tabelas de [api.md](backend/api.md) nos dois sentidos;
- nenhum acesso a disco fora de `modules/attachments`;
- nenhuma rotina que altere ou remova um `ReportUpdate`;
- nenhum rótulo de enumeração fixado no código dos portais.

## 4. O que ainda não existe

Registrado explicitamente, para que a ausência não seja confundida com esquecimento:

- **as conferências que exigem um navegador**, nos dois portais: responsividade em larguras
  reais, navegadores e leitor de tela. Conferi a estrutura que sustenta esses requisitos —
  rótulos, regiões, elementos nativos, contraste medido — mas não os operei, porque não há
  navegador neste ambiente;
- **`RF-OP-08`** — voltar à tela pretendida depois de um login provocado por expiração de
  sessão — **não foi implementado**. É *Desejável*, e o Portal de Operações foi encerrado em O7
  sem ele; ficou sem registro até a conferência de 1º de outubro. Hoje a expiração leva ao login
  e, de lá, ao painel;
- **nenhum teste de tela nem de Server Action no Portal de Operações** — os 53 testes cobrem as
  peças que decidem algo; telas inteiras dependem da API no ar e seguem verificadas pelo
  percurso manual descrito em cada etapa;
- **três conferências manuais do Portal de Operações** — inspeção em 1280 px e 768 px
  (`RNF-OP-39`, `RNF-OP-40`), navegadores (`RNF-OP-41`) e leitor de tela (`RNF-OP-35`). Exigem
  um navegador, que não existe neste ambiente;
- **nenhuma publicação na internet**: tudo roda em `localhost`, conforme a
  [decisão 10](arquitetura.md#5-decisões-técnicas-registradas).

## 5. Próximo passo

**As 20 etapas do plano estão concluídas.** O que resta não é etapa, e sim verificação:

1. **As conferências que exigem um navegador**, nos dois portais — responsividade em 1280 px,
   768 px e 320 px, navegadores atuais e leitor de tela. São sete requisitos no total, listados na
   seção 4, e precisam de alguém com um navegador aberto.
2. **`RF-OP-08`** (*Desejável*) — voltar à tela pretendida após um login por expiração de sessão.
   Não foi implementado; está registrado na seção 4.
3. Dois *Desejáveis* do Portal do Cidadão que não entraram: **`RF-CID-29`** (imprimir ou salvar a
   confirmação — a tela é uma rota própria e imprime, mas não há botão dedicado) e
   **`RF-CID-36`** (compartilhar o endereço da consulta).

Nada disso bloqueia o uso do sistema: ele funciona ponta a ponta em `localhost`, com o conjunto
de demonstração descrito em [dados-de-demonstracao.md](backend/dados-de-demonstracao.md).

## 6. Como manter este documento

Ao concluir cada etapa do plano:

1. mover a etapa para a linha do tempo, com a data e os commits;
2. atualizar a tabela da seção 1 e remover da seção 4 o que deixou de ser verdade;
3. apontar o próximo passo na seção 5;
4. registrar em [arquitetura.md](arquitetura.md#5-decisões-técnicas-registradas) qualquer
   decisão técnica nova que a etapa tenha exigido.
