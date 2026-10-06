# Atalhos de desenvolvimento do SISDEC.
#
# Este arquivo **não é um sistema de build**. Ele só entra na pasta certa e chama
# o comando que já existe ali — a decisão 01 mantém os três projetos de `core/`
# independentes, cada um com o seu `package.json`, e nada aqui os acopla:
# apagar este Makefile não impede nenhum deles de ser instalado ou executado.
#
# É um Makefile, e não um `package.json` na raiz, justamente por isso: um
# package.json na raiz criaria um quarto projeto Node, com `node_modules` e
# resolução de dependências próprios, que é o acoplamento que a decisão evita.
#
#   make            lista os alvos
#   make setup      primeira execução, do zero
#   make dev        sobe banco, API e os dois portais juntos

SHELL := /bin/bash
.ONESHELL:
# Com `.ONESHELL` a receita inteira vai para **um** shell, e o make só observa o
# código de saída do último comando: sem `-e`, uma falha no meio passa como
# sucesso. Pelo mesmo motivo, toda receita que troca de pasta usa subshell —
# `cd` sem parênteses vazaria para as linhas seguintes.
.SHELLFLAGS := -e -o pipefail -c
.DEFAULT_GOAL := help

BACKEND   := core/backend
OPERATIONS:= core/frontend-operations
CITIZEN   := core/frontend-citizen
APPS      := $(BACKEND) $(OPERATIONS) $(CITIZEN)

# Alvos que não produzem arquivo com o seu nome — todos, aqui.
.PHONY: help setup install env db db-stop db-reset migrate seed seed-demo \
        api ops cid dev stop test test-e2e lint typecheck check build clean

## ---------------------------------------------------------------- ajuda

help: ## Lista os alvos disponíveis
	@echo "SISDEC — atalhos de desenvolvimento"
	@echo
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
	@echo
	@echo "  API      http://localhost:3000/api/v1"
	@echo "  Operações http://localhost:3001     Cidadão http://localhost:3002"

## ------------------------------------------------------- primeira execução

setup: install env db migrate seed seed-demo ## Prepara tudo do zero (primeira execução)
	@echo
	@echo "Pronto. 'make dev' sobe as três aplicações."
	@echo "Entre no Portal de Operações com admin@sisdec.local / sisdec-admin."

install: ## Instala as dependências das três aplicações
	@for app in $(APPS); do \
	  echo "--> npm install em $$app"; \
	  (cd $$app && npm install) || exit 1; \
	done

