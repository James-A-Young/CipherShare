#!/bin/bash

echo "🔐 CipherShare - Development Setup"
echo "=================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✓ Docker is running"

# Check if .env file exists
if [[ ! -f .env ]]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo "⚠️  Please edit .env and add your SendGrid API key"
else
    echo "✓ .env file exists"
fi

# Check if node_modules exists
if [[ ! -d node_modules ]]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✓ Dependencies installed"
fi

# Start Redis
echo ""
echo "🚀 Starting Redis..."
docker-compose up -d

# Wait for Redis to be healthy
echo "⏳ Waiting for Redis to be ready..."
sleep 3

if docker ps | grep -q ciphershare-redis; then
    echo "✓ Redis is running"
else
    echo "❌ Redis failed to start"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env and add your SendGrid API key (if not already done)"
echo "  2. Run 'npm run dev' to start the development servers"
echo "  3. Open http://localhost:5173 in your browser"
echo ""
