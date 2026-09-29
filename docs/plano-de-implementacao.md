# Plano de implementação

Roteiro de construção do SISDEC, na ordem **API → Portal de Operações → Portal do Cidadão**.

Documentos relacionados: [Arquitetura](arquitetura.md) · [API REST](backend/api.md) ·
[Modelo de dados](backend/modelo-de-dados.md) · requisitos de cada aplicação
([API](backend/requisitos-funcionais.md), [Operações](frontend-operations/requisitos-funcionais.md),
[Cidadão](frontend-citizen/requisitos-funcionais.md))

---

## 1. Ponto de partida

O que já existe no repositório, para que o plano comece do estado real e não do zero:

| Já pronto | Ainda ausente |
|---|---|
| `docker-compose.yml` com PostgreSQL 17, volume e *healthcheck* | Modelos no `schema.prisma` e primeira migração |
| Scaffold NestJS com `main.ts` já configurado: prefixo `/api/v1`, CORS por `CORS_ORIGINS`, `ValidationPipe` com `whitelist` e `forbidNonWhitelisted`, Swagger em `/api/docs` | `PrismaModule`/`PrismaService` e todos os módulos de domínio |
| `prisma7.config.ts` lendo `DATABASE_URL` do `.env` | Validação das variáveis de ambiente na inicialização |
| Dependências da API: `@nestjs/jwt`, `passport-jwt`, `bcrypt`, `class-validator`, `@nestjs/swagger`, `@prisma/client`, tipos do `multer` | `@nestjs/throttler` (única dependência nova prevista) |
| `.env` e `.env.example` das três aplicações | — |
| Scaffold Next.js 16 dos dois portais, com Tailwind 4, `leaflet`, `react-leaflet` e `@types/leaflet` | Cliente HTTP, tipos, componentes, telas e rotas |

> O `schema.prisma` declara `datasource db` **sem** `url` de propósito: no Prisma 7 a conexão
> vem do `prisma7.config.ts`. Isso se mantém.

## 2. Ordem adotada e por quê

```
API  ──────────────────────────────►
      └─ contrato estável
         Portal de Operações ──────►
               └─ domínio validado ponta a ponta
                  Portal do Cidadão ─►
```

- **A API vem primeiro** porque os dois portais não têm persistência própria: sem contrato
  publicado, qualquer tela seria construída contra suposições.
- **O Portal de Operações vem antes do Portal do Cidadão** porque exercita o domínio
  inteiro — autenticação, perfis, triagem, atribuição, histórico e painel. Os defeitos de
  modelagem aparecem aqui, quando corrigi-los ainda é barato. Ele também é a ferramenta que
  permite **ver e triar** as ocorrências criadas nos testes do portal público.
- **O Portal do Cidadão vem por último** porque é o que tem a barra de qualidade mais alta de
  interface (`RNF-CID-01` a `RNF-CID-25`): mobile first, acessibilidade AA e uso sob conexão
  instável. Vale gastar esse esforço sobre uma API que já não muda.

## 3. Convenções do plano

- Cada **etapa** tem um código (`B` de backend, `O` de operações, `C` de cidadão), um
  entregável observável, os requisitos que fecha e um critério de pronto.
- Uma etapa só começa quando as suas dependências estão **concluídas e verificadas** — não
  apenas escritas.
- Os requisitos não funcionais transversais (segurança, acessibilidade, desempenho) não são
  uma etapa final: cada etapa entrega os seus. A etapa de fechamento apenas **confere**.
- Toda etapa termina com `tsc --noEmit` e o *lint* limpos, e com os testes da etapa passando.

---

# Parte I — API (backend)

## B0. Fundação

**Entregável**: a API sobe, conecta no banco e responde `GET /health`.

1. Escrever `schema.prisma` completo a partir do [modelo de dados](backend/modelo-de-dados.md):
   modelos `Report`, `Citizen`, `Agent`, `ReportUpdate`, `Attachment` e as cinco enumerações.
   Atenção aos campos anuláveis (`priority`, `resolvedAt`, `comment`, `citizenId`,
   `assignedToId`, coordenadas) e à restrição `UNIQUE` de `protocolNumber`.
2. Declarar os índices de `RNF-API-04`: `status`, `type`, `priority`, `district`,
   `assignedToId`, `createdAt`.
3. Gerar a primeira migração (`prisma migrate dev`) e o cliente.
4. `PrismaModule` + `PrismaService` com conexão no ciclo de vida do Nest.
5. Validar as variáveis de ambiente na inicialização, falhando de imediato se faltar alguma
   obrigatória — usando `class-validator`, já presente, sem nova dependência.
