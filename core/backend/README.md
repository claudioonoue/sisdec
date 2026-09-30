# core/backend — API do SISDEC

API REST do Sistema Integrado da Defesa Civil.

| | |
|---|---|
| Framework | NestJS 12 (TypeScript, **ESM**) |
| Banco | PostgreSQL 17 via Prisma 7 |
| Testes | Vitest |
| Lint | oxlint |
| Porta | `3000` — rotas sob `/api/v1` |

## Primeira execução

```bash
# 1. Banco de dados (a partir da raiz do repositório)
docker compose up -d

# 2. Dependências e ambiente
npm install
cp .env.example .env        # ajuste DATABASE_URL e JWT_SECRET se necessário

# 3. Banco e cliente Prisma
npx prisma migrate dev

# 4. Agente administrador do primeiro acesso
npx prisma db seed

# 5. API em modo desenvolvimento
npm run start:dev
```

- API: http://localhost:3000/api/v1
- Documentação interativa (Swagger): http://localhost:3000/api/docs

## Dois seeds, com propósitos diferentes

| Comando | Arquivo | O que cria |
|---|---|---|
| `npx prisma db seed` | `prisma/seed.ts` | Apenas o agente administrador do primeiro acesso (`RF-API-51`) — é dado de produção |
| `npm run seed:demo` | `prisma/seed-demo.ts` | Contas e ocorrências de **demonstração**, para exercitar as telas dos portais |

O seed de demonstração **não** está registrado em `prisma7.config.ts`, e por isso `prisma db
seed` nunca o executa: ele existe só para o trabalho de desenvolvimento.

Ele cria quatro contas, todas com a senha `sisdec-demo` (ou `SEED_DEMO_PASSWORD`):

| Conta | Perfil | Para quê |
|---|---|---|
| `coordenadora@sisdec.local` | Coordenador | Triagem e atribuição; `RF-OP-52` — não enxerga `/agentes` |
| `agente.ana@sisdec.local` | Agente | Responsável por parte das ocorrências |
| `agente.bruno@sisdec.local` | Agente | `RF-OP-64` — agente que **não** é o responsável |
| `agente.inativo@sisdec.local` | Agente (inativo) | `RF-OP-53`; fica fora de `GET /reports/assignable-agents` |

E 14 ocorrências cobrindo as seis situações, as quatro prioridades, seis bairros, com e sem
coordenadas, identificadas e anônimas, espalhadas nos últimos 40 dias — o bastante para lista,
filtros, painel, linha do tempo e mapa terem o que mostrar.

**O conjunto está detalhado em
[docs/backend/dados-de-demonstracao.md](../../docs/backend/dados-de-demonstracao.md)**: cada
ocorrência, o que ela exercita e por onde começar a olhar em cada tela.

**As fotos exigem a API no ar.** Sete delas, em quatro ocorrências, são enviadas pelo
`POST /reports/:id/attachments` — o mesmo endpoint do Portal do Cidadão. O seed **não** grava
em `UPLOAD_DIR`: só `modules/attachments` conhece caminho de arquivo
([decisão 07](../../docs/arquitetura.md#armazenamento-de-anexos-decisão-07)), e escrever ali
por fora furaria esse limite sem aparecer em nenhuma busca por `fs` nos módulos. As imagens são
geradas em `prisma/demo-image.ts`, e não versionadas: o envio confere o tipo pela assinatura do
arquivo, então precisam ser imagens de verdade. Sem a API no ar o seed avisa e segue — o resto
dos dados é criado normalmente.

**Não apaga nada.** As contas são criadas ou atualizadas pelo e-mail, sem sobrescrever senha
trocada pela API; as ocorrências só entram quando o banco ainda não tem nenhuma. Para inserir
mesmo assim, `SEED_DEMO_FORCE=1 npm run seed:demo`. Os protocolos continuam a sequência do
ano, como a API faz, então a próxima ocorrência registrada por ela não colide nem deixa buraco
na numeração.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run start:dev` | Sobe a API com recarga automática |
| `npm run build` | Compila para `dist/` |
| `npm run start:prod` | Executa a versão compilada |
| `npm run seed:demo` | Contas e ocorrências de **demonstração** (só desenvolvimento) |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes end-to-end |
| `npm run lint` | Análise estática (oxlint) |
| `npm run format` | Formatação (Prettier) |

## Pontos de atenção

**ESM.** O projeto usa `"type": "module"`. Todo import de arquivo local precisa da extensão
`.js`, mesmo apontando para um `.ts` — por exemplo `import { AppModule } from './app.module.js'`.

**Configuração do Prisma.** A partir da versão 7, a conexão não fica mais no
`schema.prisma`: ela é lida de `prisma7.config.ts`, que carrega o `.env` via `dotenv`. O
cliente é gerado em `src/generated/prisma/` (ignorado pelo Git) — depois de qualquer
`prisma migrate` ou `prisma generate`, é dessa pasta que os imports vêm.

**Variáveis de ambiente.** Estão listadas em `.env.example`. Toda variável nova entra lá no
mesmo commit.

## Documentação

- [Visão geral do backend](../../docs/backend/README.md)
- [Modelo de dados](../../docs/backend/modelo-de-dados.md)
- [API REST](../../docs/backend/api.md)
