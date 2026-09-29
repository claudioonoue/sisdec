# Requisitos Não Funcionais — Portal do Cidadão

Aplicação: **Portal do Cidadão** — `core/frontend-citizen` (Next.js + Leaflet), porta `3002`.

Documentos relacionados: [Visão geral](README.md) · [Arquitetura](../arquitetura.md) ·
[Requisitos funcionais](requisitos-funcionais.md)

---

## 1. Convenções

- **Identificador**: `RNF-CID-nn`, único e permanente.
- **Prioridade**: **Essencial**, **Importante** ou **Desejável**.
- **Verificação**: como o atendimento ao requisito é comprovado.
- O contexto de uso orienta todos os requisitos deste documento: o cidadão acessa o portal
  **pelo celular**, possivelmente **no local da ocorrência**, sob chuva, com pressa e com
  conexão instável.

---

## 2. Usabilidade

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-CID-01 | Permitir concluir o registro de uma ocorrência em **até 5 etapas**, sem cadastro e sem etapas obrigatórias além das previstas. | Essencial | Contagem das etapas no fluxo implementado |
| RNF-CID-02 | Permitir que uma pessoa sem familiaridade com o sistema conclua um registro **em até 3 minutos**, sem ajuda externa. | Importante | Teste de usabilidade com pessoas que não participaram do desenvolvimento |
| RNF-CID-03 | Rotular todos os campos com linguagem simples, sem jargão técnico ou administrativo, e sem exibir os valores em inglês usados pela API. | Essencial | Revisão das telas |
| RNF-CID-04 | Sinalizar claramente quais campos são obrigatórios e quais são opcionais, em especial os dados de identificação. | Essencial | Revisão das telas |
| RNF-CID-05 | Apresentar mensagens de erro junto ao campo correspondente, explicando o que corrigir, em pt-BR e sem código técnico. | Essencial | Teste com formulário incompleto e inválido |
| RNF-CID-06 | Preservar os dados já digitados em caso de erro de envio, erro de validação ou retorno a uma etapa anterior. | Essencial | Teste de envio com a API indisponível |
| RNF-CID-07 | Dimensionar os elementos de toque (botões e campos) com área mínima de **44 × 44 px**, adequada ao uso com o dedo. | Importante | Inspeção das telas em largura de celular |
| RNF-CID-08 | Dispensar o uso de rolagem horizontal em qualquer tela, em qualquer largura suportada. | Essencial | Inspeção em 320 px, 768 px e 1280 px |
| RNF-CID-09 | Manter o número de protocolo como elemento de maior destaque visual da tela de confirmação. | Essencial | Revisão da tela de confirmação |

## 3. Responsividade e compatibilidade

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-CID-10 | Projetar a interface em abordagem **mobile first**, com layout adequado a partir de **320 px** de largura e adaptado a tablet e desktop. | Essencial | Inspeção nas três larguras de referência |
| RNF-CID-11 | Funcionar nas versões atuais de Chrome, Firefox, Safari e Edge, em desktop e em dispositivos móveis. | Importante | Teste manual nos navegadores |
| RNF-CID-12 | Manter o formulário funcional em telas de celular sem que o teclado virtual oculte o campo em foco. | Importante | Teste em dispositivo móvel real ou emulado |
| RNF-CID-13 | Exibir as fotos anexadas redimensionadas para visualização prévia, sem estourar o layout independentemente da orientação da imagem. | Importante | Teste com imagens em retrato e paisagem |

## 4. Acessibilidade

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-CID-14 | Atender ao contraste mínimo de **4,5:1** entre texto e fundo, conforme WCAG 2.1 nível AA. | Essencial | Verificação com ferramenta de contraste |
| RNF-CID-15 | Permitir a navegação e a conclusão de todo o registro **apenas pelo teclado**, com ordem de foco coerente e foco visível. | Essencial | Percurso completo do formulário com Tab e Enter |
| RNF-CID-16 | Associar todo campo de formulário ao seu rótulo (`label`/`for`), permitindo a leitura correta por leitores de tela. | Essencial | Inspeção do HTML gerado |
| RNF-CID-17 | Fornecer texto alternativo em todas as imagens de conteúdo e rótulo acessível em todos os botões representados apenas por ícone. | Essencial | Inspeção do HTML gerado |
| RNF-CID-18 | Anunciar a leitores de tela as mudanças de etapa do formulário e as mensagens de erro e de sucesso (regiões `aria-live`). | Importante | Teste com leitor de tela |
| RNF-CID-19 | Não transmitir informação exclusivamente por cor — situação e prioridade sempre acompanhadas de texto. | Essencial | Revisão das telas |
| RNF-CID-20 | Usar marcação semântica (cabeçalhos hierárquicos, listas, `main`, `nav`) em todas as páginas. | Importante | Inspeção do HTML gerado |

## 5. Desempenho

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-CID-21 | Exibir a página inicial em até **3 s** em conexão móvel de qualidade média (referência: 3G rápido simulado). | Importante | Medição com as ferramentas de desenvolvimento do navegador |
| RNF-CID-22 | Carregar o componente de mapa apenas na etapa em que ele é utilizado, mantendo-o fora do pacote inicial (`dynamic(..., { ssr: false })`). | Essencial | Inspeção do código e do carregamento de recursos |
| RNF-CID-23 | Comprimir ou redimensionar as fotos no navegador antes do envio, reduzindo o tempo de upload em conexão móvel. | Desejável | Comparação entre o tamanho do arquivo original e o enviado |
| RNF-CID-24 | Responder imediatamente a cada acionamento do usuário com indicação visual de carregamento, sem deixar a interface aparentemente parada. | Essencial | Teste com latência de rede simulada |
| RNF-CID-25 | Manter o pacote JavaScript inicial em até **300 KB** comprimido. | Desejável | Análise do relatório de build do Next.js |

