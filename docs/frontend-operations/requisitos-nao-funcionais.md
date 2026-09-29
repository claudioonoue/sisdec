# Requisitos Não Funcionais — Portal de Operações

Aplicação: **Portal de Operações** — `core/frontend-operations` (Next.js + Leaflet), porta
`3001`.

Documentos relacionados: [Visão geral](README.md) · [Arquitetura](../arquitetura.md) ·
[Requisitos funcionais](requisitos-funcionais.md)

---

## 1. Convenções

- **Identificador**: `RNF-OP-nn`, único e permanente.
- **Prioridade**: **Essencial**, **Importante** ou **Desejável**.
- **Verificação**: como o atendimento ao requisito é comprovado.
- O contexto de uso orienta os requisitos deste documento: o agente trabalha
  **predominantemente em desktop**, por períodos longos, consultando muitas ocorrências em
  sequência, e precisa identificar rapidamente o que é urgente.

---

## 2. Usabilidade

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-OP-01 | Permitir chegar ao detalhe de uma ocorrência conhecida pelo protocolo em **no máximo 3 acionamentos** a partir do painel. | Importante | Percurso medido na aplicação |
| RNF-OP-02 | Manter a densidade de informação adequada ao trabalho em desktop, exibindo pelo menos **20 ocorrências por página** sem rolagem horizontal. | Importante | Inspeção da lista em 1280 px |
| RNF-OP-03 | Preservar os filtros aplicados ao retornar do detalhe de uma ocorrência para a lista. | Essencial | Teste de ida e retorno |
| RNF-OP-04 | Tornar a prioridade e a situação de cada ocorrência identificáveis em uma leitura rápida da lista, por cor **e** rótulo. | Essencial | Revisão da lista |
| RNF-OP-05 | Apresentar mensagens de erro junto ao campo ou à ação correspondente, em pt-BR e sem código técnico. | Essencial | Teste com operações recusadas pela API |
| RNF-OP-06 | Preservar os dados digitados (comentário de andamento, dados de agente) quando a operação falhar. | Essencial | Teste de envio com a API indisponível |
| RNF-OP-07 | Solicitar confirmação em toda ação de efeito difícil de reverter: concluir, cancelar ou marcar ocorrência como improcedente e desativar agente. | Essencial | Revisão das ações da aplicação |
| RNF-OP-08 | Confirmar visualmente o resultado de cada operação concluída com sucesso. | Importante | Revisão das ações da aplicação |
| RNF-OP-09 | Empregar em toda a interface a terminologia do [Glossário](../glossario.md), sem exibir ao agente os valores em inglês usados pela API. | Essencial | Revisão das telas |

