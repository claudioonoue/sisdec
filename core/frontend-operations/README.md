# core/frontend-operations — Portal de Operações

Interface do SISDEC destinada a: **agentes da Defesa Civil**.

| | |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Estilo | Tailwind CSS 4 |
| Mapas | Leaflet + OpenStreetMap |
| Porta | `3001` |
| Acesso | Restrito — exige autenticação |

## Primeira execução

```bash
npm install
cp .env.example .env.local     # aponta para a API
npm run dev                    # http://localhost:3001
```

> A API precisa estar no ar antes deste portal — veja [core/backend](../backend/README.md).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento na porta 3001 |
| `npm run build` | Build de produção |
| `npm start` | Executa o build na porta 3001 |
| `npm run lint` | ESLint |

A porta já está fixada nos scripts `dev` e `start` — não é preciso passar `-p`.

> É preciso haver ao menos um agente cadastrado para entrar. Em `core/backend`,
> `npx prisma db seed` cria o administrador do primeiro acesso, e
> [`npm run seed:demo`](../backend/README.md#dois-seeds-com-propósitos-diferentes) cria as
> contas de coordenador e agente e as ocorrências de demonstração — sem elas, as telas de
> lista, painel e mapa não têm o que exibir.

## Pontos de atenção

**A sessão vive no servidor.** O token JWT fica em cookie `httpOnly` e todas as chamadas à
API partem do servidor do Next — as telas são Server Components e as operações são Server
Actions (ver [decisão 15](../../docs/arquitetura.md#7-sessão-do-portal-de-operações-decisão-15)).
Um componente `'use client'` não pode importar `lib/api-client.ts` nem `lib/metadata.ts`:
eles leem o cookie, e o empacotador recusa o build. Para traduzir enumerações no navegador,
use `lib/enum-label.ts` ou o `useMetadata()` de `features/metadata/`.

**Nada de enumeração fixa no código.** Os valores em inglês (`RECEIVED`, `HIGH`, …) só podem
aparecer em `src/types/`; os rótulos em pt-BR vêm de `GET /metadata` e `GET /metadata/internal`
(`RNF-OP-45`).

**O Leaflet** manipula o DOM e não funciona na renderização do servidor. Os componentes de
mapa devem ser importados com `dynamic(..., { ssr: false })` e ficar isolados em
`src/components/map/`, de modo que nenhuma tela importe `leaflet` diretamente
(ver [decisão 08](../../docs/arquitetura.md#mapas-decisão-08)).

## Documentação

- [Visão geral do Portal de Operações](../../docs/frontend-operations/README.md)
