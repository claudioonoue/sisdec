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

### Por aplicação

- **Backend (API)**
  - [Visão geral](backend/README.md)
  - [Modelo de dados](backend/modelo-de-dados.md)
  - [API REST](backend/api.md)
- **Portal de Operações (agentes)**
  - [Visão geral](frontend-operations/README.md)
- **Portal do Cidadão**
  - [Visão geral](frontend-citizen/README.md)

---

## 3. Convenções da documentação

- Todos os documentos são escritos em **Markdown**, em **português (pt-BR)**.
- Nomes de arquivos em **kebab-case** e sem acentos (ex.: `modelo-de-dados.md`).
- Trechos de código, nomes de tabelas, campos e endpoints permanecem em **inglês**,
  acompanhando o código-fonte.
- Termos do domínio seguem o [Glossário](glossario.md) — se um termo novo aparecer no
  código, ele deve ser registrado lá.
