# Modelo de dados

Banco relacional **PostgreSQL**, acessado via **Prisma**.

> Proposta inicial — deve ser revisada antes da primeira migração.

## 1. Diagrama

```
┌───────────┐          ┌───────────────────┐          ┌────────────────┐
│  Citizen  │1        *│      Report       │*        1│     Agent      │
│           ├─────────>│                   │<─────────┤  (assignedTo)  │
└───────────┘          │  protocolNumber   │          └────────┬───────┘
                       │  category         │                   │1
                       │  type             │                   │
                       │  status           │                   │*
                       │  priority         │          ┌────────┴───────┐
                       │  description      │1        *│  ReportUpdate  │
                       │  address / lat/lng├─────────>│  (histórico)   │
                       └─────────┬─────────┘          └────────────────┘
                                 │1
                                 │*
                       ┌─────────┴─────────┐
                       │    Attachment     │
                       └───────────────────┘
```

## 2. Entidades

### Report — ocorrência
Registro central do sistema.

| Campo | Tipo | Observações |
|---|---|---|
| `id` | UUID | Chave primária |
| `protocolNumber` | String | Único. Formato `SISDEC-AAAA-NNNNNN` |
| `category` | Enum `ReportCategory` | Reclamação, sugestão, solicitação ou risco |
| `type` | Enum `ReportType` | Assunto da ocorrência |
| `status` | Enum `ReportStatus` | Situação atual |
| `priority` | Enum `Priority`? | Nula no registro; definida na triagem |
| `description` | Text | Relato do cidadão |
| `address` | String | Endereço informado |
| `district` | String | Bairro |
| `latitude` / `longitude` | Decimal | Opcionais |
| `citizenId` | UUID? | Nulo quando o registro é anônimo |
| `assignedToId` | UUID? | Agente responsável |
| `createdAt` / `updatedAt` | DateTime | |
| `resolvedAt` | DateTime? | Nulo até a transição para `RESOLVED` |

### Citizen — cidadão
Preenchido apenas quando a pessoa opta por se identificar.

| Campo | Tipo |
|---|---|
| `id` | UUID |
| `name` | String |
| `email` | String? |
| `phone` | String? |
| `createdAt` | DateTime |

### Agent — agente da Defesa Civil

| Campo | Tipo | Observações |
|---|---|---|
| `id` | UUID | |
| `name` | String | |
| `email` | String | Único — usado no login |
| `passwordHash` | String | bcrypt |
| `role` | Enum `AgentRole` | `ADMIN`, `COORDINATOR`, `AGENT` |
| `active` | Boolean | Desativação em vez de exclusão |
| `createdAt` / `updatedAt` | DateTime | |

### ReportUpdate — andamento
Uma linha para cada mudança de situação ou observação registrada.

| Campo | Tipo | Observações |
|---|---|---|
| `id` | UUID | |
| `reportId` | UUID | |
| `agentId` | UUID | Autor do andamento |
| `fromStatus` / `toStatus` | Enum `ReportStatus`? | Nulos quando o andamento é apenas uma observação, sem mudança de situação |
| `comment` | Text? | Obrigatório nas transições para `RESOLVED`, `REJECTED` e `CANCELLED` e nas observações; opcional nas demais transições |
| `visibleToCitizen` | Boolean | Padrão `false` |
| `createdAt` | DateTime | |

### Attachment — anexo

| Campo | Tipo |
|---|---|
| `id` | UUID |
| `reportId` | UUID |
| `fileName` | String |
| `storedPath` | String |
| `mimeType` | String |
| `sizeInBytes` | Int |
| `createdAt` | DateTime |

## 3. Enumerações

```
ReportCategory  COMPLAINT | SUGGESTION | REQUEST | RISK_ALERT
                (reclamação | sugestão | solicitação | comunicação de risco)

ReportType      FLOODING            alagamento ou enchente
                LANDSLIDE           deslizamento de terra ou queda de barreira
                EROSION             erosão ou solapamento de margem
                DANGEROUS_TREE      árvore em situação de perigo
                DAMAGED_STRUCTURE   edificação ou muro com risco de desabamento
                STRUCTURE_COLLAPSE  desabamento já ocorrido
                FALLEN_POLE         poste ou fiação caída
                FIRE                incêndio em edificação
                VEGETATION_FIRE     incêndio em vegetação ou queimada
                HAZARDOUS_MATERIAL  vazamento de gás, combustível ou produto químico
                WILD_ANIMAL         animal selvagem ou peçonhento em área urbana
                STORM_DAMAGE        destelhamento e danos por vendaval ou granizo
                BLOCKED_DRAINAGE    bueiro, galeria ou córrego obstruído
                OTHER               outros

ReportStatus    RECEIVED    recebida
                TRIAGE      em triagem
                IN_PROGRESS em atendimento
                RESOLVED    resolvida
                REJECTED    improcedente
                CANCELLED   cancelada

Priority        LOW | MEDIUM | HIGH | CRITICAL

AgentRole       ADMIN | COORDINATOR | AGENT
```