6. Filtro global de exceções no padrão `{ statusCode, message, error }`, sem *stack trace*.
7. Interceptor de log de requisição (método, rota, código, duração), sem registrar senha,
   token ou dado pessoal.
8. Utilitário de paginação com `pageSize` padrão 20 e teto 100.
9. `GET /health` com o estado do banco, respondendo `503` quando inacessível.

**Fecha**: `RF-API-58`, `RF-API-59` · `RNF-API-03`, `RNF-API-04`, `RNF-API-17`,
`RNF-API-19`, `RNF-API-22`, `RNF-API-23`, `RNF-API-24`, `RNF-API-25`, `RNF-API-31`,
`RNF-API-33`, `RNF-API-34`, `RNF-API-39`, `RNF-API-40`, `RNF-API-41`

**Já entregues pelo scaffold, a etapa apenas confirma**: `RF-API-56` (Swagger em
`/api/docs`) e `RF-API-57` (CORS restrito a `CORS_ORIGINS`) — ambos já configurados em
`main.ts`. A completude da documentação de cada rota é cobrada em B7.

**Pronto quando**: `docker compose up -d && npm run start:dev` sobe sem erro; `GET /health`
devolve `200`; parar o contêiner do banco faz o endpoint devolver `503` sem derrubar o
processo; subir sem `.env` falha com mensagem nomeando a variável ausente.

## B1. Metadados públicos

**Entregável**: os portais conseguem obter todas as enumerações e limites.

1. Módulo `metadata` com `GET /metadata`: `reportTypes` (com `urgent`), `reportCategories`,
   `reportStatuses` e o bloco `upload`.
2. Derivar `upload` da configuração efetiva (`MAX_UPLOAD_SIZE_MB`, formatos aceitos,
   `maxFiles`), sem repetir as constantes.
3. Marcar `urgent` nos cinco tipos de risco imediato à vida.
4. `GET /report-types` como atalho para `metadata.reportTypes`.

**Depende de**: B0
**Fecha**: `RF-API-10`, `RF-API-11`, `RF-API-12`, `RF-API-62`, `RF-API-64` · `RNF-API-29`

**Pronto quando**: os rótulos em pt-BR de tipos, categorias e situações vêm da API e
nenhuma lista está fixa em código fora do `enum` do Prisma.

## B2. Autenticação, agentes e metadados internos

**Entregável**: um agente faz login e o controle de acesso por perfil funciona.

1. `AgentsModule`: CRUD restrito ao admin, hash bcrypt com custo ≥ 10, `409` em e-mail
   duplicado, desativação em vez de exclusão, `passwordHash` nunca serializado.
2. `AuthModule`: `POST /auth/login`, `GET /auth/me`, estratégia JWT, recusa de agente
   inativo, `401` genérico sem dizer se errou e-mail ou senha.
3. `JwtAuthGuard` global e `RolesGuard` com decorator de perfil, devolvendo `403`.
4. `seed.ts` criando o agente `ADMIN` do primeiro acesso.
5. `GET /metadata/internal` (autenticado) com `priorities` e `agentRoles`.

**Depende de**: B1
**Fecha**: `RF-API-25` a `RF-API-31`, `RF-API-45` a `RF-API-51`, `RF-API-63` ·
`RNF-API-07`, `RNF-API-08`, `RNF-API-16`, `RNF-API-18`

**Pronto quando**: o login devolve token; rota restrita sem token dá `401`; rota de admin com
perfil `AGENT` dá `403`; nenhuma resposta contém `passwordHash`.

## B3. Registro e consulta pública de ocorrências

**Entregável**: o núcleo do sistema — registrar e acompanhar por protocolo.

1. `POST /reports` com DTO validado, `citizen` opcional, `status = RECEIVED`,
   `priority` nula.
2. Gerador de `protocolNumber` no formato `SISDEC-AAAA-NNNNNN`, com sequência anual e
   unicidade garantida pelo banco, não só pela aplicação.
3. Criação de ocorrência e cidadão **em uma única transação**.
4. `GET /reports/protocol/:protocolNumber` devolvendo apenas os campos públicos — sem
   `description`, `address`, coordenadas, `priority`, `citizen` nem identificação de agente —
   e só os andamentos com `visibleToCitizen = true`.
5. `@nestjs/throttler` nas rotas públicas de escrita e no login. Entra aqui, e não no
   fechamento, porque é nesta etapa que o primeiro endpoint público de escrita é exposto.

