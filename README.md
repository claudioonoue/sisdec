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
├── Makefile                   # Atalhos de desenvolvimento (make para listar)
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

Pré-requisitos: **Node.js 20+**, **Docker** e **GNU Make**.

```bash
make setup    # primeira vez: instala, cria os .env, sobe o banco, migra e semeia
make dev      # sobe API e os dois portais juntos; Ctrl-C derruba todos
```

| | |
|---|---|
| API | http://localhost:3000/api/v1 — Swagger em `/api/docs` |
| Portal de Operações | http://localhost:3001 |
| Portal do Cidadão | http://localhost:3002 |

Entre no Portal de Operações com `admin@sisdec.local` / `sisdec-admin`. O `make setup`
também cria contas e ocorrências de demonstração — sem elas, as telas de lista, painel e
mapa não têm o que exibir.

`make` sozinho lista todos os alvos. Os mais usados:

| Comando | O que faz |
|---|---|
| `make api` / `make ops` / `make cid` | Sobe **uma** aplicação, em primeiro plano |
| `make stop` | Derruba o que tiver ficado ocupando as portas 3000–3002 |
| `make check` | `tsc`, lint e testes das três aplicações |
| `make test-e2e` | Testes end-to-end da API |
| `make db` / `make db-stop` / `make db-reset` | Banco de dados |

### O Makefile não é um sistema de build

Ele entra na pasta certa e chama o comando que já existe ali. Os três projetos de `core/`
continuam **independentes**, cada um com o seu `package.json`
([decisão 01](docs/arquitetura.md#5-decisões-técnicas-registradas)): apagar o Makefile não
impede nenhum deles de ser instalado ou executado, e os comandos por pasta continuam
documentados no `README.md` de cada uma.

É um Makefile, e não um `package.json` na raiz, justamente por isso — um package.json criaria
um quarto projeto Node, com `node_modules` e resolução de dependências próprios, que é o
acoplamento que a decisão evita.

## Documentação

A documentação completa está em [docs/README.md](docs/README.md).

## Status

✅ **As 20 etapas do plano estão concluídas.**

- ✅ Estrutura do repositório e documentação
- ✅ Requisitos funcionais e não funcionais das três aplicações (335 requisitos)
- ✅ Plano de implementação em 20 etapas
- ✅ Modelagem do banco no Prisma e migração inicial
- ✅ **API completa** — as 27 rotas do contrato, 160 testes unitários e 124 end-to-end
- ✅ **Portal de Operações completo** — etapas O1 a O7, com 53 testes
- ✅ **Portal do Cidadão completo** — etapas C1 a C5, com 181 testes
- ⬜ Conferências que exigem um navegador: responsividade em larguras reais, navegadores e
  leitor de tela. Estão listadas em [docs/registro-de-progresso.md](docs/registro-de-progresso.md)

O estado detalhado está em [docs/registro-de-progresso.md](docs/registro-de-progresso.md).
