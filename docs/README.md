# Documentação — SISDEC

Índice da documentação do **Sistema Integrado da Defesa Civil**.

---

## 1. Resumo do projeto

O **SISDEC** é um sistema web que centraliza, em um único canal, o registro de
reclamações, sugestões e comunicações de possíveis situações de risco feitas pela
população à Defesa Civil.

O sistema é composto por três aplicações:

- **Portal do Cidadão** — onde qualquer pessoa registra uma ocorrência (com descrição,
  fotos e localização) e acompanha o andamento pelo número de protocolo;
- **Portal de Operações** — onde os agentes da Defesa Civil recebem, triam, priorizam,
  atribuem e resolvem as ocorrências;
- **API (backend)** — responsável pelas regras de negócio, persistência dos dados,
  autenticação e integração entre os dois portais.

### Fluxo geral

```
Cidadão                        API (SISDEC)                    Agente
   │                                │                             │
   ├─ registra ocorrência ─────────>│                             │
   │<──── nº de protocolo ──────────┤                             │
   │                                │──── nova ocorrência ───────>│
   │                                │                             ├─ tria e prioriza
   │                                │                             ├─ atribui responsável
   │                                │<──── atualiza situação ─────┤
   │<──── consulta protocolo ──────>│                             │
   │                                │                             ├─ conclui atendimento
```

---

## 2. Índice

### Geral

- [Arquitetura](arquitetura.md) — visão geral, decisões técnicas e organização do código
- [Glossário](glossario.md) — termos do domínio usados em todo o projeto
- [Plano de implementação](plano-de-implementacao.md) — ordem de construção das três aplicações, etapa por etapa
- [Registro de progresso](registro-de-progresso.md) — o que já foi construído, o que falta e o próximo passo

### Por aplicação

- **Backend (API)**
  - [Visão geral](backend/README.md)
  - [Modelo de dados](backend/modelo-de-dados.md)
  - [API REST](backend/api.md)
  - [Requisitos funcionais](backend/requisitos-funcionais.md)
  - [Requisitos não funcionais](backend/requisitos-nao-funcionais.md)
  - [Dados de demonstração](backend/dados-de-demonstracao.md)
- **Portal de Operações (agentes)**
  - [Visão geral](frontend-operations/README.md)
  - [Requisitos funcionais](frontend-operations/requisitos-funcionais.md)
  - [Requisitos não funcionais](frontend-operations/requisitos-nao-funcionais.md)
- **Portal do Cidadão**
  - [Visão geral](frontend-citizen/README.md)
  - [Requisitos funcionais](frontend-citizen/requisitos-funcionais.md)
  - [Requisitos não funcionais](frontend-citizen/requisitos-nao-funcionais.md)

### Requisitos

Cada aplicação tem os seus requisitos em dois documentos separados — funcionais (`RF`) e
não funcionais (`RNF`) —, com identificadores próprios por aplicação:

| Aplicação | Prefixo | Funcionais | Não funcionais |
|---|---|---|---|
| Backend (API) | `RF-API` / `RNF-API` | [requisitos-funcionais.md](backend/requisitos-funcionais.md) | [requisitos-nao-funcionais.md](backend/requisitos-nao-funcionais.md) |
| Portal de Operações | `RF-OP` / `RNF-OP` | [requisitos-funcionais.md](frontend-operations/requisitos-funcionais.md) | [requisitos-nao-funcionais.md](frontend-operations/requisitos-nao-funcionais.md) |
| Portal do Cidadão | `RF-CID` / `RNF-CID` | [requisitos-funcionais.md](frontend-citizen/requisitos-funcionais.md) | [requisitos-nao-funcionais.md](frontend-citizen/requisitos-nao-funcionais.md) |

---

## 3. Convenções da documentação

- Todos os documentos são escritos em **Markdown**, em **português (pt-BR)**.
- Nomes de arquivos em **kebab-case** e sem acentos (ex.: `modelo-de-dados.md`).
- Trechos de código, nomes de tabelas, campos e endpoints permanecem em **inglês**,
  acompanhando o código-fonte.
- Termos do domínio seguem o [Glossário](glossario.md) — se um termo novo aparecer no
  código, ele deve ser registrado lá.