**Depende de**: B0 (independe de B2)
**Fecha**: `RF-API-01` a `RF-API-09`, `RF-API-13` a `RF-API-16`, `RF-API-65` ·
`RNF-API-09`, `RNF-API-10`, `RNF-API-15`, `RNF-API-20`, `RNF-API-42`, `RNF-API-43`

**Pronto quando**: dois registros simultâneos não geram protocolo repetido; a consulta por
protocolo não devolve nenhum campo pessoal; protocolo inexistente dá `404`.

## B4. Anexos

**Entregável**: o cidadão envia fotos e elas são servidas pela API.

1. Interface `StorageService` e `LocalStorageService` gravando em `UPLOAD_DIR`, com nome de
   arquivo **gerado pela aplicação** — nunca o nome original.
2. Escolha da implementação em um único ponto, no provider do módulo, por `STORAGE_DRIVER`.
3. `POST /reports/:id/attachments`: até 5 arquivos, tipos aceitos verificados **pelo
   conteúdo** e não só pelo `Content-Type`, teto de `MAX_UPLOAD_SIZE_MB`.
4. Aceitar anexo apenas enquanto a ocorrência está em `RECEIVED`, recusando com `409`.
5. `GET /attachments/:id` servindo em fluxo, com o `Content-Type` correto.

**Depende de**: B3
**Fecha**: `RF-API-17` a `RF-API-24`, `RF-API-69` · `RNF-API-06`, `RNF-API-13`,
`RNF-API-14`, `RNF-API-27`, `RNF-API-28`

**Pronto quando**: `grep` por `fs`/`path` não encontra nada fora de `modules/attachments`; um
arquivo `.txt` renomeado para `.jpg` é recusado; um nome com `../` não escapa do `UPLOAD_DIR`.

## B5. Gestão de ocorrências

**Entregável**: o ciclo de vida completo, com histórico e autorização.

1. `GET /reports` com os nove filtros e paginação.
2. `GET /reports/:id` com anexos, histórico integral e dados do cidadão.
3. `PATCH /reports/:id/triage/start` (`RECEIVED → TRIAGE`).
4. `PATCH /reports/:id/triage` com `outcome: ACCEPT | REJECT`, comentário obrigatório no
   `REJECT`, e `400` se a ocorrência não estiver em `TRIAGE`.
