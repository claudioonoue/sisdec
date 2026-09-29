# SISDEC — Sistema Integrado da Defesa Civil

Sistema de Reclamações e Sugestões para a Defesa Civil.

Projeto desenvolvido para a disciplina **Projeto Integrador II** da **UNIVESP**.

---

## Problema

Atualmente, reclamações, sugestões e solicitações relacionadas a riscos de alagamentos,
deslizamentos, árvores em situação de perigo, estruturas danificadas e outras ocorrências
podem ser comunicadas de maneira informal ou por diferentes canais. Essa diversidade de
formas de comunicação dificulta o registro, a organização e o acompanhamento das
solicitações pela Defesa Civil.

## Objetivo

Desenvolver um sistema informatizado para facilitar o registro, o gerenciamento e o
acompanhamento de reclamações, sugestões e possíveis situações de risco comunicadas pela
população à Defesa Civil.

---

## Estrutura do repositório

```
sisdec/
├── docker-compose.yml         # PostgreSQL do ambiente de desenvolvimento
├── docs/                      # Toda a documentação do projeto
│   ├── README.md              # Índice da documentação
│   ├── arquitetura.md         # Visão geral e decisões técnicas
│   ├── glossario.md           # Termos do domínio
│   ├── backend/
│   ├── frontend-operations/
│   └── frontend-citizen/
└── core/                      # Código-fonte das aplicações
    ├── backend/               # API REST — NestJS
    ├── frontend-operations/   # Portal dos agentes — Next.js
    └── frontend-citizen/      # Portal do cidadão — Next.js
```

Cada projeto em `core/` é independente: possui o seu próprio `package.json`,
suas dependências e os seus próprios comandos de execução.

## Aplicações

| Aplicação | Pasta | Tecnologia | Público |
|---|---|---|---|
| API | [core/backend](core/backend) | Node.js + NestJS + PostgreSQL (Prisma) | — |
| Portal de Operações | [core/frontend-operations](core/frontend-operations) | Node.js + Next.js + Leaflet | Agentes da Defesa Civil |
| Portal do Cidadão | [core/frontend-citizen](core/frontend-citizen) | Node.js + Next.js + Leaflet | População |

## Como executar localmente

Nesta etapa o sistema roda inteiramente na máquina do desenvolvedor. São quatro processos,
nesta ordem — cada um em um terminal:

```bash
# 1. Banco de dados (raiz do repositório)
docker compose up -d

# 2. API — http://localhost:3000
cd core/backend && npm run start:dev

# 3. Portal de Operações — http://localhost:3001
cd core/frontend-operations && npm run dev

# 4. Portal do Cidadão — http://localhost:3002
cd core/frontend-citizen && npm run dev
```

Pré-requisitos: **Node.js 20+** e **Docker**. Cada aplicação em `core/` precisa de um
`npm install` e de um arquivo de ambiente na primeira execução — os passos completos estão
no `README.md` de cada pasta.

## Documentação

A documentação completa está em [docs/README.md](docs/README.md).

## Status

🚧 Em desenvolvimento.

- ✅ Estrutura do repositório e documentação
- ✅ Bootstrap das três aplicações (NestJS + dois Next.js), com dependências instaladas
- ✅ Requisitos funcionais e não funcionais das três aplicações (332 requisitos)
- ✅ Plano de implementação em 20 etapas
- ✅ Modelagem do banco no Prisma e migração inicial
- ✅ **API completa** — as 27 rotas do contrato, 143 testes unitários e 104 end-to-end
- ⬜ Telas dos portais

O estado detalhado está em [docs/registro-de-progresso.md](docs/registro-de-progresso.md).
