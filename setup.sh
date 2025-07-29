#!/bin/bash

# Recipix Setup Script
echo "🚀 Setting up Recipix - Financial Receipt Processing PWA"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or later. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."

# Root dependencies
echo "Installing root dependencies..."
npm install

# Frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Backend dependencies  
echo "Installing backend dependencies..."
cd backend && npm install && cd ..

echo "✅ Dependencies installed successfully"

# Create required directories
echo "📁 Creating required directories..."
mkdir -p backend/uploads
mkdir -p backend/logs
mkdir -p frontend/public/icons

echo "✅ Directories created"

# Copy environment file
echo "⚙️  Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Environment file created (.env)"
    echo "⚠️  Please edit .env file with your configuration"
else
    echo "ℹ️  Environment file already exists"
fi

# Generate basic icons for PWA (placeholder)
echo "🎨 Setting up PWA icons..."
# In a real setup, you would generate proper icons here
# For now, we'll just create placeholder files
for size in 72 96 128 144 152 192 384 512; do
    touch "frontend/public/icons/icon-${size}x${size}.png"
done

echo "✅ PWA icons setup complete"

# Build frontend for production check
echo "🏗️  Testing production build..."
cd frontend
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend builds successfully"
    rm -rf dist
else
    echo "⚠️  Frontend build failed - check dependencies"
fi
cd ..

# Build backend for production check
echo "🏗️  Testing backend build..."
cd backend
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend builds successfully"
    rm -rf dist
else
    echo "⚠️  Backend build failed - check dependencies"
fi
cd ..

echo ""
echo "🎉 Recipix setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Firefly III configuration"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Available commands:"
echo "- npm run dev          # Start both frontend and backend"
echo "- npm run dev:frontend # Start only frontend (port 3000)"
echo "- npm run dev:backend  # Start only backend (port 3001)"
echo "- npm run build        # Build for production"
echo "- npm test             # Run tests"
echo ""
echo "Documentation: README.md"
echo "Copilot Instructions: .github/copilot-instructions.md"
