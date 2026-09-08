# Portal do Cidadão

Aplicação web pública onde a população registra reclamações, sugestões e comunicações de
possíveis situações de risco, além de acompanhar o andamento pelo número de protocolo.

- **Código-fonte**: [core/frontend-citizen](../../core/frontend-citizen)
- **Stack**: Node.js + Next.js (React, TypeScript) + Leaflet
- **Porta padrão**: `3002`
- **Acesso**: público, **sem cadastro obrigatório**

---

## 1. Princípios de interface

- **Simplicidade acima de tudo**: o registro precisa ser concluído em poucos passos.
- **Mobile first**: a maior parte dos acessos ocorrerá pelo celular, possivelmente no local
  da ocorrência e sob condições ruins (chuva, pressa, conexão instável).
- **Sem barreiras**: identificar-se é opcional; nenhum cadastro é exigido para registrar.
- **Acessibilidade**: contraste adequado, textos claros, campos rotulados e navegação por teclado.

## 2. Telas previstas

| Tela | Rota | Descrição |
|---|---|---|
| Início | `/` | Explicação do serviço e dois caminhos: registrar ou acompanhar |
| Registrar ocorrência | `/registrar` | Formulário em etapas |
| Confirmação | `/registrar/confirmacao` | Exibe o número de protocolo com opção de copiar e aviso destacado para guardá-lo |
| Acompanhar | `/acompanhar` | Consulta pelo número de protocolo |
| Situação da ocorrência | `/acompanhar/[protocolo]` | Situação atual e histórico visível ao cidadão |
| Orientações | `/orientacoes` | O que fazer em situações de risco e telefones de emergência |

## 3. Formulário de registro (etapas)

```
1. O que aconteceu?     categoria + tipo de ocorrência
2. Onde?                endereço e bairro + <LocationPicker> (Leaflet) para ajustar o
                        ponto no mapa, com localização automática opcional
3. Detalhes             descrição e fotos (opcionais)
4. Seus dados           nome, e-mail e telefone — opcionais, com opção "prefiro não me identificar"
5. Revisão              conferência e envio
                        └─> protocolo SISDEC-AAAA-NNNNNN
```

> **Nesta versão o sistema não envia e-mail nem SMS** ([decisão 09](../arquitetura.md#5-decisões-técnicas-registradas)).
> O número de protocolo é a **única** forma de acompanhar a ocorrência, então a tela de
> confirmação precisa deixá-lo em evidência, com botão de copiar, e alertar que sem ele
> não há como consultar o andamento depois. O e-mail continua sendo coletado
> (opcionalmente) para viabilizar o envio de avisos numa versão futura.

> ⚠️ A tela inicial e a de registro devem exibir um aviso destacado: **em emergências,
> ligue 199 (Defesa Civil) ou 193 (Bombeiros)**. O sistema não substitui o atendimento
> emergencial.

## 4. Estrutura de pastas prevista

```
core/frontend-citizen/
├── src/
│   ├── app/
│   │   ├── registrar/
│   │   ├── acompanhar/
│   │   └── orientacoes/
│   ├── components/
│   │   └── map/              # <LocationPicker> — único ponto que importa o Leaflet
│   ├── features/             # report-form, report-tracking
│   ├── lib/                  # Cliente HTTP e utilitários
│   └── types/
└── public/
```

## 5. Variáveis de ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Endereço da API | `http://localhost:3000/api/v1` |

> O Leaflet acessa o DOM e não funciona na renderização do servidor: o `<LocationPicker>`
> deve ser importado com `dynamic(..., { ssr: false })`, e o formulário precisa continuar
> utilizável caso o mapa não carregue — o endereço digitado é o dado obrigatório, o ponto
> no mapa é complementar. Ver [decisão 08](../arquitetura.md#mapas-decisão-08).

## 6. Como executar (após o scaffold)

```bash
cd core/frontend-citizen
npm install
cp .env.example .env.local
npm run dev                   # http://localhost:3002 (porta já fixada no script)
```

## 7. Situação

🚧 Pasta criada, aplicação ainda não gerada.