5. `GET /reports/assignable-agents` e `PATCH /reports/:id/assign`, recusando agente inativo.
6. `PATCH /reports/:id/status` aceitando só as transições da [tabela de
   transições](backend/modelo-de-dados.md#4-ciclo-de-vida-da-ocorrência), com `403` para o
   perfil `AGENT` que não seja o responsável.
7. `POST /reports/:id/updates` com `visibleToCitizen`.
8. **Um único ponto** no service concentrando a mudança de situação — é onde um envio de aviso
   ao cidadão será acrescentado depois. Cada transição grava `ReportUpdate` com autor, `from`,
   `to` e data, na mesma transação; `resolvedAt` no `RESOLVED`.
9. Sugestão de prioridade alta para tipos `urgent`.

**Depende de**: B2 e B3
**Fecha**: `RF-API-32` a `RF-API-44`, `RF-API-60`, `RF-API-61`, `RF-API-66`, `RF-API-68` ·
`RNF-API-20`, `RNF-API-21`, `RNF-API-45`

**Pronto quando**: toda situação do enum é alcançável pelos endpoints; transição inválida dá
`400`; agente não responsável recebe `403`; nenhuma rotina altera ou remove `ReportUpdate`.

## B6. Mapa, exportação e painel

**Entregável**: os dados consolidados que o Portal de Operações consome.

1. `GET /reports/map`: sem paginação, formato enxuto, apenas abertas quando não há filtro de
   situação, `omittedWithoutCoordinates` e teto de 500 com `truncated`.
2. `GET /reports/export` em `text/csv`, **em fluxo**, com cabeçalho em pt-BR.
3. `GET /dashboard/summary`, `GET /dashboard/by-district` e `GET /dashboard/timeline`, com
   recorte `from`/`to`, calculados
   por **agregação no banco** — sem carregar a lista em memória.

**Depende de**: B5
**Fecha**: `RF-API-52` a `RF-API-55`, `RF-API-67`, `RF-API-70` · `RNF-API-05`

**Pronto quando**: o painel responde sem `findMany` de ocorrências; o mapa devolve 200 pontos
em uma chamada; a exportação não acumula o CSV em memória.

## B7. Fechamento da API

**Entregável**: a API pronta para servir os portais, com a suíte de testes e a documentação.

1. Testes unitários (Vitest) das regras centrais: geração de protocolo, transições, filtro do
   histórico visível, autorização por perfil e por responsável.
2. Testes e2e dos fluxos principais: registro, consulta por protocolo, login, triagem completa.
3. Suíte preparando e limpando o próprio estado, para rodar duas vezes com o mesmo resultado.
4. Swagger completo: DTOs de entrada e saída e códigos de resposta de cada rota.
5. Conferência da [lista de RNF](backend/requisitos-nao-funcionais.md), em especial os de
   segurança e privacidade.

**Depende de**: B6
**Fecha**: `RNF-API-01`, `RNF-API-02`, `RNF-API-11`, `RNF-API-12`, `RNF-API-26`,
`RNF-API-30`, `RNF-API-32`, `RNF-API-35` a `RNF-API-38`, `RNF-API-44`, `RNF-API-46` a
`RNF-API-51`

**Pronto quando**: `npm test`, `npm run test:e2e`, `npm run lint` e `tsc --noEmit` passam; o
Swagger descreve as 25 rotas.

---

# Parte II — Portal de Operações

> Pode começar assim que **B2** estiver pronto: a etapa O1 só precisa de login e metadados.
> As etapas O2 em diante exigem B5 e B6.

## O1. Fundação e sessão

1. Cliente HTTP único em `lib/`, com base em `NEXT_PUBLIC_API_URL`, injeção do token,
   *timeout* e tratamento central de `401`.
2. Tipos da API em `types/`, um arquivo por entidade — **único lugar** onde os valores das
   enumerações podem aparecer.
3. Carga de `GET /metadata` e `GET /metadata/internal` em um provider, com os rótulos em pt-BR
   disponíveis a toda a interface.
4. Tela `/login`, guarda de rotas, `GET /auth/me`, encerramento de sessão e expiração.
5. Layout com navegação permanente, tokens de cor e foco visível.

**Depende de**: B2
**Fecha**: `RF-OP-01` a `RF-OP-08`, `RF-OP-55` a `RF-OP-60` · `RNF-OP-10` a `RNF-OP-18`,
`RNF-OP-43`, `RNF-OP-44`, `RNF-OP-45`, `RNF-OP-49`

## O2. Lista e detalhe da ocorrência

1. `/ocorrencias`: tabela semântica, filtros combináveis, busca com *debounce*, ordenação,
   paginação e atalho para as próprias ocorrências.
2. Filtros refletidos na URL, preservados ao voltar do detalhe.
3. `/ocorrencias/[id]`: relato, anexos com ampliação, mapa do ponto, dados do cidadão ou
   marca de registro anônimo, e histórico distinguindo interno de visível ao cidadão.
4. Situação e prioridade sempre por **cor mais rótulo**.

**Depende de**: B5, O1
**Fecha**: `RF-OP-15` a `RF-OP-23`, `RF-OP-25` a `RF-OP-30` · `RNF-OP-01` a `RNF-OP-04`,
`RNF-OP-19` a `RNF-OP-21`, `RNF-OP-24`, `RNF-OP-34`, `RNF-OP-36` a `RNF-OP-38`

## O3. Atendimento

1. Triagem em duas etapas: assumir e concluir, com sugestão de prioridade nos tipos `urgent`
   e escolha entre encaminhar e marcar improcedente.
2. Atribuição de responsável a partir de `GET /reports/assignable-agents`.
3. Mudança de situação oferecendo só as transições válidas, com comentário obrigatório na
   conclusão e no cancelamento.
4. Registro de andamento com escolha explícita de visibilidade, avisando que o texto visível
   aparece na consulta pública.
5. Confirmação nas ações difíceis de reverter; ações ocultas para o agente não responsável,
   **com o motivo à vista**.

**Depende de**: B5, O2
**Fecha**: `RF-OP-31` a `RF-OP-40`, `RF-OP-62` a `RF-OP-64` · `RNF-OP-05` a `RNF-OP-08`,
`RNF-OP-25`, `RNF-OP-28`, `RNF-OP-29`

## O4. Painel

1. Indicadores de `GET /dashboard/summary`, com destaque para `CRITICAL` e `HIGH` em aberto.
2. Distribuição por bairro e volume por período.
3. Cada indicador conduz à lista já filtrada.

**Depende de**: B6, O2
**Fecha**: `RF-OP-09` a `RF-OP-14`

## O5. Mapa

1. `<ReportMap>` em `components/map/`, importado com `dynamic(..., { ssr: false })` —
   **único** ponto que importa o Leaflet, com props `{ latitude, longitude }` e sem tipos da
   biblioteca na interface pública.
2. Cor por prioridade com legenda textual, resumo ao acionar o ponto, filtros.
3. Aviso de `truncated` e contagem de omitidas sem coordenadas.
4. Página utilizável se o mapa não carregar.

**Depende de**: B6, O1
**Fecha**: `RF-OP-41` a `RF-OP-46`, `RF-OP-61`, `RF-OP-65` · `RNF-OP-22`, `RNF-OP-23`,
`RNF-OP-26`, `RNF-OP-42`

## O6. Gestão de agentes

1. `/agentes`: lista com inativos distinguidos, cadastro, edição de perfil e desativação com
   confirmação.
2. Rota e item de navegação ocultos para agente e coordenador.
3. Impedir que o administrador desative a própria conta.

**Depende de**: B2, O1
**Fecha**: `RF-OP-47` a `RF-OP-54`

## O7. Fechamento do portal

1. Exportação em CSV por `GET /reports/export`.
2. Percurso completo por teclado, contraste AA, `aria-live` nas mensagens.
3. Conferência em 1280 px e 768 px, sem rolagem horizontal.
4. Conferência da [lista de RNF](frontend-operations/requisitos-nao-funcionais.md).

**Depende de**: B6, O3, O4, O5, O6
**Fecha**: `RF-OP-24` · `RNF-OP-09`, `RNF-OP-27`, `RNF-OP-30` a `RNF-OP-33`,
`RNF-OP-35`, `RNF-OP-39` a `RNF-OP-41`, `RNF-OP-46` a `RNF-OP-48`, `RNF-OP-50` a `RNF-OP-56`

---

# Parte III — Portal do Cidadão

> Depende de B1, B3 e B4 — não depende de nenhuma etapa do Portal de Operações, mas é
> construído por último, conforme a seção 2.

## C1. Fundação e orientação

1. Cliente HTTP em `lib/`, sobre `NEXT_PUBLIC_API_URL`, com *timeout* e mensagens
   compreensíveis; consome **apenas** `GET /metadata`.
2. Layout mobile first a partir de 320 px, com tokens de cor de contraste AA.
3. `/` com os dois caminhos — registrar e acompanhar — e o aviso destacado de **199 / 193**.
4. `/orientacoes`, acessível de qualquer tela.

**Depende de**: B1
**Fecha**: `RF-CID-01` a `RF-CID-04`, `RF-CID-37`, `RF-CID-38`, `RF-CID-42` ·
`RNF-CID-10`, `RNF-CID-14`, `RNF-CID-19`, `RNF-CID-20`, `RNF-CID-32`, `RNF-CID-37`,
`RNF-CID-38`, `RNF-CID-39`, `RNF-CID-42`

## C2. Formulário de registro, sem o mapa

Construído **antes** do mapa de propósito: `RNF-CID-26` exige que o registro funcione quando o
Leaflet não carrega. Começar sem o mapa garante que esse caminho seja o padrão, e não um
tratamento de exceção acrescentado depois.

1. Máquina de etapas com indicação de progresso, retorno sem perda de dados e validação por
   etapa.
2. Etapa 1 — categoria e tipo, com reforço do aviso de emergência nos tipos `urgent`.
3. Etapa 2 — endereço e bairro (obrigatórios), ainda sem o componente de mapa.
4. Etapa 3 — descrição e até 5 fotos, com prévia, remoção e recusa local pelos limites vindos
   de `metadata.upload`.
5. Etapa 4 — nome, e-mail e telefone opcionais, com "prefiro não me identificar" e o aviso de
   que não há envio de avisos nesta versão.
6. Etapa 5 — revisão e envio: `POST /reports` e, havendo fotos,
   `POST /reports/:id/attachments`, com botão bloqueado durante a requisição e conclusão do
   registro mesmo se o envio das fotos falhar.

**Depende de**: B3, B4, C1
**Fecha**: `RF-CID-05` a `RF-CID-10`, `RF-CID-14` a `RF-CID-24`, `RF-CID-39` ·
`RNF-CID-01` a `RNF-CID-06`, `RNF-CID-12`, `RNF-CID-13`, `RNF-CID-16`, `RNF-CID-17`,
`RNF-CID-18`, `RNF-CID-23`, `RNF-CID-27` a `RNF-CID-31`, `RNF-CID-34`, `RNF-CID-35`

## C3. Mapa e localização

1. `<LocationPicker>` em `components/map/`, com `dynamic(..., { ssr: false })` — **único**
   ponto que importa o Leaflet, props `{ latitude, longitude }`, sem tipos da biblioteca.
2. Geolocalização do dispositivo **apenas** por ação explícita, nunca ao abrir a página.
3. Degradação: mapa indisponível ou permissão negada não impede o registro.

**Depende de**: C2
**Fecha**: `RF-CID-11` a `RF-CID-13`, `RF-CID-40` · `RNF-CID-22`, `RNF-CID-26`,
`RNF-CID-33`, `RNF-CID-36`

## C4. Protocolo e acompanhamento

1. `/registrar/confirmacao`: protocolo como elemento de maior destaque, botão de copiar com
   confirmação visual e alerta de que é a **única** forma de acompanhar.
2. `/acompanhar`: consulta tolerante a maiúsculas e espaços, com erro compreensível quando não
   encontrado.
3. `/acompanhar/[protocolo]`: situação com rótulo em pt-BR, tipo, categoria, bairro, data e
   histórico visível — sem dado pessoal e sem identificar agente.

**Depende de**: B3, C2
**Fecha**: `RF-CID-25` a `RF-CID-36`, `RF-CID-41` · `RNF-CID-09`

## C5. Fechamento do portal

1. Percurso completo do registro **apenas pelo teclado**, com leitor de tela nas mensagens.
2. Contraste AA, áreas de toque de 44 px, sem rolagem horizontal em 320 px.
3. Medição de carregamento em 3G simulado e do pacote inicial.
4. Compressão das fotos no navegador antes do envio.
5. Conferência da [lista de RNF](frontend-citizen/requisitos-nao-funcionais.md).

**Depende de**: C3, C4
**Fecha**: `RNF-CID-07`, `RNF-CID-08`, `RNF-CID-11`, `RNF-CID-15`, `RNF-CID-21`,
`RNF-CID-24`, `RNF-CID-25`, `RNF-CID-40`, `RNF-CID-41`, `RNF-CID-43` a `RNF-CID-48`

---

## 4. Caminho crítico

```
B0 ─► B1 ─► B2 ─────────────► B5 ─► B6 ─► B7
      │      │                 ▲     │
      │      └─► O1            │     ├─► O2 ─► O3 ─┐
      └─► B3 ─► B4 ────────────┘     ├─► O4 ───────┼─► O7
                │                    └─► O5 ───────┤
                │                        O6 ───────┘
                └─► C1 ─► C2 ─► C3 ─► C4 ─► C5
```

A sequência **B0 → B3 → B5 → B6** é o caminho crítico: tudo mais pende dela. B3 não depende de
B2, então registro público e autenticação podem ser construídos em qualquer ordem depois de B0.

## 5. Cobertura dos requisitos

As etapas cobrem os **332 requisitos** dos seis documentos, sem sobra:

| Aplicação | Requisitos | Etapas |
|---|---|---|
| API | 70 RF + 51 RNF | B0 a B7 |
| Portal de Operações | 65 RF + 56 RNF | O1 a O7 |
| Portal do Cidadão | 42 RF + 48 RNF | C1 a C5 |

Um requisito que não apareça em nenhuma etapa é sinal de plano incompleto, não de requisito
dispensável.

## 6. Riscos e pontos de atenção

| Risco | Onde aparece | Contenção |
|---|---|---|
| Unicidade do protocolo sob concorrência | B3 | Restrição `UNIQUE` no banco e nova tentativa em caso de colisão — nunca "consultar e depois inserir" |
| Vazamento de dado pessoal na consulta pública | B3, C4 | Lista explícita de campos devolvidos e teste automatizado sobre a resposta |
| Leaflet escapar dos componentes de mapa | O5, C3 | `grep` por `leaflet` fora de `components/map` na conferência de cada etapa |
| Enumerações fixadas em código nos portais | O1, C1 | Valores só em `types/`; conferência por busca dos literais |
| Formulário do cidadão depender do mapa | C2, C3 | Construir o formulário antes do mapa |
| Migração de esquema depois das telas prontas | B0 | Revisar o `schema.prisma` contra o modelo de dados **antes** da primeira migração |
| `STORAGE_DRIVER` vazar para fora de `attachments` | B4 | `grep` por `fs`/`path` fora do módulo |
