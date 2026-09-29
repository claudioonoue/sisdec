# Registro de progresso

O que já foi construído no SISDEC, o que ainda não existe e qual é o próximo passo.

> Documento vivo: deve ser atualizado ao fim de cada etapa do
> [plano de implementação](plano-de-implementacao.md). Registra **estado**, não intenção —
> um item só é marcado como pronto quando está verificado e commitado.

Última atualização: **29 de setembro de 2026**.

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
| **Modelo de dados no Prisma** | ⬜ `schema.prisma` ainda sem modelos |
| **Código de domínio da API** | ⬜ Nenhum módulo implementado |
| **Telas dos portais** | ⬜ Apenas a página inicial do scaffold |

Em uma frase: **a especificação está fechada e verificada; a implementação ainda não começou.**

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

### Em andamento — ainda não commitado

- [Plano de implementação](plano-de-implementacao.md), com 20 etapas.
- Este registro de progresso.

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

- **`schema.prisma` sem modelos** — nenhuma entidade, nenhuma migração, banco vazio;
- **nenhum módulo de domínio na API** — `auth`, `agents`, `reports`, `report-updates`,
  `attachments` e `dashboard` ainda não existem; o que há é o `AppController` do scaffold;
- **nenhum `PrismaService`**, nenhuma validação de variáveis de ambiente na inicialização;
- **nenhuma tela** nos dois portais além da página inicial gerada pelo `create-next-app`;
- **nenhum cliente HTTP** nos portais, nenhum tipo compartilhado com a API;
- **nenhum teste** além dos dois arquivos de exemplo do scaffold.

## 5. Próximo passo

**Etapa B0 — Fundação da API**, a primeira do
[plano de implementação](plano-de-implementacao.md#b0-fundação): escrever o `schema.prisma`
completo a partir do modelo de dados, gerar a primeira migração, criar o `PrismaService`,
validar as variáveis de ambiente na inicialização e entregar `GET /health`.

É o começo do caminho crítico **B0 → B3 → B5 → B6**, do qual todo o resto depende.

## 6. Como manter este documento

Ao concluir cada etapa do plano:

1. mover a etapa para a linha do tempo, com a data e os commits;
2. atualizar a tabela da seção 1 e remover da seção 4 o que deixou de ser verdade;
3. apontar o próximo passo na seção 5;
4. registrar em [arquitetura.md](arquitetura.md#5-decisões-técnicas-registradas) qualquer
   decisão técnica nova que a etapa tenha exigido.
