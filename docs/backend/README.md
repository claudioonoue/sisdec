# Backend — API do SISDEC

API REST responsável pelas regras de negócio, persistência e autenticação do sistema.
Consumida pelo Portal do Cidadão e pelo Portal de Operações.

- **Código-fonte**: [core/backend](../../core/backend)
- **Stack**: NestJS 12 (TypeScript, ESM) + PostgreSQL 17 + Prisma 7 — testes com Vitest, lint com oxlint
- **Porta padrão**: `3000`

---

## 1. Responsabilidades

- Receber e validar o registro de ocorrências enviadas pelo Portal do Cidadão;
- Gerar o número de protocolo e permitir a consulta pública por ele;
- Autenticar agentes e controlar o acesso por perfil;
- Permitir triagem, priorização, atribuição e mudança de situação das ocorrências;
- Manter o histórico de andamentos de cada ocorrência;
- Armazenar os anexos (fotos) enviados, em disco local, atrás de uma abstração que
  permite migrar para S3 sem alterar as regras de negócio;
- Fornecer números consolidados para o painel do Portal de Operações.

## 2. Estrutura de pastas prevista

```
core/backend/
├── prisma7.config.ts          # Conexão e caminhos do Prisma 7 (lê o .env)
├── prisma/
│   ├── schema.prisma          # Modelo de dados
│   ├── migrations/            # Migrações versionadas
│   └── seed.ts                # Dados iniciais (tipos de ocorrência, agente admin)
├── src/
│   ├── generated/prisma/      # Cliente gerado pelo Prisma (fora do controle de versão)
│   ├── main.ts                # Bootstrap da aplicação
│   ├── app.module.ts          # Módulo raiz
│   ├── common/                # Filtros, interceptors, pipes e decorators compartilhados
│   ├── prisma/                # PrismaModule e PrismaService
│   └── modules/
│       ├── auth/              # Login, JWT, guards e perfis
│       ├── agents/            # Cadastro e gestão de agentes
│       ├── reports/           # Ocorrências (núcleo do sistema)
│       ├── report-updates/    # Histórico de andamentos
│       ├── attachments/       # Upload e download de anexos (StorageService)
│       └── dashboard/         # Indicadores consolidados
└── test/                      # Testes end-to-end
```

Cada módulo segue o padrão do NestJS: `*.module.ts`, `*.controller.ts`, `*.service.ts`
e uma pasta `dto/` com os objetos de entrada e saída validados.

## 3. Variáveis de ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | Conexão com o PostgreSQL | `postgresql://sisdec:sisdec@localhost:5432/sisdec` |
| `PORT` | Porta da API | `3000` |
| `JWT_SECRET` | Chave de assinatura dos tokens | `troque-esta-chave` |
| `JWT_EXPIRES_IN` | Validade do token | `8h` |
| `STORAGE_DRIVER` | Implementação de armazenamento de anexos (`local` nesta versão) | `local` |
| `UPLOAD_DIR` | Pasta de armazenamento dos anexos quando `STORAGE_DRIVER=local` | `./uploads` |
| `MAX_UPLOAD_SIZE_MB` | Tamanho máximo por anexo | `10` |
| `CORS_ORIGINS` | Origens permitidas, separadas por vírgula | `http://localhost:3001,http://localhost:3002` |

## 4. Como executar (após o scaffold)

```bash
docker compose up -d          # na raiz do repositório: sobe o PostgreSQL

cd core/backend
npm install
cp .env.example .env          # ajustar DATABASE_URL e JWT_SECRET
npx prisma migrate dev        # cria o banco e aplica as migrações
npx prisma db seed            # popula dados iniciais
npm run start:dev             # http://localhost:3000
```

## 5. Documentos relacionados

- [Modelo de dados](modelo-de-dados.md)
- [API REST](api.md)
- [Arquitetura geral](../arquitetura.md)

## 6. Situação

🚧 Pasta criada, aplicação ainda não gerada. Próximo passo em
[core/backend/README.md](../../core/backend/README.md).
