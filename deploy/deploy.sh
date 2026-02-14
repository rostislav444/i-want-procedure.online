#!/bin/bash

set -e

# Configuration
PROJECT_DIR="/var/www/procedure"
DOMAIN="i-want-procedure.online"
EMAIL="admin@i-want-procedure.online"
COMPOSE_FILES="-f docker-compose.prod.yml -f docker-compose.frontend.yml -f docker-compose.nginx.yml"

# Set explicit project name to avoid conflicts
export COMPOSE_PROJECT_NAME=procedure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show usage
show_help() {
    echo "Procedure Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh <command>"
    echo ""
    echo "Commands:"
    echo "  deploy     - Full deployment (pull, build, stop, migrate, start)"
    echo "  restart    - Quick restart (no rebuild)"
    echo "  rebuild    - Rebuild images and restart (with migrations)"
    echo "  migrate    - Run database migrations only"
    echo "  logs       - View logs (add service name for specific)"
    echo "  status     - Show container status"
    echo "  stop       - Stop all containers"
    echo "  setup      - Initial setup with SSL (setup [domain] [email])"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh deploy"
    echo "  ./deploy.sh logs api"
    echo "  ./deploy.sh setup i-want-procedure.online admin@example.com"
}

# Create docker network and volumes
create_network() {
    log_info "Creating docker network and volumes..."
    docker network create procedure_network 2>/dev/null || log_info "Network already exists"
    docker volume create procedure_postgres_data 2>/dev/null || log_info "postgres_data already exists"
    docker volume create procedure_redis_data 2>/dev/null || log_info "redis_data already exists"
    docker volume create procedure_static_data 2>/dev/null || log_info "static_data already exists"
}

# Validate environment
validate_environment() {
    log_info "Validating environment..."

    if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
        log_error "Missing backend/.env file!"
        log_error "Please create it from backend/.env.example"
        exit 1
    fi

    if [ ! -f "$PROJECT_DIR/deploy/nginx.conf" ]; then
        log_error "Missing deploy/nginx.conf file!"
        exit 1
    fi

    if [ ! -d "$PROJECT_DIR/certbot/letsencrypt/live" ]; then
        log_warn "SSL certificates not found at certbot/letsencrypt/live/"
        log_warn "If this is initial setup, run: ./deploy/deploy.sh setup"
    fi

    log_info "Environment validation passed"
}

# Pre-deployment health check
health_check() {
    log_info "Running pre-deployment health check..."

    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running!"
        exit 1
    fi

    # Check if required network exists (or can be created)
    docker network inspect procedure_network > /dev/null 2>&1 || docker network create procedure_network

    # Check disk space (warn if < 10GB free)
    available=$(df /var/lib/docker 2>/dev/null | tail -1 | awk '{print $4}')
    if [ -n "$available" ] && [ "$available" -lt 10485760 ]; then
        log_warn "Low disk space: Less than 10GB available in /var/lib/docker"
    fi

    log_info "Health check passed"
}

# Pull latest code
pull_code() {
    log_info "Step 1/6: Pulling latest code..."
    cd $PROJECT_DIR
    git fetch origin
    git reset --hard origin/main
}

# Build images
build_images() {
    log_info "Step 2/6: Building Docker images..."
    cd $PROJECT_DIR
    docker compose $COMPOSE_FILES build --no-cache
}

# Stop containers
stop_containers() {
    log_info "Step 3/6: Stopping containers..."
    cd $PROJECT_DIR

    # Stop via docker-compose
    docker compose $COMPOSE_FILES down --remove-orphans || true

    # Force remove any containers with our names (handles orphans from other directories)
    log_info "Cleaning up any orphaned containers..."
    docker rm -f procedure_db procedure_redis procedure_api \
                 procedure_client_bot procedure_doctor_bot \
                 procedure_dozzle procedure_frontend procedure_nginx 2>/dev/null || true
}

# Cleanup old images
cleanup() {
    log_info "Step 4/6: Cleaning up old images..."
    docker image prune -f || true
}

# Run migrations
run_migrations() {
    log_info "Step 5/6: Running database migrations..."
    cd $PROJECT_DIR

    # Start only db first
    docker compose $COMPOSE_FILES up -d db

    # Wait for db to be ready
    log_info "Waiting for database to be ready..."
    sleep 10

    # Run migrations
    docker compose $COMPOSE_FILES run --rm api alembic upgrade head
}

