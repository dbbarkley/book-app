.PHONY: help build up down restart logs shell backend-shell frontend-shell db-setup db-migrate db-seed

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View logs from backend
	docker-compose logs -f backend

logs-frontend: ## View logs from frontend
	docker-compose logs -f frontend

logs-sidekiq: ## View logs from sidekiq
	docker-compose logs -f sidekiq

shell: ## Open a shell in the backend container
	docker-compose exec backend bash

backend-shell: ## Open a shell in the backend container
	docker-compose exec backend bash

frontend-shell: ## Open a shell in the frontend container
	docker-compose exec frontend sh

db-setup: ## Set up database (create, migrate, seed)
	docker-compose exec backend rails db:create db:migrate db:seed

db-migrate: ## Run database migrations
	docker-compose exec backend rails db:migrate

db-seed: ## Seed the database
	docker-compose exec backend rails db:seed

db-reset: ## Reset database (drop, create, migrate, seed)
	docker-compose exec backend rails db:drop db:create db:migrate db:seed

db-rollback: ## Rollback last migration
	docker-compose exec backend rails db:rollback

clean: ## Stop and remove containers, volumes, and images
	docker-compose down -v --rmi local

rebuild: ## Rebuild and restart all services
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