> **Sobre `ReportType`**: a lista é um `enum` do PostgreSQL, o que garante tipagem no
> Prisma e impede valores inválidos, mas exige uma migração para incluir um novo tipo.
> Como os frontends consultam os tipos pelo endpoint `GET /metadata` em vez de terem
> a lista fixa no código, trocar o enum por uma tabela `report_types` no futuro não altera
> o contrato da API nem a interface.

> **Tipos e prioridade**: alguns tipos indicam risco imediato à vida — `FIRE`,
> `VEGETATION_FIRE`, `HAZARDOUS_MATERIAL`, `STRUCTURE_COLLAPSE` e `LANDSLIDE`. A triagem
> deve sugerir prioridade `HIGH` ou `CRITICAL` para eles, e a interface do cidadão deve
> reforçar o aviso de acionamento dos telefones de emergência ao selecioná-los.

## 4. Ciclo de vida da ocorrência

```
                    ┌──────────┐
   cidadão registra │ RECEIVED │
                    └────┬─────┘
                         │ agente assume a triagem
                    ┌────▼─────┐
                    │  TRIAGE  ├──────────────┐ triagem conclui que não procede
                    └────┬─────┘              │
        prioridade e     │              ┌─────▼──────┐
        responsável      │              │  REJECTED  │
                    ┌────▼────────┐     └────────────┘
                    │ IN_PROGRESS ├──────────────┐ agente cancela
                    └────┬────────┘              │
                         │ atendimento concluído │
                    ┌────▼─────┐           ┌─────▼──────┐
                    │ RESOLVED │           │ CANCELLED  │
                    └──────────┘           └────────────┘
```

Toda transição gera um registro em `ReportUpdate`.

Cada transição tem um endpoint responsável — nenhuma situação do enum fica inalcançável:

| Transição | Endpoint | Perfis |
|---|---|---|
| — → `RECEIVED` | `POST /reports` | cidadão (sem autenticação) |
| `RECEIVED` → `TRIAGE` | `PATCH /reports/:id/triage/start` | coordenador, admin |
| `TRIAGE` → `IN_PROGRESS` | `PATCH /reports/:id/triage` (`outcome: ACCEPT`) | coordenador, admin |
| `TRIAGE` → `REJECTED` | `PATCH /reports/:id/triage` (`outcome: REJECT`) | coordenador, admin |
| `IN_PROGRESS` → `RESOLVED` | `PATCH /reports/:id/status` | responsável, coordenador, admin |
| `IN_PROGRESS` → `CANCELLED` | `PATCH /reports/:id/status` | responsável, coordenador, admin |

Qualquer transição fora desta tabela é recusada com `400`.

## 5. Regras de negócio

1. O `protocolNumber` é gerado no momento do registro e nunca é alterado. A sequência
   (`NNNNNN`) é reiniciada a cada ano, de modo que o código é único apenas em conjunto
   com o ano (`AAAA`).
2. Ocorrência anônima tem `citizenId` nulo — o acompanhamento se dá apenas por protocolo.
3. Somente agentes autenticados alteram `status`, `priority` e `assignedToId`.
4. `resolvedAt` é preenchido automaticamente na transição para `RESOLVED`.
5. Andamentos com `visibleToCitizen = false` não aparecem na consulta pública.
6. Agentes são desativados (`active = false`), nunca excluídos, para preservar o histórico.
7. `priority` é nula enquanto a ocorrência não passa pela triagem; a partir de `IN_PROGRESS`
   ela é sempre preenchida.
8. A improcedência (`REJECTED`) só pode ser declarada a partir de `TRIAGE`, e exige
   comentário — é a conclusão de uma análise, não uma recusa imediata do registro.
9. A prioridade não é exposta na consulta pública por protocolo: é uma classificação
   operacional interna.
10. O agente de perfil `AGENT` só altera a situação da ocorrência em que consta como
    `assignedToId`; coordenador e administrador alteram qualquer uma. Registrar observação no
    histórico, porém, é permitido a qualquer agente autenticado.
11. Anexos só são aceitos enquanto a ocorrência está em `RECEIVED` — a janela entre o registro
    pelo cidadão e o início da triagem.
