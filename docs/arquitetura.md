# Arquitetura

## 1. Visão geral

O SISDEC adota uma arquitetura **cliente-servidor com API central**. As duas interfaces
web são independentes entre si e consomem a mesma API REST.

```
┌──────────────────────┐        ┌──────────────────────────┐
│  Portal do Cidadão   │        │   Portal de Operações    │
│  Next.js (público)   │        │   Next.js (restrito)     │
└──────────┬───────────┘        └────────────┬─────────────┘
           │            HTTPS / JSON         │
           └───────────────┬─────────────────┘
                           ▼
                 ┌───────────────────┐
                 │   API — NestJS    │
                 │  (REST + JWT)     │
                 └─────────┬─────────┘
                           │ Prisma ORM
                           ▼
                 ┌───────────────────┐
                 │    PostgreSQL     │
                 └───────────────────┘
```

### Por que dois frontends separados?

- **Públicos e requisitos diferentes**: o portal do cidadão precisa ser simples, acessível
  e utilizável sem cadastro; o portal de operações concentra funcionalidades administrativas
  e exige autenticação.
- **Segurança**: o código do portal interno não é servido ao público.
- **Evolução independente**: cada portal pode ser alterado e publicado separadamente.

---

## 2. Tecnologias

| Camada | Tecnologia | Motivo |
|---|---|---|
| API | Node.js + **NestJS 12** (TypeScript, ESM) | Estrutura modular, injeção de dependências e organização clara em módulos/serviços/controladores |
| Banco de dados | **PostgreSQL 17** | Relacional, maduro e com suporte a dados geográficos (PostGIS) caso o mapa evolua |
| ORM | **Prisma 7** | Schema declarativo, tipagem gerada automaticamente e migrações versionadas |
| Frontends | Node.js + **Next.js 16** (React 19, TypeScript, Tailwind 4) | Renderização no servidor, roteamento por arquivos e boa performance em dispositivos móveis |
| Autenticação | **JWT** | Simples de implementar e adequado ao acesso dos agentes |
| Mapas | **Leaflet** + OpenStreetMap | Biblioteca livre, sem chave de API nem cobrança, suficiente para exibir e selecionar pontos |
| Anexos | **Disco local** via `StorageService` | Evita dependência de nuvem no trabalho, mantendo a troca por S3 viável |

---

## 3. Organização do repositório

Monorepo com **projetos independentes**: não há workspaces nem orquestração na raiz.
Cada aplicação em `core/` é instalada e executada isoladamente.

```
core/
├── backend/               npm install && npm run start:dev     :3000
├── frontend-operations/   npm install && npm run dev           :3001
└── frontend-citizen/      npm install && npm run dev           :3002
```

As portas ficam fixadas nos próprios scripts `dev`/`start` de cada projeto, para que
`npm run dev` funcione sem argumentos extras e dois portais nunca disputem a mesma porta.

**Vantagem**: histórico único, documentação e código no mesmo lugar, sem acoplamento de
build entre os projetos.
**Custo**: cada projeto tem o seu próprio `node_modules` e os comandos precisam ser
executados dentro da respectiva pasta.

> O `Makefile` da raiz atenua esse custo **sem** desfazer a decisão: ele entra na pasta certa
> e chama o comando que já existe ali. Não instala, não compila e não resolve dependências —
> apagá-lo não impede nenhum projeto de ser instalado ou executado. É um Makefile, e não um
> `package.json` na raiz, justamente para não criar um quarto projeto Node com `node_modules`
> próprio, que seria o acoplamento que esta decisão evita.

---

## 4. Portas de desenvolvimento

| Aplicação | Porta | URL local |
|---|---|---|
| Backend (API) | 3000 | http://localhost:3000 |
| Portal de Operações | 3001 | http://localhost:3001 |
| Portal do Cidadão | 3002 | http://localhost:3002 |

---

## 5. Decisões técnicas registradas

