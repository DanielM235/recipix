#!/bin/bash

# Recipix Deployment Script
# This script helps deploy Recipix to your production server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
APP_BASE_PATH="/my-path/fintools"
HOST_PORT="8080"
CONTAINER_NAME="recipix-app"

echo -e "${BLUE}=== Recipix Production Deployment Script ===${NC}"
echo

# Function to print status messages
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are available"

# Function to generate secure random key
generate_secret() {
    openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    
    if [ -f ".env.production" ]; then
        cp .env.production .env
        print_status "Copied .env.production to .env"
    else
        print_error ".env.production template not found"
        exit 1
    fi
    
    # Generate secure secrets
    JWT_SECRET=$(generate_secret)
    SESSION_SECRET=$(generate_secret)
    
    # Replace placeholder secrets
    sed -i "s/JWT_SECRET=CHANGE_THIS_TO_A_SECURE_JWT_SECRET_KEY_IN_PRODUCTION/JWT_SECRET=${JWT_SECRET}/" .env
    sed -i "s/SESSION_SECRET=CHANGE_THIS_TO_A_SECURE_SESSION_SECRET_IN_PRODUCTION/SESSION_SECRET=${SESSION_SECRET}/" .env
    
    print_status "Generated secure JWT and session secrets"
    print_warning "Please review and customize the .env file before proceeding"
    
    echo -e "${YELLOW}Important environment variables to customize:${NC}"
    echo "- APP_BASE_PATH: Path on host machine (current: $APP_BASE_PATH)"
    echo "- HOST_PORT: External port (current: $HOST_PORT)"
    echo "- FRONTEND_URL: Your domain URL"
    echo "- API_BASE_URL: Your API URL"
    echo "- Firefly III configuration (if needed)"
    echo
    read -p "Press Enter to continue after reviewing .env file..."
fi

print_status ".env file found"

# Create necessary directories
print_status "Creating application directories..."

# Source the .env file to get APP_BASE_PATH
source .env

mkdir -p "${APP_BASE_PATH}/uploads"
mkdir -p "${APP_BASE_PATH}/logs"
mkdir -p "${APP_BASE_PATH}/database"

print_status "Created directories:"
echo "  - ${APP_BASE_PATH}/uploads"
echo "  - ${APP_BASE_PATH}/logs"
echo "  - ${APP_BASE_PATH}/database"

# Set proper permissions
chmod 755 "${APP_BASE_PATH}"
chmod 755 "${APP_BASE_PATH}/uploads"
chmod 755 "${APP_BASE_PATH}/logs"
chmod 755 "${APP_BASE_PATH}/database"

print_status "Set directory permissions"

# Stop existing container if running
if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
    print_status "Stopping existing container..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# Build and start the application
print_status "Building Docker image..."
docker-compose build --no-cache

print_status "Starting application..."
docker-compose up -d

# Wait for application to start
print_status "Waiting for application to start..."
sleep 10

# Check if application is healthy
if docker-compose ps | grep -q "Up (healthy)"; then
    print_status "Application is running and healthy!"
else
    print_warning "Application may still be starting up. Check logs with:"
    echo "  docker-compose logs -f"
fi

# Display status
echo
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo
echo "Application Status:"
docker-compose ps

echo
echo "Application URLs:"
echo "  - Frontend: ${FRONTEND_URL:-http://localhost:$HOST_PORT/receipts}"
echo "  - API: ${API_BASE_URL:-http://localhost:$HOST_PORT/receipts/api}"
echo "  - Health Check: ${API_BASE_URL:-http://localhost:$HOST_PORT/receipts/api}/health"

echo
echo "Useful Commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop application: docker-compose down"
echo "  - Restart application: docker-compose restart"
echo "  - Update application: git pull && docker-compose up -d --build"

echo
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure your nginx reverse proxy using nginx.conf.example"
echo "2. Set up SSL certificates for your domain"
echo "3. Configure firewall rules to allow only necessary ports"
echo "4. Set up log rotation for application logs"
echo "5. Configure backup for database and uploads"

echo
print_status "Deployment completed successfully!"
