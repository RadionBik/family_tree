SHELL := /bin/bash
.DEFAULT_GOAL := help
.PHONY: help setup test lint run-backend run-frontend dev prod prod-build seed clean

DEV  = docker compose --env-file .env_local -f docker-compose.yml -f docker-compose.dev.yml
PROD = docker compose --env-file .env_prod  -f docker-compose.yml -f docker-compose.prod.yml
COMPOSE ?= $(PROD)

help:  ## list targets
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-14s %s\n", $$1, $$2}'

setup: venv/bin/activate frontend/node_modules  ## python venv + npm install
venv/bin/activate: requirements.txt
	python3.12 -m venv venv && venv/bin/pip install -q -r requirements.txt && touch $@
frontend/node_modules: frontend/package-lock.json
	cd frontend && npm ci && touch node_modules

test: setup  ## backend smoke test
	venv/bin/python -m tests.test_smoke

lint: setup  ## pre-commit on all files
	venv/bin/pre-commit run --all-files

run-backend: setup  ## local API on :8000, reads .env
	set -a && source .env && set +a && venv/bin/uvicorn app.main:app --reload

run-frontend: setup  ## local Vite on :5173
	cd frontend && npm run dev

dev:  ## docker dev stack with hot reload (.env_local)
	$(DEV) up --build -d

prod:  ## (re)start the prod stack from the images CI shipped (.env_prod)
	$(PROD) up -d --remove-orphans

prod-build:  ## build the prod images locally; CI does this on every deploy
	$(PROD) build

seed:  ## create the admin and viewer login accounts (COMPOSE=$(DEV) for dev)
	$(COMPOSE) exec backend python -m scripts.seed_db

clean:  ## remove venv, node_modules, build output, caches
	rm -rf venv frontend/node_modules frontend/dist .ruff_cache
	find . -name __pycache__ -type d -prune -exec rm -rf {} +
