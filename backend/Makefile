.PHONY: help build up down restart logs shell db-setup db-migrate db-seed db-reset sidekiq

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

logs-web: ## View logs from web service
	docker-compose logs -f web

logs-sidekiq: ## View logs from sidekiq service
	docker-compose logs -f sidekiq

shell: ## Open a shell in the web container
	docker-compose exec web bash

shell-db: ## Open a PostgreSQL shell
	docker-compose exec db psql -U postgres -d book_app_development

shell-redis: ## Open a Redis shell
	docker-compose exec redis redis-cli

db-setup: ## Set up database (create, migrate, seed)
	docker-compose exec web rails db:create db:migrate db:seed

db-migrate: ## Run database migrations
	docker-compose exec web rails db:migrate

db-seed: ## Seed the database
	docker-compose exec web rails db:seed

db-reset: ## Reset database (drop, create, migrate, seed)
	docker-compose exec web rails db:drop db:create db:migrate db:seed

db-rollback: ## Rollback last migration
	docker-compose exec web rails db:rollback

sidekiq: ## View Sidekiq logs
	docker-compose logs -f sidekiq

clean: ## Stop and remove containers, volumes, and images
	docker-compose down -v --rmi local

rebuild: ## Rebuild and restart all services
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

