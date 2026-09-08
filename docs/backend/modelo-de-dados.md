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
                       │  description      │*        1│  ReportUpdate  │
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
| `priority` | Enum `Priority` | Definida na triagem |
| `description` | Text | Relato do cidadão |
| `address` | String | Endereço informado |
| `district` | String | Bairro |
| `latitude` / `longitude` | Decimal | Opcionais |
| `citizenId` | UUID? | Nulo quando o registro é anônimo |
| `assignedToId` | UUID? | Agente responsável |
| `createdAt` / `updatedAt` / `resolvedAt` | DateTime | |

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

| Campo | Tipo |
|---|---|
| `id` | UUID |
| `reportId` | UUID |
| `agentId` | UUID |
| `fromStatus` / `toStatus` | Enum `ReportStatus`? |
| `comment` | Text |
| `visibleToCitizen` | Boolean |
| `createdAt` | DateTime |

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
> Como os frontends consultam os tipos pelo endpoint `GET /report-types` em vez de terem
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
                    │ IN_PROGRESS ├──────────────┐ cidadão/agente cancela
                    └────┬────────┘              │
                         │ atendimento concluído │
                    ┌────▼─────┐           ┌─────▼──────┐
                    │ RESOLVED │           │ CANCELLED  │
                    └──────────┘           └────────────┘
```

Toda transição gera um registro em `ReportUpdate`.

## 5. Regras de negócio

1. O `protocolNumber` é gerado no momento do registro e nunca é alterado.
2. Ocorrência anônima tem `citizenId` nulo — o acompanhamento se dá apenas por protocolo.
3. Somente agentes autenticados alteram `status`, `priority` e `assignedToId`.
4. `resolvedAt` é preenchido automaticamente na transição para `RESOLVED`.
5. Andamentos com `visibleToCitizen = false` não aparecem na consulta pública.
6. Agentes são desativados (`active = false`), nunca excluídos, para preservar o histórico.
