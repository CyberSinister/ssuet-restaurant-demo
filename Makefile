# =============================================================================
# RMS - Restaurant Management System
# Makefile for Docker commands
# =============================================================================
# Usage:
#   make help        - Show available commands
#   make start       - Start full stack (app + postgres + redis)
#   make dev         - Start infrastructure only for local development
#   make stop        - Stop all containers
#   make logs        - View logs
#   make migrate     - Run database migrations
# =============================================================================

.PHONY: help start stop dev logs migrate seed build clean reset tools

# Default target
help:
	@echo "RMS - Restaurant Management System"
	@echo ""
	@echo "Usage:"
	@echo "  make start       Start full stack (app + postgres + redis)"
	@echo "  make dev         Start infrastructure only (postgres + redis) for local dev"
	@echo "  make stop        Stop all containers"
	@echo "  make restart     Restart all containers"
	@echo "  make logs        View container logs"
	@echo "  make logs-app    View app logs only"
	@echo "  make migrate     Run database migrations"
	@echo "  make seed        Seed the database"
	@echo "  make build       Build Docker images"
	@echo "  make clean       Remove containers and volumes"
	@echo "  make reset       Full reset (clean + rebuild + start)"
	@echo "  make tools       Start with dev tools (pgAdmin, Redis Commander, etc.)"
	@echo "  make workers     Start with background workers"
	@echo "  make shell       Open shell in app container"
	@echo "  make psql        Open PostgreSQL CLI"
	@echo "  make redis-cli   Open Redis CLI"
	@echo ""

# =============================================================================
# Main commands
# =============================================================================

# Start full stack
start:
	@echo "🚀 Starting RMS full stack..."
	@cp -n .env.docker .env 2>/dev/null || true
	docker compose up -d
	@echo ""
	@echo "✅ RMS is running!"
	@echo "   App:      http://localhost:3000"
	@echo "   Health:   http://localhost:3000/api/health"
	@echo ""

# Start infrastructure only (for local development with npm run dev)
dev:
	@echo "🔧 Starting development infrastructure..."
	@cp -n .env.docker .env 2>/dev/null || true
	docker compose up -d postgres redis
	@echo ""
	@echo "✅ Infrastructure ready!"
	@echo "   PostgreSQL: localhost:5432"
	@echo "   Redis:      localhost:6379"
	@echo ""
	@echo "Now run: npm run dev"
	@echo ""

# Stop all containers
stop:
	@echo "🛑 Stopping RMS..."
	docker compose down
	@echo "✅ Stopped"

# Restart
restart: stop start

# View logs
logs:
	docker compose logs -f

logs-app:
	docker compose logs -f app

# =============================================================================
# Database commands
# =============================================================================

# Run migrations
migrate:
	@echo "🔄 Running database migrations..."
	docker compose run --rm migrate
	@echo "✅ Migrations complete"

# Seed database (requires custom seed script)
seed:
	@echo "🌱 Seeding database..."
	docker compose exec app npx prisma db seed || echo "No seed script configured"
	@echo "✅ Seed complete"

# =============================================================================
# Build commands
# =============================================================================

# Build images
build:
	@echo "🔨 Building Docker images..."
	docker compose build
	@echo "✅ Build complete"

# Build with no cache
build-fresh:
	@echo "🔨 Building Docker images (no cache)..."
	docker compose build --no-cache
	@echo "✅ Build complete"

# =============================================================================
# Cleanup commands
# =============================================================================

# Clean containers and volumes
clean:
	@echo "🧹 Cleaning up..."
	docker compose down -v --remove-orphans
	docker volume rm rms_postgres_data rms_redis_data 2>/dev/null || true
	@echo "✅ Cleaned"

# Full reset
reset: clean build start migrate
	@echo "✅ Full reset complete"

# =============================================================================
# Dev tools & utilities
# =============================================================================

# Start with dev tools (pgAdmin, Redis Commander, etc.)
tools:
	@echo "🧰 Starting with dev tools..."
	@cp -n .env.docker .env 2>/dev/null || true
	docker compose --profile dev-tools up -d
	@echo ""
	@echo "✅ Dev tools running!"
	@echo "   pgAdmin:         http://localhost:5050"
	@echo "   Redis Commander: http://localhost:8081"
	@echo "   BullMQ Board:    http://localhost:3001"
	@echo ""

# Start with workers
workers:
	@echo "👷 Starting with workers..."
	docker compose --profile workers up -d
	@echo "✅ Workers started"

# Start with storage (MinIO)
storage:
	@echo "📦 Starting with storage..."
	docker compose --profile storage up -d
	@echo ""
	@echo "✅ MinIO running!"
	@echo "   API:     http://localhost:9000"
	@echo "   Console: http://localhost:9001"
	@echo ""

# Open shell in app container
shell:
	docker compose exec app sh

# Open PostgreSQL CLI
psql:
	docker compose exec postgres psql -U rms_user -d rms_db

# Open Redis CLI
redis-cli:
	docker compose exec redis redis-cli -a redis_password_123

# =============================================================================
# Status & Health
# =============================================================================

# Show status
status:
	docker compose ps

# Check health
health:
	@curl -s http://localhost:3000/api/health | jq . 2>/dev/null || curl -s http://localhost:3000/api/health