## 3. Segurança

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-OP-10 | Não servir ao público o código deste portal: a aplicação é interna e o seu acesso é restrito a agentes autenticados ([decisão de separação dos frontends](../arquitetura.md#por-que-dois-frontends-separados)). | Essencial | Inspeção da configuração de publicação |
| RNF-OP-11 | Bloquear no cliente todas as rotas exceto `/login` enquanto não houver sessão válida, sem exibir dados de ocorrências antes da autenticação. | Essencial | Teste de acesso direto a `/ocorrencias` sem sessão |
| RNF-OP-12 | Não gravar o token JWT em local acessível a script de terceiros nem em `localStorage` quando houver alternativa mais segura (cookie `httpOnly`); a escolha adotada deve estar registrada no código. | Importante | Revisão de código do módulo de autenticação |
| RNF-OP-13 | Descartar o token e todos os dados em memória ao encerrar a sessão ou ao receber `401` da API. | Essencial | Teste de logout e de token expirado |
| RNF-OP-14 | Tratar as restrições de interface por perfil como conveniência: **toda** autorização é verificada pela API — inclusive a restrição do agente à ocorrência que lhe foi atribuída —, e ocultar um controle nunca é a única proteção de uma operação. | Essencial | Revisão de código; chamada direta à API com perfil `AGENT`, em rota restrita e em ocorrência de outro responsável |
| RNF-OP-15 | Manter no portal apenas variáveis de ambiente públicas (`NEXT_PUBLIC_*`), sem segredo, chave ou credencial no código entregue ao navegador. | Essencial | Busca por segredos no código e no pacote gerado |
| RNF-OP-16 | Não registrar em log do navegador nem em ferramenta de terceiros o token JWT, senhas ou dados pessoais do cidadão. | Essencial | Inspeção do console durante o uso |
| RNF-OP-17 | Escapar todo conteúdo devolvido pela API — em especial a descrição escrita pelo cidadão — antes de exibi-lo, sem inserção de HTML não tratado. | Essencial | Revisão de código e busca por `dangerouslySetInnerHTML` |
| RNF-OP-18 | Exibir os anexos sempre pela URL servida pela API, sem acessar disco ou bucket diretamente. | Essencial | Revisão de código |

## 4. Desempenho

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-OP-19 | Exibir a lista de ocorrências filtrada em até **2 s** no ambiente local, considerando o tempo de resposta da API. | Importante | Medição com as ferramentas de desenvolvimento do navegador |
| RNF-OP-20 | Buscar apenas a página corrente da lista, delegando a paginação e a filtragem à API, sem carregar a base completa no navegador. O mapa e a exportação em CSV usam as rotas dedicadas (`GET /reports/map` e `GET /reports/export`), nunca a varredura de páginas sucessivas de `GET /reports`. | Essencial | Inspeção das requisições realizadas |
| RNF-OP-21 | Aplicar atraso (*debounce*) na busca por texto, evitando uma requisição por caractere digitado. | Importante | Inspeção das requisições durante a digitação |
| RNF-OP-22 | Carregar o componente de mapa apenas na rota em que ele é utilizado, mantendo-o fora do pacote inicial (`dynamic(..., { ssr: false })`). | Essencial | Inspeção do código e do carregamento de recursos |
| RNF-OP-23 | Manter o mapa fluido com até **200 pontos** exibidos simultaneamente, carregados em uma única chamada a `GET /reports/map` (rota sem paginação, à qual o teto de `pageSize` não se aplica). | Importante | Teste com base de demonstração equivalente |
| RNF-OP-24 | Exibir miniaturas dos anexos na lista de fotos, carregando a imagem em tamanho integral apenas na ampliação. | Desejável | Inspeção das requisições de imagem |

## 5. Confiabilidade

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-OP-25 | Tratar falha e indisponibilidade da API com mensagem compreensível, sem tela de erro técnico nem página em branco. | Essencial | Teste com a API desligada |
| RNF-OP-26 | Permanecer utilizável quando o mapa ou os tiles do OpenStreetMap não carregarem, mantendo o acesso à lista e ao detalhe das ocorrências. | Essencial | Teste com o domínio dos tiles bloqueado |
| RNF-OP-27 | Definir tempo limite (*timeout*) nas requisições à API, com mensagem clara e possibilidade de nova tentativa. | Importante | Teste com resposta retida da API |
| RNF-OP-28 | Bloquear o controle acionado durante a requisição, evitando o registro duplicado de andamento por duplo acionamento. | Importante | Teste com acionamentos sucessivos |
| RNF-OP-29 | Refletir na tela, após cada operação aceita, o estado efetivamente devolvido pela API, sem presumir o resultado localmente. | Essencial | Revisão de código das ações de atendimento |

## 6. Acessibilidade

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-OP-30 | Atender ao contraste mínimo de **4,5:1** entre texto e fundo, conforme WCAG 2.1 nível AA, inclusive nas cores de situação e prioridade. | Essencial | Verificação com ferramenta de contraste |
| RNF-OP-31 | Não transmitir informação exclusivamente por cor — situação, prioridade e legenda do mapa sempre acompanhadas de texto. | Essencial | Revisão das telas e da legenda do mapa |
| RNF-OP-32 | Permitir a operação dos fluxos principais (login, filtrar, abrir detalhe, registrar andamento) **apenas pelo teclado**, com foco visível. | Essencial | Percurso completo com Tab e Enter |
| RNF-OP-33 | Associar todo campo de formulário ao seu rótulo e fornecer rótulo acessível aos botões representados apenas por ícone. | Essencial | Inspeção do HTML gerado |
| RNF-OP-34 | Estruturar a lista de ocorrências como tabela semântica, com cabeçalhos associados às colunas. | Importante | Inspeção do HTML gerado |
| RNF-OP-35 | Anunciar a leitores de tela as mensagens de erro e de confirmação das operações (regiões `aria-live`). | Importante | Teste com leitor de tela |

## 7. Rastreabilidade e auditoria

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-OP-36 | Exibir no histórico de cada ocorrência o autor e a data de toda mudança de situação, de modo que a ação de cada agente seja rastreável na interface. | Essencial | Revisão da tela de detalhe |
| RNF-OP-37 | Distinguir claramente no histórico os andamentos internos dos visíveis ao cidadão. | Essencial | Revisão da tela de detalhe |
| RNF-OP-38 | Não oferecer nenhuma ação de edição ou exclusão de andamento já registrado. | Essencial | Revisão das ações disponíveis na tela de detalhe |

## 8. Responsividade e compatibilidade

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-OP-39 | Projetar a interface para uso em desktop a partir de **1280 px**, mantendo-a utilizável em tablet (**768 px**) para consulta em campo. | Importante | Inspeção nas duas larguras |
| RNF-OP-40 | Adaptar a lista de ocorrências em telas estreitas sem rolagem horizontal, priorizando protocolo, tipo, situação e prioridade. | Importante | Inspeção em 768 px |
| RNF-OP-41 | Funcionar nas versões atuais de Chrome, Firefox e Edge em desktop. | Importante | Teste manual nos navegadores |

## 9. Manutenibilidade e portabilidade

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-OP-42 | Concentrar o uso do Leaflet no componente `<ReportMap>` (`components/map/`), com props no formato `{ latitude, longitude }` e **sem tipos da biblioteca** na sua interface pública, de modo que a troca por Google Maps não afete as telas ([decisão 08](../arquitetura.md#mapas-decisão-08)). | Essencial | Busca por `leaflet`/`react-leaflet` fora de `components/map` |
| RNF-OP-43 | Organizar o código conforme a estrutura prevista: `app/` (rotas), `components/`, `features/` (`reports`, `agents`, `dashboard`), `lib/` e `types/`. | Essencial | Inspeção da árvore de pastas |
| RNF-OP-44 | Concentrar o acesso HTTP e o envio do token em um único cliente em `lib/`, sem chamadas `fetch` dispersas pelas telas. | Essencial | Revisão de código |
| RNF-OP-45 | Não manter no código lista fixa nem mapa de tradução de tipos de ocorrência, situações, categorias, prioridades ou perfis: todos são obtidos de `GET /metadata` e `GET /metadata/internal`. | Essencial | Busca por valores das enumerações (`FLOODING`, `RECEIVED`, `HIGH`, `COORDINATOR`, …) no código do portal — só podem aparecer em `types/` |
| RNF-OP-46 | Manter em `types/` os tipos correspondentes aos contratos da API, em um único lugar por entidade. | Importante | Inspeção da pasta `types/` |
| RNF-OP-47 | Escrever todo o código em TypeScript com modo estrito, sem erros de tipo e sem apontamentos do ESLint configurado. | Essencial | Execução de `tsc --noEmit` e do script de lint |
| RNF-OP-48 | Manter o `.env.example` atualizado com as variáveis utilizadas. | Importante | Comparação entre `.env.example` e o uso no código |
| RNF-OP-49 | Fixar a porta `3001` nos scripts `dev` e `start`, de modo que `npm run dev` funcione sem argumentos adicionais e não dispute a porta com o Portal do Cidadão. | Essencial | Inspeção do `package.json` |

## 10. Restrições tecnológicas

| ID | Restrição | Origem |
|---|---|---|
| RNF-OP-50 | **Next.js 16** (React 19, TypeScript, Tailwind 4) sobre Node.js 20+. | [Decisão 03](../arquitetura.md#5-decisões-técnicas-registradas) |
| RNF-OP-51 | Autenticação por **JWT** obtida da API, com controle de acesso pelos perfis `ADMIN`, `COORDINATOR` e `AGENT`. | [Decisão 06](../arquitetura.md#5-decisões-técnicas-registradas) |
| RNF-OP-52 | Mapas com **Leaflet** e tiles do **OpenStreetMap**, sem chave de API. | [Decisão 08](../arquitetura.md#mapas-decisão-08) |
| RNF-OP-53 | Aplicação sem persistência própria: todo dado vem da API do SISDEC. | [Arquitetura](../arquitetura.md#1-visão-geral) |
| RNF-OP-54 | Aplicação separada do Portal do Cidadão, com evolução e publicação independentes. | [Arquitetura](../arquitetura.md#por-que-dois-frontends-separados) |
| RNF-OP-55 | Execução em `localhost:3001` nesta etapa. | [Decisão 10](../arquitetura.md#5-decisões-técnicas-registradas) |
| RNF-OP-56 | Toda a interface em **pt-BR**; identificadores de código em inglês. | [Convenções da documentação](../README.md#3-convenções-da-documentação) |
