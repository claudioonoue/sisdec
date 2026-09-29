# Requisitos Funcionais — Portal de Operações

Aplicação: **Portal de Operações** — `core/frontend-operations` (Next.js + Leaflet), porta
`3001`. Acesso restrito a agentes autenticados da Defesa Civil.

Documentos relacionados: [Visão geral](README.md) · [API REST](../backend/api.md) ·
[Modelo de dados](../backend/modelo-de-dados.md) · [Arquitetura](../arquitetura.md) ·
[Requisitos não funcionais](requisitos-nao-funcionais.md)

---

## 1. Convenções

- **Identificador**: `RF-OP-nn`, único e permanente. As linhas das tabelas seguem a **ordem
  do fluxo**, não a ordem numérica: um requisito acrescentado depois aparece na posição em
  que faz sentido ser lido, mantendo o seu número original.
- **Prioridade**: **Essencial**, **Importante** ou **Desejável**.
- **Perfil**: quem pode executar o requisito — *Agente*, *Coordenador*, *Administrador* ou
  *Sistema* (comportamento automático).
- Os perfis são cumulativos: o coordenador possui todas as permissões do agente, e o
  administrador todas as do coordenador.
- Toda operação sobre dados é feita por chamada à API (`NEXT_PUBLIC_API_URL`); o portal não
  possui banco de dados nem regra de negócio própria — as restrições de tela são
  conveniência de interface e **não substituem** a autorização verificada pela API.

---

## 2. Autenticação e sessão

| ID | Requisito | Perfil | Prioridade |
|---|---|---|---|
| RF-OP-01 | Apresentar em `/login` o formulário de autenticação por e-mail e senha, enviado a `POST /auth/login`. | Agente | Essencial |
| RF-OP-02 | Exibir mensagem de erro clara quando as credenciais forem recusadas, sem indicar se o erro foi no e-mail ou na senha. | Sistema | Essencial |
| RF-OP-03 | Armazenar o token JWT recebido e enviá-lo no cabeçalho `Authorization: Bearer <token>` em todas as requisições subsequentes. | Sistema | Essencial |
| RF-OP-04 | Bloquear o acesso a todas as rotas do portal, exceto `/login`, enquanto não houver sessão válida, redirecionando para a tela de login. | Sistema | Essencial |
| RF-OP-05 | Obter os dados do agente autenticado por `GET /auth/me` e exibir o seu nome e perfil na interface. | Sistema | Essencial |
| RF-OP-06 | Encerrar a sessão por ação explícita do agente (sair), descartando o token e retornando à tela de login. | Agente | Essencial |
| RF-OP-07 | Detectar a expiração ou a invalidação do token (resposta `401`), encerrar a sessão e informar ao agente que é necessário entrar novamente. | Sistema | Essencial |
| RF-OP-08 | Retornar à tela pretendida após um login provocado por expiração de sessão. | Sistema | Desejável |

## 3. Painel de indicadores

| ID | Requisito | Perfil | Prioridade |
|---|---|---|---|
| RF-OP-09 | Apresentar em `/` o painel com os indicadores obtidos de `GET /dashboard/summary`: total de ocorrências abertas e totais por situação, por prioridade e por tipo. | Agente | Essencial |
| RF-OP-10 | Destacar no painel as ocorrências de prioridade `CRITICAL` e `HIGH` ainda não concluídas. | Agente | Essencial |
| RF-OP-11 | Exibir a distribuição de ocorrências por bairro, a partir de `GET /dashboard/by-district`. | Agente | Importante |
| RF-OP-12 | Exibir o volume de registros ao longo do tempo, a partir de `GET /dashboard/timeline`. | Agente | Importante |
| RF-OP-13 | Permitir que cada indicador do painel conduza à lista de ocorrências já filtrada pelo recorte correspondente. | Agente | Importante |
| RF-OP-14 | Permitir recortar o painel por período. | Agente | Desejável |

## 4. Lista de ocorrências

| ID | Requisito | Perfil | Prioridade |
|---|---|---|---|
| RF-OP-15 | Listar as ocorrências em `/ocorrencias`, em tabela, exibindo protocolo, tipo, categoria, situação, prioridade, bairro, responsável e data de registro. | Agente | Essencial |
| RF-OP-16 | Oferecer filtros combináveis por situação, tipo, categoria, prioridade, bairro, período e responsável. | Agente | Essencial |
| RF-OP-17 | Oferecer busca por número de protocolo e por conteúdo da descrição. | Agente | Essencial |
| RF-OP-18 | Paginar a listagem, informando a página atual e o total de registros encontrados. | Agente | Essencial |
| RF-OP-19 | Permitir a ordenação da lista por data de registro e por prioridade. | Agente | Importante |
| RF-OP-20 | Oferecer um atalho para as ocorrências atribuídas ao próprio agente autenticado. | Agente | Importante |
| RF-OP-21 | Refletir os filtros ativos no endereço da página, de modo que a lista filtrada possa ser recarregada e compartilhada entre agentes. | Sistema | Importante |
| RF-OP-22 | Exibir mensagem apropriada quando nenhum registro atender aos filtros, sem apresentar tabela vazia sem explicação. | Sistema | Importante |
| RF-OP-23 | Distinguir visualmente as situações e as prioridades por cor **acompanhada de rótulo em pt-BR**. | Sistema | Essencial |
| RF-OP-24 | Permitir exportar a lista filtrada em formato CSV por `GET /reports/export`, sem montar o arquivo no navegador a partir de páginas sucessivas da listagem. | Coordenador | Importante |