## 6. Confiabilidade

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-CID-26 | Permanecer utilizável quando o mapa ou os tiles do OpenStreetMap não carregarem, mantendo o registro possível apenas com o endereço digitado. | Essencial | Teste com o domínio dos tiles bloqueado |
| RNF-CID-27 | Tratar falha e indisponibilidade da API com mensagem compreensível ao cidadão, sem tela de erro técnico nem página em branco. | Essencial | Teste com a API desligada |
| RNF-CID-28 | Evitar o registro duplicado por duplo acionamento do botão de envio, bloqueando o controle durante a requisição. | Importante | Teste com acionamentos sucessivos |
| RNF-CID-29 | Definir tempo limite (*timeout*) nas requisições à API, com mensagem clara e possibilidade de nova tentativa. | Importante | Teste com resposta retida da API |

## 7. Segurança e privacidade

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-CID-30 | Não armazenar dados pessoais do cidadão em `localStorage`, `sessionStorage` ou cookies após a conclusão do registro. | Essencial | Inspeção do armazenamento do navegador ao final do fluxo |
| RNF-CID-31 | Não exibir dados pessoais de qualquer cidadão na consulta por protocolo, ainda que a API os devolvesse. | Essencial | Revisão da tela de acompanhamento |
| RNF-CID-32 | Manter no portal apenas variáveis de ambiente públicas (`NEXT_PUBLIC_*`), sem qualquer segredo, chave ou credencial no código entregue ao navegador. | Essencial | Busca por segredos no código e no pacote gerado |
| RNF-CID-33 | Solicitar a geolocalização do dispositivo somente por ação explícita do cidadão, nunca automaticamente ao abrir a página. | Essencial | Teste de abertura da etapa do mapa |
| RNF-CID-34 | Informar, na coleta dos dados de contato, a finalidade do uso e o caráter opcional do fornecimento. | Importante | Revisão da etapa 4 do formulário |
| RNF-CID-35 | Escapar todo conteúdo devolvido pela API antes de exibi-lo, sem inserção de HTML não tratado na página. | Essencial | Revisão de código e busca por `dangerouslySetInnerHTML` |

## 8. Manutenibilidade e portabilidade

| ID | Requisito | Prioridade | Verificação |
|---|---|---|---|
| RNF-CID-36 | Concentrar o uso do Leaflet no componente `<LocationPicker>` (`components/map/`), com props no formato `{ latitude, longitude }` e **sem tipos da biblioteca** na sua interface pública, de modo que a troca por Google Maps não afete as telas ([decisão 08](../arquitetura.md#mapas-decisão-08)). | Essencial | Busca por `leaflet`/`react-leaflet` fora de `components/map` |
| RNF-CID-37 | Organizar o código conforme a estrutura prevista: `app/` (rotas), `components/`, `features/` (`report-form`, `report-tracking`), `lib/` e `types/`. | Essencial | Inspeção da árvore de pastas |
| RNF-CID-38 | Concentrar o acesso HTTP em um único cliente em `lib/`, sem chamadas `fetch` dispersas pelas telas. | Importante | Revisão de código |
| RNF-CID-39 | Não manter no código lista fixa nem mapa de tradução de tipos de ocorrência, situações ou categorias: todos são obtidos de `GET /metadata`. | Essencial | Busca por valores das enumerações (`FLOODING`, `RECEIVED`, `COMPLAINT`, …) no código do portal — só podem aparecer em `types/` |
| RNF-CID-40 | Escrever todo o código em TypeScript com modo estrito, sem erros de tipo e sem apontamentos do ESLint configurado. | Essencial | Execução de `tsc --noEmit` e do script de lint |
| RNF-CID-41 | Manter o `.env.example` atualizado com as variáveis utilizadas. | Importante | Comparação entre `.env.example` e o uso no código |
| RNF-CID-42 | Fixar a porta `3002` nos scripts `dev` e `start`, de modo que `npm run dev` funcione sem argumentos adicionais. | Essencial | Inspeção do `package.json` |

## 9. Restrições tecnológicas

| ID | Restrição | Origem |
|---|---|---|
| RNF-CID-43 | **Next.js 16** (React 19, TypeScript, Tailwind 4) sobre Node.js 20+. | [Decisão 03](../arquitetura.md#5-decisões-técnicas-registradas) |
| RNF-CID-44 | Mapas com **Leaflet** e tiles do **OpenStreetMap**, sem chave de API. | [Decisão 08](../arquitetura.md#mapas-decisão-08) |
| RNF-CID-45 | Acesso público, sem autenticação e sem cadastro obrigatório. | [Decisão 05](../arquitetura.md#5-decisões-técnicas-registradas) |
| RNF-CID-46 | Aplicação sem persistência própria: todo dado vem da API do SISDEC. | [Arquitetura](../arquitetura.md#1-visão-geral) |
| RNF-CID-47 | Execução em `localhost:3002` nesta etapa. | [Decisão 10](../arquitetura.md#5-decisões-técnicas-registradas) |
| RNF-CID-48 | Toda a interface em **pt-BR**; identificadores de código em inglês. | [Convenções da documentação](../README.md#3-convenções-da-documentação) |
