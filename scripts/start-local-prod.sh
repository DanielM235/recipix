#!/bin/bash
# Local Production Start Script

echo "🌟 Starting Recipix in Production Mode (Local)"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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

# Check if builds exist
if [ ! -d "backend/dist" ]; then
    print_error "Backend build not found! Run 'npm run build:prod:local' first"
    exit 1
fi

if [ ! -d "frontend/dist" ]; then
    print_error "Frontend build not found! Run 'npm run build:prod:local' first"
    exit 1
fi

# Load environment
if [ ! -f .env ]; then
    print_error ".env file not found!"
    exit 1
fi

# Create necessary directories
print_status "Creating data directories..."
mkdir -p backend/data
mkdir -p backend/uploads
mkdir -p backend/cache/tesseract

# Initialize database
print_status "Initializing database..."
cd backend
npm run db:init:prod 2>/dev/null || true
cd ..

# Start the application
print_status "Starting Recipix in production mode..."
cd backend
NODE_ENV=production npm start

print_success "Recipix started successfully!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3001/receipts"
echo "   API:      http://localhost:3001/receipts/api"
echo "   Health:   http://localhost:3001/receipts/api/health"