## 5. Detalhe da ocorrência

| ID | Requisito | Perfil | Prioridade |
|---|---|---|---|
| RF-OP-25 | Apresentar em `/ocorrencias/[id]` o detalhe completo obtido de `GET /reports/:id`: protocolo, categoria, tipo, situação, prioridade, descrição, endereço, bairro e datas. | Agente | Essencial |
| RF-OP-26 | Exibir os dados de contato do cidadão quando a ocorrência não for anônima, e indicar explicitamente **"registro anônimo"** quando for. | Agente | Essencial |
| RF-OP-27 | Exibir as fotos anexadas, com ampliação ao serem acionadas, sempre pela URL devolvida pela API. | Agente | Essencial |
| RF-OP-28 | Exibir o ponto da ocorrência em mapa quando houver coordenadas, e indicar a ausência de coordenadas quando não houver. | Agente | Essencial |
| RF-OP-29 | Exibir o histórico completo de andamentos em ordem cronológica, com autor, data, transição de situação e indicação de quais são visíveis ao cidadão. | Agente | Essencial |
| RF-OP-30 | Oferecer, no detalhe, apenas as ações compatíveis com a situação atual da ocorrência e com o perfil do agente autenticado. | Sistema | Essencial |

## 6. Atendimento da ocorrência

| ID | Requisito | Perfil | Prioridade |
|---|---|---|---|
| RF-OP-62 | Assumir a triagem de uma ocorrência em `RECEIVED` por `PATCH /reports/:id/triage/start`, sinalizando na lista e no detalhe que a análise já tem responsável. | Coordenador | Essencial |
| RF-OP-31 | Concluir a triagem — confirmar o tipo, definir a prioridade e escolher entre **encaminhar** (`ACCEPT`) e **marcar como improcedente** (`REJECT`) — por `PATCH /reports/:id/triage`. | Coordenador | Essencial |
| RF-OP-63 | Exigir comentário do coordenador ao concluir a triagem como improcedente, informando que essa decisão encerra a ocorrência. | Sistema | Essencial |
| RF-OP-32 | Sugerir prioridade `HIGH` ou `CRITICAL` na triagem quando o tipo da ocorrência estiver marcado como `urgent`, permitindo ao coordenador alterar a sugestão. | Sistema | Importante |
| RF-OP-33 | Atribuir um agente responsável pela ocorrência por `PATCH /reports/:id/assign`, escolhido entre os agentes ativos obtidos de `GET /reports/assignable-agents` — sem depender de `GET /agents`, restrito ao administrador. | Coordenador | Essencial |
| RF-OP-34 | Alterar a situação da ocorrência por `PATCH /reports/:id/status`, oferecendo apenas as transições válidas a partir da situação atual — para ocorrências em `IN_PROGRESS`, concluir ou cancelar. | Agente | Essencial |
| RF-OP-64 | Não oferecer ao agente de perfil `AGENT` as ações de mudança de situação em ocorrência que não lhe esteja atribuída, exibindo o motivo; coordenador e administrador veem as ações em qualquer ocorrência. | Sistema | Essencial |
| RF-OP-35 | Exigir um comentário ao registrar a conclusão (`RESOLVED`) ou o cancelamento (`CANCELLED`) da ocorrência. A improcedência é declarada na conclusão da triagem (`RF-OP-63`), não por este caminho. | Sistema | Essencial |
| RF-OP-36 | Registrar observação no histórico por `POST /reports/:id/updates`, com escolha explícita de **visível ao cidadão** ou **interno**. | Agente | Essencial |
| RF-OP-37 | Alertar, ao marcar um andamento como visível ao cidadão, que o texto será exibido na consulta pública por protocolo. | Sistema | Importante |
| RF-OP-38 | Solicitar confirmação antes de concluir, cancelar ou marcar como improcedente uma ocorrência. | Sistema | Importante |
| RF-OP-39 | Atualizar a tela com a nova situação e o novo andamento imediatamente após a operação ser aceita pela API. | Sistema | Essencial |
| RF-OP-40 | Informar o agente e preservar os dados digitados quando a API recusar a operação (`400`, `403` ou `409`), permitindo nova tentativa. | Sistema | Essencial |

