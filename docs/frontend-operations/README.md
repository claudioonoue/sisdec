# Portal de Operações — agentes da Defesa Civil

Aplicação web interna, de acesso restrito, onde os agentes recebem e gerenciam as
ocorrências registradas pela população.

- **Código-fonte**: [core/frontend-operations](../../core/frontend-operations)
- **Stack**: Node.js + Next.js (React, TypeScript) + Leaflet
- **Porta padrão**: `3001`
- **Acesso**: exclusivo a agentes autenticados

---

## 1. Público-alvo

Servidores da Defesa Civil, em três perfis:

| Perfil | Permissões |
|---|---|
| **Agente** | Visualiza todas as ocorrências, registra andamentos em qualquer uma e altera a situação **apenas das que lhe foram atribuídas** |
| **Coordenador** | Tudo do agente + triagem, definição de prioridade e atribuição de responsáveis |
| **Administrador** | Tudo do coordenador + gestão de contas de agentes |

## 2. Telas previstas

| Tela | Rota | Descrição |
|---|---|---|
| Login | `/login` | Autenticação por e-mail e senha |
| Painel | `/` | Indicadores: ocorrências abertas, por prioridade, por situação e por tipo |
| Lista de ocorrências | `/ocorrencias` | Tabela com filtros (situação, tipo, prioridade, bairro, período, responsável) e busca por protocolo |
| Detalhe da ocorrência | `/ocorrencias/[id]` | Relato, fotos, mapa, dados do cidadão, histórico e ações de atendimento |
| Triagem | `/ocorrencias/[id]` (ação) | Assume a triagem e, ao concluir, confirma o tipo, define a prioridade e encaminha ou marca como improcedente |
| Mapa | `/mapa` | Ocorrências abertas plotadas geograficamente (Leaflet + OpenStreetMap), com cor por prioridade |
| Agentes | `/agentes` | Cadastro e desativação de contas (apenas administrador) |

## 3. Fluxo principal do agente

```
login ─> painel ─> lista filtrada ─> detalhe da ocorrência
                                          │
                                          ├─ assumir a triagem
                                          ├─ concluir a triagem
                                          │    ├─ encaminhar (tipo + prioridade)
                                          │    └─ marcar improcedente
                                          ├─ atribuir responsável
                                          ├─ registrar andamento
                                          └─ concluir o atendimento
```

## 4. Estrutura de pastas prevista

```
core/frontend-operations/
├── src/
│   ├── app/                  # Rotas (App Router)
│   │   ├── login/
│   │   ├── ocorrencias/
│   │   ├── mapa/
│   │   └── agentes/
│   ├── components/           # Componentes de interface reutilizáveis
│   │   └── map/              # <ReportMap> — único ponto que importa o Leaflet
│   ├── features/             # Componentes e lógica por domínio (reports, agents, dashboard)
│   ├── lib/                  # Cliente HTTP, autenticação e utilitários
│   └── types/                # Tipos compartilhados com a API
└── public/
```

## 5. Variáveis de ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Endereço da API | `http://localhost:3000/api/v1` |

> O Leaflet acessa o DOM e não funciona na renderização do servidor: o `<ReportMap>` deve
> ser importado com `dynamic(..., { ssr: false })`. Ver [decisão 08](../arquitetura.md#mapas-decisão-08).

## 6. Como executar (após o scaffold)

```bash
cd core/frontend-operations
npm install
cp .env.example .env.local
npm run dev                   # http://localhost:3001 (porta já fixada no script)
```

## 7. Documentos relacionados

- [Requisitos funcionais](requisitos-funcionais.md) — `RF-OP-nn`
- [Requisitos não funcionais](requisitos-nao-funcionais.md) — `RNF-OP-nn`
- [API REST](../backend/api.md)
- [Arquitetura geral](../arquitetura.md)

## 8. Situação

🚧 Pasta criada, aplicação ainda não gerada.
