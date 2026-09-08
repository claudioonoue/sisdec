# Glossário

Termos do domínio utilizados no SISDEC. O nome em inglês é o que aparece no código-fonte
(tabelas, campos, endpoints e componentes).

| Termo (pt-BR) | Código (en) | Definição |
|---|---|---|
| Ocorrência | `Report` | Registro principal do sistema. Toda reclamação, sugestão ou comunicação de risco feita pela população. |
| Protocolo | `protocolNumber` | Código único gerado no registro da ocorrência. É o que o cidadão usa para acompanhar o atendimento. |
| Categoria | `ReportCategory` | Natureza do registro: reclamação, sugestão, solicitação ou comunicação de risco. |
| Tipo de ocorrência | `ReportType` | Assunto da ocorrência: alagamento, deslizamento, árvore em risco, estrutura danificada, incêndio, animal selvagem, entre outros. Lista completa no [modelo de dados](backend/modelo-de-dados.md#3-enumerações). |
| Situação | `ReportStatus` | Estágio atual do atendimento (recebida, em triagem, em atendimento, resolvida, improcedente, cancelada). |
| Prioridade | `Priority` | Grau de urgência atribuído pelo agente na triagem (baixa, média, alta, crítica). |
| Triagem | *triage* | Análise inicial feita por um agente: confirma o tipo, define a prioridade e encaminha a ocorrência. |
| Andamento / Histórico | `ReportUpdate` | Cada registro de mudança de situação ou observação feita sobre uma ocorrência. |
| Anexo | `Attachment` | Foto ou arquivo enviado junto à ocorrência. |
| Cidadão | `Citizen` | Pessoa que registra a ocorrência. Pode se identificar ou permanecer anônima. |
| Agente | `Agent` | Servidor da Defesa Civil que acessa o Portal de Operações. |
| Perfil | `AgentRole` | Nível de acesso do agente: administrador, coordenador ou agente. |
| Localização | `Location` | Endereço e/ou coordenadas geográficas da ocorrência. |
| Portal do Cidadão | `frontend-citizen` | Aplicação pública de registro e acompanhamento. |
| Portal de Operações | `frontend-operations` | Aplicação interna de gestão das ocorrências. |
