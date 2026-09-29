# Portal de Operações — agentes da Defesa Civil

Aplicação web interna, de acesso restrito, onde os agentes recebem e gerenciam as
ocorrências registradas pela população.

- **Código-fonte**: [core/frontend-operations](../../core/frontend-operations)
- **Stack**: Node.js + Next.js (React, TypeScript) + Leaflet
- **Porta padrão**: `3001`
- **Acesso**: exclusivo a agentes autenticados

---

## 1. Público-alvo

Servidores da Defesa Civil, em três perfis:

| Perfil | Permissões |
|---|---|
| **Agente** | Visualiza todas as ocorrências, registra andamentos em qualquer uma e altera a situação **apenas das que lhe foram atribuídas** |
| **Coordenador** | Tudo do agente + triagem, definição de prioridade e atribuição de responsáveis |
| **Administrador** | Tudo do coordenador + gestão de contas de agentes |

## 2. Telas previstas

| Tela | Rota | Descrição |
|---|---|---|
| Login | `/login` | Autenticação por e-mail e senha |
| Painel | `/` | Indicadores: ocorrências abertas, por prioridade, por situação e por tipo |
| Lista de ocorrências | `/ocorrencias` | Tabela com filtros (situação, tipo, prioridade, bairro, período, responsável) e busca por protocolo |
| Detalhe da ocorrência | `/ocorrencias/[id]` | Relato, fotos, mapa, dados do cidadão, histórico e ações de atendimento |
| Triagem | `/ocorrencias/[id]` (ação) | Assume a triagem e, ao concluir, confirma o tipo, define a prioridade e encaminha ou marca como improcedente |
| Mapa | `/mapa` | Ocorrências abertas plotadas geograficamente (Leaflet + OpenStreetMap), com cor por prioridade |
| Agentes | `/agentes` | Cadastro e desativação de contas (apenas administrador) |

## 3. Fluxo principal do agente

```
login ─> painel ─> lista filtrada ─> detalhe da ocorrência
                                          │
                                          ├─ assumir a triagem
                                          ├─ concluir a triagem
                                          │    ├─ encaminhar (tipo + prioridade)
                                          │    └─ marcar improcedente
                                          ├─ atribuir responsável
                                          ├─ registrar andamento
                                          └─ concluir o atendimento
```

## 4. Estrutura de pastas

```
core/frontend-operations/
├── src/
│   ├── proxy.ts              # Guarda de rotas (o antigo "middleware" do Next)
│   ├── app/                  # Rotas (App Router)
│   │   ├── login/
│   │   ├── sair/             # Route handler: descarta o cookie de sessão
│   │   ├── ocorrencias/
│   │   ├── mapa/
│   │   └── agentes/
│   ├── components/           # Componentes de interface reutilizáveis
│   │   └── map/              # <ReportMap> — único ponto que importa o Leaflet
│   ├── features/             # Componentes e lógica por domínio (auth, metadata,
│   │                         #   reports, agents, dashboard)
│   ├── lib/                  # Cliente HTTP, sessão, metadados e utilitários
│   └── types/                # Tipos da API — único lugar com os valores das enumerações
└── public/
```

## 5. Variáveis de ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Endereço da API | `http://localhost:3000/api/v1` |

> O Leaflet acessa o DOM e não funciona na renderização do servidor: o `<ReportMap>` deve
> ser importado com `dynamic(..., { ssr: false })`. Ver [decisão 08](../arquitetura.md#mapas-decisão-08).

## 6. Sessão e acesso à API

O token JWT fica em **cookie `httpOnly`** e o portal fala com a API **pelo servidor do
Next** — as telas são *Server Components* e as operações são *Server Actions*. Nenhuma
chamada à API parte do navegador, e o token nunca chega ao JavaScript da página.
Ver [decisão 15](../arquitetura.md#7-sessão-do-portal-de-operações-decisão-15).

Consequência prática ao construir uma tela nova: um componente `'use client'` **não** pode
importar `lib/api-client.ts` nem `lib/metadata.ts`, porque eles leem o cookie de sessão. Para
traduzir um valor de enumeração no navegador, use `lib/enum-label.ts` ou o
`useMetadata()` de `features/metadata/`.

## 7. Como executar

```bash
cd core/frontend-operations
npm install
cp .env.example .env.local
npm run dev                   # http://localhost:3001 (porta já fixada no script)
```

A API precisa estar no ar, e é preciso haver ao menos um agente cadastrado —
`npx prisma db seed`, em `core/backend`, cria o administrador do primeiro acesso.

## 8. Documentos relacionados

- [Requisitos funcionais](requisitos-funcionais.md) — `RF-OP-nn`
- [Requisitos não funcionais](requisitos-nao-funcionais.md) — `RNF-OP-nn`
- [API REST](../backend/api.md)
- [Arquitetura geral](../arquitetura.md)

## 9. Situação

🚧 Etapas **O1** (sessão e navegação), **O2** (lista e detalhe), **O3** (atendimento) e **O4**
(painel) concluídas — o ciclo de vida da ocorrência já é operável ponta a ponta, com
indicadores. Mapa e agentes são as etapas O5 e O6 do
[plano de implementação](../plano-de-implementacao.md).