## 7. Mapa de ocorrências

| ID | Requisito | Perfil | Prioridade |
|---|---|---|---|
| RF-OP-41 | Apresentar em `/mapa` as ocorrências abertas plotadas geograficamente pelo componente `<ReportMap>`, obtidas de `GET /reports/map`. | Agente | Essencial |
| RF-OP-42 | Diferenciar os pontos no mapa por **cor conforme a prioridade**, com legenda textual correspondente. | Sistema | Essencial |
| RF-OP-43 | Exibir, ao acionar um ponto, um resumo da ocorrência (protocolo, tipo, situação e prioridade) com acesso ao seu detalhe. | Agente | Essencial |
| RF-OP-44 | Permitir filtrar o mapa por situação, tipo, prioridade e período. | Agente | Importante |
| RF-OP-45 | Informar quantas ocorrências ficaram fora do mapa por não ter coordenadas, a partir de `omittedWithoutCoordinates`. | Sistema | Importante |
| RF-OP-65 | Avisar o agente para estreitar os filtros quando `GET /reports/map` devolver `truncated: true`, deixando claro que o mapa não está exibindo todas as ocorrências do recorte. | Sistema | Importante |
| RF-OP-46 | Permanecer utilizável quando o mapa não carregar, oferecendo acesso à lista de ocorrências. | Sistema | Importante |

## 8. Gestão de agentes

| ID | Requisito | Perfil | Prioridade |
|---|---|---|---|
| RF-OP-47 | Apresentar em `/agentes` a relação dos agentes com nome, e-mail, perfil e situação de ativação. | Administrador | Essencial |
| RF-OP-48 | Cadastrar novo agente com nome, e-mail, senha inicial e perfil, por `POST /agents`. | Administrador | Essencial |
| RF-OP-49 | Informar o conflito de forma compreensível quando o e-mail informado já estiver cadastrado (`409`). | Sistema | Essencial |
| RF-OP-50 | Alterar os dados e o perfil de um agente por `PATCH /agents/:id`. | Administrador | Essencial |
| RF-OP-51 | Desativar um agente por `PATCH /agents/:id/deactivate`, com confirmação, deixando claro que o registro é **desativado e não excluído**. | Administrador | Essencial |
| RF-OP-52 | Ocultar a rota `/agentes` e o seu acesso na navegação para os perfis de agente e coordenador. | Sistema | Essencial |
| RF-OP-53 | Distinguir visualmente na lista os agentes inativos. | Administrador | Importante |
| RF-OP-54 | Impedir que o administrador autenticado desative a sua própria conta. | Sistema | Importante |

## 9. Comportamento geral da aplicação

| ID | Requisito | Perfil | Prioridade |
|---|---|---|---|
| RF-OP-55 | Consumir a API exclusivamente pelo endereço configurado em `NEXT_PUBLIC_API_URL`, sem endereços fixos no código. | Sistema | Essencial |
| RF-OP-56 | Obter as enumerações e os seus rótulos em pt-BR de `GET /metadata` (tipos, categorias e situações) e de `GET /metadata/internal` (prioridades e perfis), sem manter listas nem mapas de tradução fixos no código do portal. | Sistema | Essencial |
| RF-OP-57 | Exibir os rótulos de categoria, tipo, situação, prioridade e perfil em pt-BR, obtidos dos endpoints de metadados, sem apresentar ao agente os valores em inglês usados pela API. | Sistema | Essencial |
| RF-OP-58 | Sinalizar o carregamento em toda operação que dependa da API. | Sistema | Importante |
| RF-OP-59 | Exibir mensagem compreensível quando a API estiver indisponível, sem tela de erro técnico nem página em branco. | Sistema | Essencial |
| RF-OP-60 | Oferecer navegação permanente entre painel, ocorrências, mapa e — para o administrador — agentes. | Agente | Essencial |
| RF-OP-61 | Concentrar o uso do Leaflet exclusivamente no componente `<ReportMap>`, em `components/map/`, sem que nenhuma outra parte da interface importe a biblioteca. | Sistema | Essencial |

---

## 10. Fora do escopo desta versão

- envio de aviso ao cidadão pelo portal (e-mail, SMS ou notificação) ([decisão 09](../arquitetura.md#5-decisões-técnicas-registradas));
- notificação ativa ao agente sobre nova ocorrência — a verificação é feita pela consulta ao painel e à lista;
- recuperação de senha por autoatendimento — a redefinição é feita pelo administrador;
- registro de ocorrência pelo próprio agente (atendimento telefônico ou presencial);
- geração de relatórios em PDF e emissão de documentos oficiais;
- despacho e integração com equipes de campo em tempo real.