# Start all services
start_services() {
    log_info "Step 6/6: Starting all services..."
    cd $PROJECT_DIR
    docker compose $COMPOSE_FILES up -d --force-recreate
}

# Full deployment
deploy() {
    log_info "Starting full deployment..."
    health_check
    validate_environment
    create_network
    pull_code
    build_images
    stop_containers
    cleanup
    run_migrations
    start_services
    log_info "Deployment complete!"
    show_status
}

# Quick restart
restart() {
    log_info "Restarting services..."
    cd $PROJECT_DIR
    docker compose $COMPOSE_FILES restart
    log_info "Restart complete!"
    show_status
}

# Rebuild and restart
rebuild() {
    log_info "Rebuilding and restarting..."
    create_network
    build_images
    stop_containers
    run_migrations
    start_services
    log_info "Rebuild complete!"
    show_status
}

# Run migrations only
migrate() {
    log_info "Running migrations..."
    cd $PROJECT_DIR
    docker compose $COMPOSE_FILES run --rm api alembic upgrade head
    log_info "Migrations complete!"
}

# Show logs
show_logs() {
    cd $PROJECT_DIR
    if [ -z "$1" ]; then
        docker compose $COMPOSE_FILES logs -f --tail=100
    else
        docker compose $COMPOSE_FILES logs -f --tail=100 "$1"
    fi
}

# Show status
show_status() {
    cd $PROJECT_DIR
    echo ""
    log_info "Container Status:"
    docker compose $COMPOSE_FILES ps
    echo ""
}

# Stop all
stop_all() {
    log_info "Stopping all containers..."
    cd $PROJECT_DIR
    docker compose $COMPOSE_FILES down
    log_info "All containers stopped!"
}

# Initial setup with SSL
setup() {
    local domain=${1:-$DOMAIN}
    local email=${2:-$EMAIL}

    log_info "=== Procedure Initial Setup ==="
    log_info "Domain: $domain"
    log_info "Email: $email"

    create_network

    # Create certbot directory
    log_info "Creating certbot directory..."
    mkdir -p $PROJECT_DIR/certbot/letsencrypt

    # Step 1: Use HTTP-only config for certbot
    log_info "Step 1: Starting services with HTTP config for SSL generation..."
    cp $PROJECT_DIR/deploy/nginx.certbot.conf $PROJECT_DIR/deploy/nginx.conf.active

    # Build and start all services
    log_info "Building and starting services..."
    docker compose $COMPOSE_FILES up -d --build

    # Wait for nginx to start
    log_info "Waiting for nginx to start..."
    sleep 10

    # Step 2: Generate SSL certificate
    log_info "Step 2: Generating SSL certificate..."
    docker run --rm \
        -v $PROJECT_DIR/certbot/letsencrypt:/etc/letsencrypt \
        -v $PROJECT_DIR/certbot:/var/www/certbot \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $email \
        --agree-tos \
        --no-eff-email \
        -d $domain \
        -d www.$domain

    # Step 3: Restore HTTPS config
    log_info "Step 3: Switching to HTTPS config..."
    rm -f $PROJECT_DIR/deploy/nginx.conf.active

    # Restart nginx with HTTPS config
    docker compose -f docker-compose.nginx.yml restart nginx

    # Run migrations
    log_info "Running database migrations..."
    docker compose $COMPOSE_FILES run --rm api alembic upgrade head

    echo ""
    log_info "=== Setup Complete ==="
    echo "Site: https://$domain"
    echo "Admin: https://$domain/admin"
    echo "Dozzle (logs): https://$domain/dozzle/"
    echo ""
    echo "GitHub Secrets to configure:"
    echo "  SERVER_HOST: your-server-ip"
    echo "  SERVER_USER: root"
    echo "  SERVER_SSH_KEY: your-ssh-private-key"
    echo "  SERVER_PORT: 22 (optional)"
}

# Main
case "$1" in
    deploy)
        deploy
        ;;
    restart)
        restart
        ;;
    rebuild)
        rebuild
        ;;
    migrate)
        migrate
        ;;
    logs)
        show_logs "$2"
        ;;
    status)
        show_status
        ;;
    stop)
        stop_all
        ;;
    setup)
        setup "$2" "$3"
        ;;
    *)
        show_help
        ;;
esac
