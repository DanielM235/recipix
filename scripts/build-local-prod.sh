#!/bin/bash
# Local Production Build and Test Script

echo "🚀 Starting Local Production Deployment Test"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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

# Step 1: Environment Setup
print_status "Setting up environment..."
if [ ! -f .env.local.production ]; then
    print_error ".env.local.production file not found!"
    exit 1
fi
cp .env.local.production .env
print_success "Environment configured"

# Step 2: Clean previous builds
print_status "Cleaning previous builds..."
rm -rf frontend/dist
rm -rf backend/dist
rm -rf backend/data
print_success "Previous builds cleaned"

# Step 3: Install dependencies
print_status "Installing dependencies..."
cd frontend && npm ci --silent && cd ..
cd backend && npm ci --silent && cd ..
cd shared && npm ci --silent && cd ..
print_success "Dependencies installed"

# Step 4: Build shared types
print_status "Building shared types..."
cd shared && npm run build && cd ..
print_success "Shared types built"

# Step 5: Build frontend for production
print_status "Building frontend for production..."
cd frontend
export VITE_API_URL="/receipts/api"
export VITE_BASE_PATH="/receipts"
npm run build
if [ $? -ne 0 ]; then
    print_error "Frontend build failed!"
    exit 1
fi
cd ..
print_success "Frontend built successfully"

# Step 6: Build backend for production
print_status "Building backend for production..."
cd backend
npm run build
if [ $? -ne 0 ]; then
    print_error "Backend build failed!"
    exit 1
fi
cd ..
print_success "Backend built successfully"

# Step 7: Test builds
print_status "Testing builds..."
if [ ! -d "frontend/dist" ]; then
    print_error "Frontend dist directory not found!"
    exit 1
fi
if [ ! -d "backend/dist" ]; then
    print_error "Backend dist directory not found!"
    exit 1
fi
print_success "Builds verified"

print_success "Local production build completed successfully!"
echo ""
echo "Next steps:"
echo "1. Run: npm run start:prod:local"
echo "2. Test at: http://localhost:3001/receipts"
echo "3. API available at: http://localhost:3001/receipts/api"