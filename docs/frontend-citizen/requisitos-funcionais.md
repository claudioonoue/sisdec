# Requisitos Funcionais — Portal do Cidadão

Aplicação: **Portal do Cidadão** — `core/frontend-citizen` (Next.js + Leaflet), porta `3002`.
Acesso público, **sem cadastro obrigatório**.

Documentos relacionados: [Visão geral](README.md) · [API REST](../backend/api.md) ·
[Arquitetura](../arquitetura.md) · [Requisitos não funcionais](requisitos-nao-funcionais.md)

---

## 1. Convenções

- **Identificador**: `RF-CID-nn`, único e permanente.
- **Prioridade**: **Essencial**, **Importante** ou **Desejável**.
- **Ator**: *Cidadão* (qualquer pessoa, sem autenticação) ou *Sistema* (comportamento
  automático da aplicação).
- Toda operação sobre dados é feita por chamada à API (`NEXT_PUBLIC_API_URL`); o portal não
  possui banco de dados nem regra de negócio própria.

---

## 2. Página inicial e orientação

| ID | Requisito | Ator | Prioridade |
|---|---|---|---|
| RF-CID-01 | Apresentar, na rota `/`, a explicação do serviço e dois caminhos claros e destacados: **registrar ocorrência** e **acompanhar ocorrência**. | Cidadão | Essencial |
| RF-CID-02 | Exibir na página inicial e na página de registro um aviso destacado de que, **em emergências, o cidadão deve ligar 199 (Defesa Civil) ou 193 (Bombeiros)**, e que o sistema não substitui o atendimento emergencial. | Sistema | Essencial |
| RF-CID-03 | Disponibilizar a página `/orientacoes`, com instruções sobre o que fazer em situações de risco e a relação dos telefones de emergência. | Cidadão | Importante |
| RF-CID-04 | Tornar a página de orientações acessível a partir de qualquer tela do portal. | Cidadão | Importante |

## 3. Registro de ocorrência

| ID | Requisito | Ator | Prioridade |
|---|---|---|---|
| RF-CID-05 | Conduzir o registro em `/registrar` por meio de um formulário em **cinco etapas**: (1) o que aconteceu, (2) onde, (3) detalhes, (4) seus dados, (5) revisão. | Cidadão | Essencial |
| RF-CID-06 | Indicar visualmente a etapa atual e o total de etapas, permitindo voltar a uma etapa anterior sem perder o que já foi preenchido. | Cidadão | Essencial |
| RF-CID-07 | Solicitar, na etapa 1, a **categoria** da ocorrência (reclamação, sugestão, solicitação ou comunicação de risco) e o **tipo** de ocorrência. | Cidadão | Essencial |
| RF-CID-08 | Obter a lista de tipos de ocorrência de `GET /metadata` (`reportTypes`), exibindo o rótulo em pt-BR, **sem manter a lista fixa no código** do portal. | Sistema | Essencial |
| RF-CID-09 | Reforçar o aviso de acionamento dos telefones de emergência quando o cidadão selecionar um tipo marcado como `urgent`. | Sistema | Essencial |
| RF-CID-10 | Solicitar, na etapa 2, o **endereço** e o **bairro** da ocorrência como campos obrigatórios. | Cidadão | Essencial |
| RF-CID-11 | Permitir, na etapa 2, ajustar o ponto exato da ocorrência no mapa pelo componente `<LocationPicker>`, devolvendo `latitude` e `longitude`. | Cidadão | Essencial |
| RF-CID-12 | Oferecer o preenchimento automático do ponto no mapa a partir da localização do dispositivo, **mediante autorização explícita** do cidadão. | Cidadão | Importante |
| RF-CID-13 | Manter o formulário utilizável quando o mapa não carregar ou a geolocalização for negada — o endereço digitado é o dado obrigatório e o ponto no mapa é complementar. | Sistema | Essencial |
| RF-CID-14 | Solicitar, na etapa 3, a **descrição** do ocorrido em campo de texto livre obrigatório. | Cidadão | Essencial |
| RF-CID-15 | Permitir, na etapa 3, anexar **até 5 fotos** opcionais, com visualização prévia e opção de remover cada uma antes do envio. | Cidadão | Essencial |
| RF-CID-16 | Recusar no próprio navegador arquivos fora dos formatos aceitos ou acima do tamanho máximo, informando o motivo — usando os limites do bloco `upload` de `GET /metadata`, sem replicar essas constantes no código. | Sistema | Importante |
| RF-CID-17 | Solicitar, na etapa 4, **nome**, **e-mail** e **telefone** como campos **opcionais**, com a opção explícita **"prefiro não me identificar"**. | Cidadão | Essencial |
| RF-CID-18 | Informar, na etapa 4, que os dados de contato não são obrigatórios e que nesta versão o sistema **não envia avisos** por e-mail ou SMS. | Sistema | Essencial |
| RF-CID-19 | Apresentar, na etapa 5, a revisão de todos os dados informados, permitindo corrigir qualquer etapa antes de enviar. | Cidadão | Essencial |
| RF-CID-20 | Enviar a ocorrência por `POST /reports` e, havendo fotos, enviá-las em seguida por `POST /reports/:id/attachments`. | Sistema | Essencial |
| RF-CID-21 | Validar os campos obrigatórios de cada etapa antes de permitir o avanço, sinalizando o campo pendente. | Sistema | Essencial |
| RF-CID-22 | Impedir o envio duplicado da mesma ocorrência por novo acionamento do botão enquanto a requisição estiver em andamento. | Sistema | Importante |
| RF-CID-23 | Exibir mensagem de erro compreensível e preservar os dados preenchidos quando a API responder erro ou estiver indisponível, permitindo nova tentativa. | Sistema | Essencial |
| RF-CID-24 | Concluir o registro mesmo que o envio das fotos falhe, informando ao cidadão que a ocorrência foi registrada e que os anexos não foram enviados. | Sistema | Importante |

