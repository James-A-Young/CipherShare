#!/bin/bash
set -e

echo "🐳 CipherShare Docker Production Setup"
echo "======================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo "⚠️  .env.prod not found. Creating from template..."
    cp .env.prod.example .env.prod
    echo ""
    echo "📝 Please edit .env.prod with your configuration:"
    echo "   - REDIS_PASSWORD (generate with: openssl rand -base64 32)"
    echo "   - SYSTEM_SECRET_KEY (generate with: openssl rand -hex 32)"
    echo "   - EMAIL_PROVIDER and credentials"
    echo "   - CLIENT_URL"
    echo ""
    read -p "Press Enter after configuring .env.prod..."
fi

echo "🔨 Building Docker image..."
docker-compose -f docker-compose.prod.yml build

echo ""
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check container status
if docker ps | grep -q "ciphershare-app-prod"; then
    echo "✅ Application container is running"
else
    echo "❌ Application container failed to start"
    echo "View logs with: docker-compose -f docker-compose.prod.yml logs app"
    exit 1
fi

if docker ps | grep -q "ciphershare-redis-prod"; then
    echo "✅ Redis container is running"
else
    echo "❌ Redis container failed to start"
    echo "View logs with: docker-compose -f docker-compose.prod.yml logs redis"
    exit 1
fi

echo ""
echo "🏥 Testing health endpoint..."
sleep 3
if curl -f -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Health check passed"
else
    echo "⚠️  Health check failed (service may still be starting up)"
fi

echo ""
echo "🎉 CipherShare is deployed!"
echo ""
echo "📊 Useful commands:"
echo "   View logs:    npm run docker:logs"
echo "   Stop:         npm run docker:stop"
echo "   Restart:      docker-compose -f docker-compose.prod.yml restart"
echo "   Status:       docker ps"
echo ""
echo "🌐 Access your application at:"
echo "   http://localhost:3001"
echo ""
