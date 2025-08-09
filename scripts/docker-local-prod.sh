#!/bin/bash
# Docker-based Local Production Start Script

echo "🐳 Managing Recipix Docker Local Production"
echo "==========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Function to show status
show_status() {
    print_status "Current status:"
    $DOCKER_COMPOSE -f docker-compose.local.yml ps
    echo ""
}

# Function to show logs
show_logs() {
    print_status "Showing recent logs..."
    $DOCKER_COMPOSE -f docker-compose.local.yml logs --tail=50
}

# Function to start services
start_services() {
    print_status "Starting Recipix services..."
    $DOCKER_COMPOSE -f docker-compose.local.yml up -d
    
    if [ $? -eq 0 ]; then
        print_success "Services started successfully!"
        
        # Wait for health check
        print_status "Waiting for service to be ready..."
        for i in {1..30}; do
            if curl -f -s http://localhost:3001/receipts/api/health > /dev/null 2>&1; then
                break
            fi
            echo -n "."
            sleep 2
        done
        echo ""
        
        if curl -f -s http://localhost:3001/receipts/api/health > /dev/null 2>&1; then
            print_success "Recipix is ready!"
            echo ""
            echo "🌐 Access your application:"
            echo "   Frontend: http://localhost:3001/receipts"
            echo "   API:      http://localhost:3001/receipts/api"
            echo "   Health:   http://localhost:3001/receipts/api/health"
        else
            print_error "Service is not responding to health checks"
            show_logs
        fi
    else
        print_error "Failed to start services!"
    fi
}

# Function to stop services
stop_services() {
    print_status "Stopping Recipix services..."
    $DOCKER_COMPOSE -f docker-compose.local.yml down
    print_success "Services stopped"
}

# Function to restart services
restart_services() {
    print_status "Restarting Recipix services..."
    $DOCKER_COMPOSE -f docker-compose.local.yml restart
    print_success "Services restarted"
}

# Function to rebuild and start
rebuild_services() {
    print_status "Rebuilding and starting services..."
    $DOCKER_COMPOSE -f docker-compose.local.yml down --volumes
    docker build -t recipix:local-prod .
    $DOCKER_COMPOSE -f docker-compose.local.yml up -d
    start_services
}

# Main menu
case "${1:-}" in
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "rebuild")
        rebuild_services
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "follow-logs")
        print_status "Following logs (Ctrl+C to exit)..."
        $DOCKER_COMPOSE -f docker-compose.local.yml logs -f
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|rebuild|status|logs|follow-logs}"
        echo ""
        echo "Commands:"
        echo "  start        - Start the services"
        echo "  stop         - Stop the services"
        echo "  restart      - Restart the services"
        echo "  rebuild      - Rebuild image and start services"
        echo "  status       - Show current status"
        echo "  logs         - Show recent logs"
        echo "  follow-logs  - Follow logs in real-time"
        echo ""
        show_status
        ;;
esac