## 4. Confirmação e protocolo

| ID | Requisito | Ator | Prioridade |
|---|---|---|---|
| RF-CID-25 | Exibir, em `/registrar/confirmacao`, o **número de protocolo** em destaque visual, como informação principal da tela. | Sistema | Essencial |
| RF-CID-26 | Oferecer um botão para **copiar** o número de protocolo, com confirmação visual de que a cópia foi efetuada. | Cidadão | Essencial |
| RF-CID-27 | Alertar de forma destacada que o protocolo é a **única** forma de acompanhar a ocorrência e que, sem ele, não há como consultar o andamento depois. | Sistema | Essencial |
| RF-CID-28 | Oferecer, na tela de confirmação, um caminho direto para a consulta da ocorrência recém-registrada. | Cidadão | Importante |
| RF-CID-29 | Permitir imprimir ou salvar a confirmação com o número de protocolo. | Cidadão | Desejável |

## 5. Acompanhamento da ocorrência

| ID | Requisito | Ator | Prioridade |
|---|---|---|---|
| RF-CID-30 | Disponibilizar em `/acompanhar` a consulta por número de protocolo. | Cidadão | Essencial |
| RF-CID-31 | Aceitar o protocolo digitado sem distinção de maiúsculas/minúsculas e desprezando espaços em excesso. | Sistema | Importante |
| RF-CID-32 | Exibir em `/acompanhar/[protocolo]` a **situação atual** da ocorrência com rótulo em pt-BR, além do tipo, da categoria, do bairro e da data de registro. | Cidadão | Essencial |
| RF-CID-41 | Obter os rótulos em pt-BR de situação, categoria e tipo de `GET /metadata` (`reportStatuses`, `reportCategories`, `reportTypes`), sem manter mapa de tradução fixo no código. | Sistema | Essencial |
| RF-CID-33 | Exibir o **histórico** de andamentos visíveis ao cidadão, em ordem cronológica, com a data de cada registro. | Cidadão | Essencial |
| RF-CID-34 | Não exibir dados pessoais do cidadão nem a identificação dos agentes na tela de acompanhamento. | Sistema | Essencial |
| RF-CID-35 | Informar de forma clara, sem erro técnico, quando o protocolo consultado não for encontrado, orientando a conferir o número. | Sistema | Essencial |
| RF-CID-36 | Permitir compartilhar ou copiar o endereço da consulta da ocorrência. | Cidadão | Desejável |

## 6. Comportamento geral da aplicação

| ID | Requisito | Ator | Prioridade |
|---|---|---|---|
| RF-CID-37 | Consumir a API exclusivamente pelo endereço configurado em `NEXT_PUBLIC_API_URL`, sem endereços fixos no código. | Sistema | Essencial |
| RF-CID-42 | Consumir apenas `GET /metadata` — o portal não acessa `GET /metadata/internal`, que exige autenticação e traz enumerações de uso interno. | Sistema | Essencial |
| RF-CID-38 | Sinalizar o carregamento em toda operação que dependa da API (envio do registro, consulta de protocolo, carga dos tipos). | Sistema | Importante |
| RF-CID-39 | Exibir os anexos da ocorrência sempre pela URL devolvida pela API, sem acessar disco ou bucket diretamente. | Sistema | Essencial |
| RF-CID-40 | Concentrar o uso do Leaflet exclusivamente no componente `<LocationPicker>`, em `components/map/`, sem que nenhuma outra parte da interface importe a biblioteca. | Sistema | Essencial |

---

## 7. Fora do escopo desta versão

- cadastro, login ou área do cidadão ([decisão 05](../arquitetura.md#5-decisões-técnicas-registradas));
- recebimento de aviso por e-mail, SMS ou notificação push ([decisão 09](../arquitetura.md#5-decisões-técnicas-registradas));
- cancelamento da ocorrência pelo próprio cidadão;
- envio de novas fotos ou complemento do relato após a conclusão do registro — a API só
  aceita anexos enquanto a ocorrência está em `RECEIVED` (`RF-API-69`);
- avaliação do atendimento pelo cidadão;
- uso do portal sem conexão (*offline*) com envio posterior.
