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

# 4. API em modo desenvolvimento
npm run start:dev
```

- API: http://localhost:3000/api/v1
- Documentação interativa (Swagger): http://localhost:3000/api/docs

## Scripts

| Comando | O que faz |
|---|---|
| `npm run start:dev` | Sobe a API com recarga automática |
| `npm run build` | Compila para `dist/` |
| `npm run start:prod` | Executa a versão compilada |
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