| # | Decisão | Situação |
|---|---|---|
| 01 | Monorepo com projetos independentes (sem workspaces) | Definida |
| 02 | NestJS para a API | Definida |
| 03 | Next.js para os dois portais | Definida |
| 04 | PostgreSQL + Prisma para persistência | Definida |
| 05 | Registro de ocorrência pelo cidadão **sem cadastro obrigatório**, com acompanhamento por protocolo | Definida |
| 06 | Autenticação por JWT apenas para agentes | Definida |
| 07 | Anexos gravados **em disco local**, atrás de uma interface `StorageService` que permite trocar por S3 sem alterar as regras de negócio | Definida |
| 08 | **Leaflet** com tiles do OpenStreetMap para os mapas, isolado em componentes próprios para permitir a troca por Google Maps | Definida |
| 09 | Sem notificação ativa nesta versão — o acompanhamento é feito **apenas pela consulta por protocolo** | Definida |
| 10 | **Execução local** (`localhost`) nesta etapa, com o PostgreSQL em contêiner Docker; publicação na internet fica para uma etapa futura | Definida |
| 11 | Triagem em **duas etapas** (assumir e concluir), com `TRIAGE` como estado real e a improcedência como saída da triagem — e não do endpoint de situação | Definida |
| 12 | Enumerações, rótulos em pt-BR e limites de upload servidos pela API em `GET /metadata` (público) e `GET /metadata/internal` (autenticado); os portais **não** mantêm listas nem mapas de tradução fixos | Definida |
| 13 | Rotas dedicadas **sem paginação** para o mapa (`GET /reports/map`, teto de 500) e para a exportação (`GET /reports/export`), em vez de varrer páginas de `GET /reports` | Definida |
| 14 | Agente de perfil `AGENT` altera a situação **apenas** da ocorrência que lhe foi atribuída; anexos do cidadão são aceitos somente enquanto a ocorrência está em `RECEIVED` | Definida |
| 15 | O token JWT do Portal de Operações fica em **cookie `httpOnly`** e o portal fala com a API **pelo servidor do Next** — nunca pelo navegador ([detalhe](#7-sessão-do-portal-de-operações-decisão-15)) | Definida |
| 16 | As transições de situação disponíveis são **calculadas pela API** e devolvidas no detalhe da ocorrência; o portal não mantém cópia do ciclo de vida ([detalhe](#8-transições-oferecidas-pela-api-decisão-16)) | Definida |

---

## 6. Pontos de troca previstos

Três decisões acima foram tomadas escolhendo a opção mais simples **agora**, mas de forma
que a alternativa continue viável depois. Para que isso não seja apenas uma intenção, o
código precisa respeitar os seguintes limites:

### Armazenamento de anexos (decisão 07)

O módulo `attachments` do backend expõe uma interface e uma implementação local:

```ts
interface StorageService {
  save(content: Buffer, extension: string): Promise<{ storedPath: string }>;
  createReadStream(storedPath: string): Promise<Readable>;
  remove(storedPath: string): Promise<void>;
}
```

> A interface esboçada inicialmente recebia o `Express.Multer.File` e devolvia um `Buffer` na
> leitura. Ambos mudaram na implementação (etapa B4): o `Buffer` contrariava o
> [RNF-API-06](backend/requisitos-nao-funcionais.md), que exige servir o anexo em fluxo, e
> receber o objeto do multer amarraria a interface ao framework HTTP, atrapalhando justamente
> a troca por S3 que ela existe para permitir. A montagem da URL saiu da interface: ela não
> depende do armazenamento, e vive em `attachments/attachment-url.ts`.

- `LocalStorageService` grava em `UPLOAD_DIR` e é a implementação usada no trabalho;
- `remove()` faz parte da interface para que a troca por S3 não exija alterá-la, mas
  **nenhum endpoint desta versão o utiliza**: não há exclusão de anexo no escopo atual;
- uma futura `S3StorageService` implementa a mesma interface;
- a escolha é feita **uma única vez**, no provider do `AttachmentsModule`, a partir da
  variável `STORAGE_DRIVER`;
- **regra**: nenhum service fora de `attachments` pode conhecer caminho de arquivo, `fs`
  ou SDK da AWS. O resto do sistema enxerga apenas `storedPath` e a URL devolvida pela API.

### Mapas (decisão 08)

- Leaflet fica encapsulado em dois componentes: `<ReportMap>` (vários pontos, no Portal de
  Operações) e `<LocationPicker>` (escolher um ponto, no Portal do Cidadão);
- nenhuma outra parte da interface importa `leaflet` ou `react-leaflet` diretamente;
- as props desses componentes trabalham com `{ latitude, longitude }`, sem tipos da
  biblioteca — trocar por Google Maps significa reescrever os dois componentes por dentro,
  sem tocar nas telas.

### Notificação ao cidadão (decisão 09)

- o campo `visibleToCitizen` de `ReportUpdate` já define o que seria enviado;
- o e-mail do cidadão já é coletado (opcionalmente) e armazenado;
- **regra**: a mudança de situação passa por um único ponto no service de ocorrências, que
  é onde um envio de e-mail seria acrescentado depois — sem espalhar essa lógica pelos
  controladores.

---

## 7. Sessão do Portal de Operações (decisão 15)

O [RNF-OP-12](frontend-operations/requisitos-nao-funcionais.md) pede que o token não fique
em `localStorage` **havendo alternativa mais segura**, e que a escolha esteja registrada no
código. A alternativa adotada é o cookie `httpOnly`, e ela tem uma consequência que decide a
arquitetura do portal inteiro: **um cookie `httpOnly` não pode ser lido pelo JavaScript da
página**, então não é o navegador que monta o cabeçalho `Authorization`.

Daí a forma do portal:

- o token é gravado pelo servidor do Next, em cookie `httpOnly` + `SameSite=Lax`;
- as telas são *Server Components* e as operações de escrita são *Server Actions*: toda
  chamada à API parte do servidor, que lê o cookie e monta o cabeçalho;
- `lib/api-client.ts` é o **único** ponto que chama `fetch` contra a API (`RNF-OP-44`), e
  como ele importa a leitura do cookie, nenhum componente de navegador consegue importá-lo
  — a fronteira é verificada pelo próprio empacotador, não por disciplina;
- `src/proxy.ts` (o antigo `middleware`) barra as rotas sem cookie antes de qualquer
  renderização, e a **validade** do token é conferida pela API a cada requisição, em
  `GET /auth/me`. Desativar um agente na API derruba a sessão dele no portal na hora, sem
  esperar a expiração do JWT.

O Portal do Cidadão não é afetado: ele não autentica ninguém.

> Consequência a ter em vista nas etapas seguintes: um componente interativo (filtro,
> formulário de triagem, legenda do mapa) não pode chamar a API diretamente. Ele aciona uma
> Server Action ou muda a URL, e o servidor refaz a busca. É também o que sustenta o
> `RNF-OP-20` — a paginação e a filtragem ficam na API, não no navegador.

---

## 8. Transições oferecidas pela API (decisão 16)

O [RF-OP-30](frontend-operations/requisitos-funcionais.md) exige que o detalhe ofereça
**apenas** as ações compatíveis com a situação da ocorrência e com o perfil de quem olha.
Decidir isso tem quatro entradas: a aresta existe na
[tabela de transições](backend/modelo-de-dados.md#4-ciclo-de-vida-da-ocorrência); o perfil
consta entre os autorizados; se o perfil é `AGENT`, ele é o responsável; e a transição exige
comentário.

As quatro viviam só na API. As opções eram o portal manter uma cópia da tabela, ou a API
passar a dizer. **Escolhemos a segunda**, e `GET /reports/:id` devolve `availableTransitions`
(`RF-API-72`), já resolvida para quem pediu.

Três razões:

- **esta tabela já divergiu aqui.** Foi a verificação cruzada que encontrou a situação
  `TRIAGE` inalcançável, porque o ciclo de vida documentado e o contrato discordavam — o achado
  que gerou a [decisão 11](#5-decisões-técnicas-registradas). Duas cópias vivas divergiriam de
  novo, e a segunda seria descoberta por um agente diante de um botão que responde `403`;
- **a [decisão 12](#5-decisões-técnicas-registradas) já fixara o princípio** um nível abaixo:
  os portais não guardam listas nem mapas de tradução das enumerações, eles perguntam. O ciclo
  de vida é o mesmo caso, com mais consequência;
- **copiar a tabela seria copiar junto uma regra de autorização** — a do responsável. O
  `RNF-OP-14` diz que restrição de tela é conveniência e nunca proteção, e isso continua
  valendo; o que se evita é a conveniência **discordar** da proteção em silêncio.

Na API, a conferência de perfil e a do responsável viraram predicados nomeados, usados tanto
pela listagem quanto pela execução — uma implementação, não duas que podem discordar. Um teste
unitário afirma que elas concordam em toda combinação de situação, perfil e atribuição, e um
teste e2e afirma a propriedade da qual o portal depende: **o que é oferecido é aceito, e o que
não é oferecido é recusado**.

Duas ações de atendimento **não** são transição de situação e continuam decididas no portal:
atribuir responsável (coordenação) e registrar andamento (todos). São uma linha cada, fixadas
pelo contrato de cada rota, e sem histórico de divergência.

---

## 9. Requisitos funcionais e não funcionais

Os requisitos abaixo valem para o sistema como um todo. O detalhamento — com identificador,
prioridade e forma de verificação — está nos documentos de cada aplicação:

| Aplicação | Funcionais | Não funcionais |
|---|---|---|
| Backend (API) | [RF-API](backend/requisitos-funcionais.md) | [RNF-API](backend/requisitos-nao-funcionais.md) |
| Portal de Operações | [RF-OP](frontend-operations/requisitos-funcionais.md) | [RNF-OP](frontend-operations/requisitos-nao-funcionais.md) |
| Portal do Cidadão | [RF-CID](frontend-citizen/requisitos-funcionais.md) | [RNF-CID](frontend-citizen/requisitos-nao-funcionais.md) |

- **Responsividade**: o portal do cidadão será usado majoritariamente por celular.
- **Acessibilidade**: contraste adequado, navegação por teclado e textos alternativos.
- **Rastreabilidade**: toda mudança de situação de uma ocorrência é registrada em histórico,
  com autor e data.
- **Privacidade**: dados pessoais do cidadão não são exibidos publicamente; a consulta por
  protocolo mostra apenas a situação e o histórico da ocorrência.