# O teste de existência é explícito porque `cp -n` devolve sucesso mesmo quando
# não copia: confiar no código de saída faria o alvo anunciar "criado" por cima
# de um `.env` que já tinha o segredo de quem está trabalhando.
env: ## Cria os arquivos de ambiente a partir dos exemplos, sem sobrescrever
	@for par in "$(BACKEND)/.env.example:$(BACKEND)/.env" \
	            "$(OPERATIONS)/.env.example:$(OPERATIONS)/.env.local" \
	            "$(CITIZEN)/.env.example:$(CITIZEN)/.env.local"; do \
	  exemplo=$${par%%:*}; destino=$${par##*:}; \
	  if [[ -f "$$destino" ]]; then echo "mantido  $$destino (já existe)"; \
	  else cp "$$exemplo" "$$destino" && echo "criado   $$destino"; fi; \
	done

## -------------------------------------------------------------- banco

db: ## Sobe o PostgreSQL e espera ficar saudável
	docker compose up -d --wait

db-stop: ## Para o PostgreSQL, preservando os dados
	docker compose stop

db-reset: ## APAGA o banco e recria do zero, com as migrações
	@read -p "Isto apaga todos os dados do banco de desenvolvimento. Continuar? [s/N] " r; \
	  [[ "$$r" == "s" || "$$r" == "S" ]] || { echo "cancelado"; exit 1; }
	docker compose down -v
	$(MAKE) db migrate seed

migrate: ## Aplica as migrações pendentes e gera o cliente Prisma
	@(cd $(BACKEND) && npx prisma migrate dev)

seed: ## Cria o agente administrador do primeiro acesso
	@(cd $(BACKEND) && npx prisma db seed)

seed-demo: ## Cria contas e ocorrências de demonstração (exige a API no ar para as fotos)
	@(cd $(BACKEND) && npm run seed:demo)

## ------------------------------------------------------- execução isolada

api: ## Só a API, em primeiro plano (porta 3000)
	@(cd $(BACKEND) && npm run start:dev)

ops: ## Só o Portal de Operações, em primeiro plano (porta 3001)
	@(cd $(OPERATIONS) && npm run dev)

cid: ## Só o Portal do Cidadão, em primeiro plano (porta 3002)
	@(cd $(CITIZEN) && npm run dev)

## -------------------------------------------------------- execução conjunta

# Os três sobem em segundo plano **no mesmo grupo de processos** do `make`, que
# é o grupo em primeiro plano do terminal. O Ctrl-C manda SIGINT ao grupo
# inteiro, então cada `npm` e cada `node` recebe o sinal diretamente — é o mesmo
# caminho pelo qual um `npm run dev` sozinho termina.
#
# Uma tentativa anterior isolava cada aplicação com `setsid`, num grupo próprio,
# e confiava num `trap` para derrubá-las. Isso as tirava do alcance do Ctrl-C e
# passava a depender de o trap disparar — quando não disparava, restavam três
# servidores segurando as portas. Ficar no grupo dispensa o trap para o caso
# normal; o `make stop` existe para o anormal.
#
# A saída de cada um é prefixada, para se saber de quem é cada linha.
dev: db ## Sobe banco, API e os dois portais juntos (Ctrl-C derruba todos)
	@echo "API :3000 · Operações :3001 · Cidadão :3002 — Ctrl-C para parar"
	@(cd $(BACKEND)    && npm run start:dev 2>&1 | sed -u 's/^/[api] /') & \
	(cd $(OPERATIONS) && npm run dev        2>&1 | sed -u 's/^/[ops] /') & \
	(cd $(CITIZEN)    && npm run dev        2>&1 | sed -u 's/^/[cid] /') & \
	wait

# Rede de segurança para quando algo escapou — de um Ctrl-C mal terminado, de um
# terminal fechado à força. Mata a **árvore** de cada processo que segura a
# porta: matar só quem escuta deixaria vivo o supervisor (`nest --watch`,
# `next dev`), que logo reabriria a porta.
#
# Todo comando que pode falhar legitimamente — não achar processo, não achar
# porta — termina em `|| true`: com `-e`, um `grep` sem resultado abortaria a
# receita justamente no caso bom, que é não haver nada para matar.
stop: ## Derruba o que tiver ficado ocupando as portas 3000, 3001 e 3002
	@for porta in 3000 3001 3002; do \
	  pids=$$(ss -ltnp 2>/dev/null | grep ":$$porta " | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u || true); \
	  if [[ -z "$$pids" ]]; then \
	    echo "porta $$porta: livre"; \
	  else \
	    echo "porta $$porta: encerrando $$pids e os seus supervisores"; \
	    for pid in $$pids; do \
	      pai=$$(ps -o ppid= -p $$pid 2>/dev/null | tr -d ' ' || true); \
	      avo=$$(ps -o ppid= -p "$$pai" 2>/dev/null | tr -d ' ' || true); \
	      for alvo in $$pid $$pai $$avo; do \
	        if [[ -n "$$alvo" && "$$alvo" != "1" ]]; then kill $$alvo 2>/dev/null || true; fi; \
	      done; \
	    done; \
	  fi; \
	done; \
	sleep 1; \
	restou=$$(ss -ltnp 2>/dev/null | grep -cE ":300[012] " || true); \
	if [[ "$$restou" == "0" ]]; then echo "todas as portas livres"; \
	else echo "AINDA OCUPADA — rode 'make stop' de novo"; fi

## ----------------------------------------------------------- verificação

typecheck: ## tsc --noEmit nas três aplicações
	@for app in $(APPS); do \
	  echo "--> tsc em $$app"; (cd $$app && npx tsc --noEmit) || exit 1; \
	done

lint: ## Lint nas três aplicações
	@for app in $(APPS); do \
	  echo "--> lint em $$app"; (cd $$app && npm run lint) || exit 1; \
	done

test: ## Testes unitários das três aplicações
	@for app in $(APPS); do \
	  echo "--> testes em $$app"; (cd $$app && npm test) || exit 1; \
	done

test-e2e: db ## Testes end-to-end da API (exige o banco no ar)
	@(cd $(BACKEND) && npm run test:e2e)

check: typecheck lint test ## Tudo o que uma etapa precisa passar antes do commit
	@echo
	@echo "Verificação completa. Falta apenas 'make test-e2e', que precisa do banco."

build: ## Build de produção das três aplicações
	@for app in $(APPS); do \
	  echo "--> build em $$app"; (cd $$app && npm run build) || exit 1; \
	done

clean: ## Remove artefatos de build e dependências instaladas
	rm -rf $(BACKEND)/dist $(BACKEND)/node_modules
	rm -rf $(OPERATIONS)/.next $(OPERATIONS)/node_modules
	rm -rf $(CITIZEN)/.next $(CITIZEN)/node_modules
