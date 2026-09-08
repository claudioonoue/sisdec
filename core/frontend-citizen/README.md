# core/frontend-citizen — Portal do Cidadão

Interface do SISDEC destinada a: **população**.

| | |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Estilo | Tailwind CSS 4 |
| Mapas | Leaflet + OpenStreetMap |
| Porta | `3002` |
| Acesso | Público — sem cadastro obrigatório |

## Primeira execução

```bash
npm install
cp .env.example .env.local     # aponta para a API
npm run dev                    # http://localhost:3002
```

> A API precisa estar no ar antes deste portal — veja [core/backend](../backend/README.md).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento na porta 3002 |
| `npm run build` | Build de produção |
| `npm start` | Executa o build na porta 3002 |
| `npm run lint` | ESLint |

A porta já está fixada nos scripts `dev` e `start` — não é preciso passar `-p`.

## Ponto de atenção

O Leaflet manipula o DOM e não funciona na renderização do servidor. Os componentes de mapa
devem ser importados com `dynamic(..., { ssr: false })` e ficar isolados em
`src/components/map/`, de modo que nenhuma tela importe `leaflet` diretamente
(ver [decisão 08](../../docs/arquitetura.md#mapas-decisão-08)).

## Documentação

- [Visão geral do Portal do Cidadão](../../docs/frontend-citizen/README.md)
