# Dados de demonstração

O que `npm run seed:demo` coloca no banco, e para que cada coisa serve.

Documentos relacionados: [Visão geral do backend](README.md) ·
[Modelo de dados](modelo-de-dados.md) · [API REST](api.md) ·
[core/backend/README.md](../../core/backend/README.md)

> **Não são dados de produção.** As senhas estão escritas abaixo, em claro, de propósito: elas
> existem para que qualquer pessoa consiga abrir o sistema na própria máquina. Um ambiente
> exposto na internet não deve rodar este seed.

---

## 1. Para que serve

Com o banco vazio, quase nenhuma tela do Portal de Operações tem o que mostrar: a lista fica
vazia, o painel soma zeros, o mapa não tem pontos. E três requisitos só podem ser exercitados
com mais de uma conta — `RF-OP-52` (a rota de agentes oculta ao coordenador), `RF-OP-64` (um
agente que **não** é o responsável) e `RF-OP-53` (um agente inativo distinguido na lista).

O conjunto foi montado para cobrir, com o menor número de registros possível, **todas as
variações que as telas precisam tratar**: as seis situações, as quatro prioridades, ocorrências
com e sem coordenadas, identificadas e anônimas, com e sem responsável, com e sem fotos.

## 2. Como criar

```bash
# na raiz do repositório
make setup                     # inclui o seed de demonstração

# ou, em core/backend, separadamente
npx prisma db seed             # só o administrador do primeiro acesso
npm run seed:demo              # contas e ocorrências de demonstração
```

O seed de demonstração **não apaga nada**: as contas são criadas ou atualizadas pelo e-mail, e
as ocorrências só entram quando o banco ainda não tem nenhuma. Para inseri-las num banco que já
tem dados, `SEED_DEMO_FORCE=1 npm run seed:demo`.

