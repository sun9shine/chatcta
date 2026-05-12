#!/bin/bash
# ChatCTA - One-Command Startup Script

set -e

echo "🚀 Starting ChatCTA..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📋 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your settings, then run this script again."
    echo "   Especially set: ADMIN_PASSWORD, JWT_SECRET, FRONTEND_URL"
    exit 0
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

# Use docker compose or docker-compose
COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
fi

echo "🔨 Building and starting containers..."
$COMPOSE_CMD up -d --build

echo ""
echo "✅ ChatCTA is running!"
echo ""
echo "🌐 Web App:   http://localhost"
echo "🔧 Admin:     http://localhost/admin"
echo "📊 API:       http://localhost/api"
echo ""
echo "👤 Admin Login:"
source .env 2>/dev/null || true
echo "   Email:    ${ADMIN_EMAIL:-admin@chatcta.com}"
echo "   Password: ${ADMIN_PASSWORD:-Admin@12345}"
echo ""
echo "📋 Useful commands:"
echo "   View logs:    $COMPOSE_CMD logs -f"
echo "   Stop:         $COMPOSE_CMD down"
echo "   Restart:      $COMPOSE_CMD restart"
