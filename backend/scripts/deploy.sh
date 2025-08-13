#!/bin/bash

# 🚀 DEPLOYMENT SCRIPT - SISTEMA PROCURA
# Script automatizado para deployment en diferentes entornos

set -e  # Exit on any error

# ========================================
# CONFIGURACIÓN
# ========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/opt/procura/backups"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================
# FUNCIONES DE LOGGING
# ========================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ========================================
# FUNCIONES DE VALIDACIÓN
# ========================================
check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        log_error ".env file not found"
        exit 1
    fi
    
    log_success "All dependencies are satisfied"
}

validate_environment() {
    local env=$1
    log_info "Validating environment: $env"
    
    # Check required environment variables
    source "$PROJECT_ROOT/.env"
    
    required_vars=(
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "ENCRYPTION_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    log_success "Environment validation passed"
}

# ========================================
# FUNCIONES DE BACKUP
# ========================================
create_backup() {
    local env=$1
    log_info "Creating backup for environment: $env"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if [ "$env" = "production" ]; then
        log_info "Creating database backup..."
        docker-compose exec -T postgres pg_dump -U procura procura > "$BACKUP_DIR/db_backup_${env}_${TIMESTAMP}.sql"
        log_success "Database backup created: db_backup_${env}_${TIMESTAMP}.sql"
    fi
    
    # Backup configuration
    cp "$PROJECT_ROOT/.env" "$BACKUP_DIR/env_backup_${env}_${TIMESTAMP}"
    log_success "Configuration backup created"
}

# ========================================
# FUNCIONES DE DEPLOYMENT
# ========================================
deploy_application() {
    local env=$1
    log_info "Deploying application to environment: $env"
    
    # Change to project directory
    cd "$PROJECT_ROOT"
    
    # Pull latest images
    log_info "Pulling latest Docker images..."
    docker-compose pull
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose down
    
    # Start services
    log_info "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Run database migrations
    log_info "Running database migrations..."
    docker-compose exec -T backend npx prisma migrate deploy
    
    # Verify deployment
    verify_deployment
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check if containers are running
    local containers=("procura-backend" "procura-postgres" "procura-redis")
    
    for container in "${containers[@]}"; do
        if ! docker ps --format "table {{.Names}}" | grep -q "$container"; then
            log_error "Container $container is not running"
            exit 1
        fi
    done
    
    # Health check
    log_info "Performing health checks..."
    
    # Backend health check
    if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_error "Backend health check failed"
        exit 1
    fi
    
    # Database health check
    if ! docker-compose exec -T postgres pg_isready -U procura > /dev/null 2>&1; then
        log_error "Database health check failed"
        exit 1
    fi
    
    # Redis health check
    if ! docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_error "Redis health check failed"
        exit 1
    fi
    
    log_success "All health checks passed"
}

# ========================================
# FUNCIONES DE MONITORING
# ========================================
setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Start monitoring services
    docker-compose up -d prometheus grafana
    
    # Wait for monitoring services
    sleep 10
    
    # Verify monitoring
    if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
        log_success "Prometheus is running"
    else
        log_warning "Prometheus health check failed"
    fi
    
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "Grafana is running"
    else
        log_warning "Grafana health check failed"
    fi
}

# ========================================
# FUNCIONES DE ROLLBACK
# ========================================
rollback() {
    local env=$1
    log_warning "Rolling back deployment for environment: $env"
    
    # Stop current deployment
    docker-compose down
    
    # Restore from backup if available
    local latest_backup=$(ls -t "$BACKUP_DIR/db_backup_${env}_"*.sql 2>/dev/null | head -1)
    if [ -n "$latest_backup" ]; then
        log_info "Restoring from backup: $latest_backup"
        docker-compose up -d postgres
        sleep 10
        docker-compose exec -T postgres psql -U procura procura < "$latest_backup"
    fi
    
    # Restart with previous configuration
    docker-compose up -d
    
    log_success "Rollback completed"
}

# ========================================
# FUNCIONES DE LIMPIEZA
# ========================================
cleanup() {
    log_info "Cleaning up old backups..."
    
    # Keep only last 5 backups
    find "$BACKUP_DIR" -name "db_backup_*.sql" -type f -printf '%T@ %p\n' | \
        sort -nr | tail -n +6 | cut -d' ' -f2- | xargs -r rm
    
    # Clean up Docker images
    log_info "Cleaning up unused Docker images..."
    docker image prune -f
    
    # Clean up Docker volumes
    log_info "Cleaning up unused Docker volumes..."
    docker volume prune -f
    
    log_success "Cleanup completed"
}

# ========================================
# FUNCIONES DE REPORTE
# ========================================
generate_report() {
    local env=$1
    log_info "Generating deployment report..."
    
    local report_file="$BACKUP_DIR/deployment_report_${env}_${TIMESTAMP}.txt"
    
    {
        echo "=== SISTEMA PROCURA DEPLOYMENT REPORT ==="
        echo "Environment: $env"
        echo "Timestamp: $(date)"
        echo "Deployment Status: SUCCESS"
        echo ""
        echo "=== CONTAINER STATUS ==="
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        echo "=== SYSTEM RESOURCES ==="
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
        echo ""
        echo "=== HEALTH CHECKS ==="
        echo "Backend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)"
        echo "Database: $(docker-compose exec -T postgres pg_isready -U procura && echo "OK" || echo "FAILED")"
        echo "Redis: $(docker-compose exec -T redis redis-cli ping && echo "OK" || echo "FAILED")"
    } > "$report_file"
    
    log_success "Deployment report generated: $report_file"
}

# ========================================
# FUNCIÓN PRINCIPAL
# ========================================
main() {
    local env=${1:-staging}
    local action=${2:-deploy}
    
    log_info "Starting Sistema Procura deployment"
    log_info "Environment: $env"
    log_info "Action: $action"
    
    case $action in
        "deploy")
            check_dependencies
            validate_environment "$env"
            create_backup "$env"
            deploy_application "$env"
            setup_monitoring
            cleanup
            generate_report "$env"
            log_success "Deployment completed successfully!"
            ;;
        "rollback")
            rollback "$env"
            ;;
        "verify")
            verify_deployment
            ;;
        "backup")
            create_backup "$env"
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            log_error "Unknown action: $action"
            echo "Usage: $0 [environment] [action]"
            echo "Actions: deploy, rollback, verify, backup, cleanup"
            exit 1
            ;;
    esac
}

# ========================================
# EJECUCIÓN
# ========================================
if [ "$#" -eq 0 ]; then
    main "staging" "deploy"
else
    main "$@"
fi