**As fotos exigem a API no ar.** Elas são enviadas pelo `POST /reports/:id/attachments`, o mesmo
endpoint do Portal do Cidadão — o seed não grava em disco
([decisão 07](../arquitetura.md#armazenamento-de-anexos-decisão-07)). Sem a API, o seed avisa e
cria todo o resto.

Para começar de novo do zero: `make db-reset` seguido de `make seed-demo`.

## 3. Contas

Todas com a senha **`sisdec-demo`**, exceto o administrador. Para trocá-la, defina
`SEED_DEMO_PASSWORD` antes de rodar o seed.

| E-mail | Senha | Nome | Perfil | Ativo | Existe para |
|---|---|---|---|---|---|
| `admin@sisdec.local` | `sisdec-admin` | Administrador do SISDEC | Administrador | sim | Único acesso a `/agentes`. Criado pelo seed de produção, não por este |
| `coordenadora@sisdec.local` | `sisdec-demo` | Helena Prado | Coordenador | sim | Triagem e atribuição. **Não** enxerga `/agentes` (`RF-OP-52`) |
| `agente.ana@sisdec.local` | `sisdec-demo` | Ana Souza | Agente | sim | Responsável por 4 ocorrências; só altera a situação delas |
| `agente.bruno@sisdec.local` | `sisdec-demo` | Bruno Martins | Agente | sim | Responsável por 3. Use-o numa ocorrência da Ana para ver o `RF-OP-64` |
| `agente.inativo@sisdec.local` | — | Carla Nunes | Agente | **não** | `RF-OP-53`: aparece como inativa em `/agentes`, fica fora de `GET /reports/assignable-agents` e recebe `401` no login |

> O administrador é criado por `prisma db seed`, e a sua senha padrão é `sisdec-admin`
> (configurável em `SEED_ADMIN_PASSWORD`). Os outros quatro são deste seed.

## 4. Ocorrências

14 registros, com protocolos de `SISDEC-2026-000001` a `SISDEC-2026-000014` — a numeração
continua a sequência do ano, então a próxima ocorrência criada pela API sai como `000015`.

As datas são **relativas ao dia em que o seed roda**: a coluna "dias" é quanto tempo atrás cada
uma foi registrada, e é isso que dá forma ao gráfico de volume do painel.

| Protocolo | Situação | Prioridade | Tipo | Bairro | Responsável | Registro | Ponto | Fotos | Dias |
|---|---|---|---|---|---|---|---|---|---|
| 000001 | Recebida | — | Alagamento | Centro | — | Maria Silva | sim | 2 | 1 |
| 000002 | Recebida | — | Árvore em perigo | Vila Nova | — | anônimo | sim | 1 | 2 |
| 000003 | Recebida | — | Bueiro obstruído | São Bento | — | João Pereira | **não** | — | 3 |
| 000004 | Recebida | — | Outros (sugestão) | Centro | — | anônimo | **não** | — | 10 |
| 000005 | Em triagem | — | Deslizamento | Morro Alto | — | Rita Alves | sim | — | 4 |
| 000006 | Em triagem | — | Poste caído | Riacho Fundo | — | anônimo | sim | — | 5 |
| 000007 | Em atendimento | Alta | Incêndio em vegetação | Jardim das Acácias | Ana Souza | Paulo Dias | sim | **3** | 8 |
| 000008 | Em atendimento | **Crítica** | Muro com risco | Centro | Bruno Martins | Sônia Ramos | sim | 1 | 12 |
| 000009 | Em atendimento | Média | Erosão de margem | Riacho Fundo | Ana Souza | anônimo | **não** | — | 15 |
| 000010 | Em atendimento | Baixa | Animal peçonhento | Vila Nova | Bruno Martins | Escola Municipal | sim | — | 6 |
| 000011 | Resolvida | Média | Danos por vendaval | São Bento | Ana Souza | Assoc. de Moradores | sim | — | 25 |
| 000012 | Resolvida | Alta | Alagamento | Centro | Bruno Martins | anônimo | sim | — | 34 |
| 000013 | **Improcedente** | — | Outros (reclamação) | Jardim das Acácias | — | Clara Nogueira | sim | — | 18 |
| 000014 | **Cancelada** | Alta | Vazamento de gás | Morro Alto | Ana Souza | Edson Lima | sim | — | 40 |

### O que a distribuição garante

| Recorte | Resultado |
|---|---|
| Situações | 4 recebidas, 2 em triagem, 4 em atendimento, 2 resolvidas, 1 improcedente, 1 cancelada |
| Em aberto | **10** das 14 — é o número do primeiro indicador do painel |
| Prioridades | 1 crítica, 3 altas, 2 médias, 1 baixa; **7 sem prioridade** (recebidas e em triagem) |
| Críticas e altas **em aberto** | 1 e 1 — contra 1 e 3 no total. É a diferença que o `RF-API-73` existe para expor |
| Sem coordenadas | **3** — alimentam o `omittedWithoutCoordinates` do mapa |
| Anônimas | **5** — exercitam o `RF-OP-26` |
| Bairros | Centro (4), e 2 em cada um dos outros cinco |
| Tipos | 12 tipos distintos entre os 14 registros |

## 5. Fotos

7 arquivos em 4 ocorrências. São **PNG gerados** (`prisma/demo-image.ts`), faixas de cor de
640 × 480 — não fotografias. Precisam ser imagens de verdade porque o envio confere o tipo pela
assinatura dos bytes (`RNF-API-13`), e serem sintéticas deixa evidente que o dado é de
demonstração.

| Protocolo | Arquivos |
|---|---|
| 000001 | `rua-alagada.png`, `calcada.png` |
| 000002 | `arvore-inclinada.png` |
| 000007 | `fumaca-terreno.png`, `frente-do-fogo.png`, `casas-proximas.png` |
| 000008 | `rachadura-muro.png` |

Duas delas estão em ocorrências **já em atendimento** (000007 e 000008), que é o caso em que o
agente de fato abre a galeria do detalhe. Para isso, o seed cria cada ocorrência em três fases
— recebida, fotos, situação atual —, porque a API só aceita anexo enquanto o registro está em
`RECEIVED` (`RF-API-69`).

## 6. Histórico

24 andamentos: **8 visíveis ao cidadão**, 16 internos, dos quais 3 são observações sem mudança
de situação.

A API marca **toda** mudança de situação como visível ao cidadão, para que o acompanhamento por
protocolo mostre o andamento do atendimento. Os internos aqui são as entradas de triagem
assumida e as observações de atribuição de responsável.

A ocorrência **000007** é a mais completa, e a melhor para inspecionar o detalhe:

| Andamento | Visibilidade | Autor |
|---|---|---|
| Recebida → Em triagem | interno | Helena Prado |
| Em triagem → Em atendimento, com comentário | **público** | Helena Prado |
| Observação: responsável definido | interno | Helena Prado |
| Observação: equipe no local | **público** | Ana Souza |

## 7. Cidadãos

9 registros — um por ocorrência identificada. Entre eles, 6 com e-mail e 5 com telefone, de modo
que o detalhe mostre as três combinações: contato completo, parcial e ausente.

Os e-mails usam o domínio reservado `.invalid`, que por definição nunca existe: dado de
demonstração não deve poder alcançar ninguém por engano.

## 8. Por onde começar a olhar

| Para ver | Entre como | Vá a |
|---|---|---|
| Triagem em duas etapas | Helena Prado | `/ocorrencias?situacao=RECEIVED` → abra a 000001 |
| Atendimento e encerramento | Ana Souza | a 000007, que é dela |
| A recusa do `RF-OP-64` | Bruno Martins | a 000007, que é da Ana — aparece o motivo, não os botões |
| Fotos com ampliação | qualquer agente | a 000007, com três |
| Ausência de coordenadas | qualquer agente | a 000003 |
| Registro anônimo | qualquer agente | a 000002 |
| Críticas em aberto x totais | qualquer agente | `/` — compare os cartões com a linha "Por prioridade" |
| Mapa com as cinco formas | qualquer agente | `/mapa` — 7 pontos, 3 omitidas |
| Gestão de agentes | **apenas** o administrador | `/agentes` — Carla Nunes aparece inativa |
| Exportação em CSV | Helena Prado ou o admin | `/ocorrencias` → "Exportar CSV" |
