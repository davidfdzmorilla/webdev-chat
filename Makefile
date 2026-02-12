.PHONY: dev build start stop restart logs clean deploy

# Development
dev:
	pnpm dev

# Docker commands
build:
	docker compose build

start:
	docker compose up -d

stop:
	docker compose down

restart: stop start

logs:
	docker compose logs -f app

# Database
db-generate:
	pnpm db:generate

db-push:
	pnpm db:push

db-studio:
	pnpm db:studio

# Deployment
deploy:
	@echo "Building Docker images..."
	docker compose build
	@echo "Starting containers..."
	docker compose up -d
	@echo "Waiting for database..."
	sleep 5
	@echo "Running migrations..."
	docker compose exec app pnpm db:push
	@echo "Deployment complete!"
	@echo "App running at http://localhost:3006"

# Cleanup
clean:
	docker compose down -v
	rm -rf .next node_modules
