#!/bin/bash
# Docker-based Local Production Build and Test Script

echo "🐳 Starting Docker-based Local Production Deployment Test"
echo "========================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
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

# Check if Docker is running
print_status "Checking Docker availability..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running or not installed!"
    echo "Please start Docker and try again."
    exit 1
fi
print_success "Docker is available"

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    print_warning "docker-compose not found, trying 'docker compose'..."
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi
print_success "Docker Compose is available"

# Stop and remove existing containers
print_status "Cleaning up existing containers..."
$DOCKER_COMPOSE -f docker-compose.local.yml down --volumes --remove-orphans
print_success "Existing containers cleaned up"

# Build the Docker image
print_status "Building Docker image for local production..."
docker build -t recipix:local-prod .
if [ $? -ne 0 ]; then
    print_error "Docker build failed!"
    exit 1
fi
print_success "Docker image built successfully"

# Start the services
print_status "Starting Recipix in Docker production mode..."
$DOCKER_COMPOSE -f docker-compose.local.yml up -d
if [ $? -ne 0 ]; then
    print_error "Failed to start Docker services!"
    exit 1
fi
print_success "Docker services started"

# Wait for the service to be ready
print_status "Waiting for service to be ready..."
for i in {1..30}; do
    if curl -f -s http://localhost:3001/receipts/api/health > /dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# Check if service is ready
if curl -f -s http://localhost:3001/receipts/api/health > /dev/null 2>&1; then
    print_success "Recipix is running successfully!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://localhost:3001/receipts"
    echo "   API:      http://localhost:3001/receipts/api"
    echo "   Health:   http://localhost:3001/receipts/api/health"
    echo ""
    echo "📊 Useful Docker commands:"
    echo "   View logs:    $DOCKER_COMPOSE -f docker-compose.local.yml logs -f"
    echo "   Stop:         $DOCKER_COMPOSE -f docker-compose.local.yml down"
    echo "   Restart:      $DOCKER_COMPOSE -f docker-compose.local.yml restart"
    echo ""
else
    print_error "Service failed to start properly!"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   Check logs: $DOCKER_COMPOSE -f docker-compose.local.yml logs"
    echo "   Check status: docker ps"
    exit 1
fi
