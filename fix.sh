#!/bin/bash
# ============================================================
# ChatCTA - Diagnostic & Fix Script
# Run this script when you face issues (e.g. 502 Bad Gateway)
# Usage: chmod +x fix.sh && ./fix.sh
# ============================================================

set -e
COMPOSE="docker compose"
command -v docker &>/dev/null || { echo "❌ Docker not found"; exit 1; }
$COMPOSE version &>/dev/null 2>&1 || COMPOSE="docker-compose"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     ChatCTA Diagnostic & Fix Tool    ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── 1. Show container status ──────────────────────────────
echo "📊 Container Status:"
$COMPOSE ps
echo ""

# ── 2. Check for unhealthy containers ─────────────────────
UNHEALTHY=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" 2>/dev/null)
if [ -n "$UNHEALTHY" ]; then
  echo "⚠️  Unhealthy containers detected: $UNHEALTHY"
  echo ""
fi

# ── 3. Show last 30 lines of each container's logs ────────
for svc in mongo backend frontend nginx; do
  NAME="chatcta-$svc"
  if docker ps -a --format "{{.Names}}" | grep -q "^$NAME$"; then
    echo "──────────────────────────────────────"
    echo "📋 Logs: $NAME (last 30 lines)"
    echo "──────────────────────────────────────"
    docker logs "$NAME" --tail=30 2>&1 || true
    echo ""
  fi
done

# ── 4. Quick connectivity checks ──────────────────────────
echo "──────────────────────────────────────"
echo "🔍 Connectivity Checks"
echo "──────────────────────────────────────"

# Backend health
echo -n "  Backend /health ... "
if docker exec chatcta-backend wget -qO- http://localhost:5000/health 2>/dev/null | grep -q "ok"; then
  echo "✅ OK"
else
  echo "❌ FAILED"
fi

# Frontend
echo -n "  Frontend (HTTP) ... "
if docker exec chatcta-frontend wget -qO- http://localhost:80 2>/dev/null | grep -q "html"; then
  echo "✅ OK"
else
  echo "❌ FAILED"
fi

# Nginx → Backend
echo -n "  Nginx → Backend ... "
if docker exec chatcta-nginx wget -qO- http://backend:5000/health 2>/dev/null | grep -q "ok"; then
  echo "✅ OK"
else
  echo "❌ FAILED"
fi

echo ""

# ── 5. Ask user what to do ────────────────────────────────
echo "╔══════════════════════════════════════╗"
echo "║         What would you like to do?   ║"
echo "║  1) Restart all containers           ║"
echo "║  2) Rebuild from scratch (FULL)      ║"
echo "║  3) Show backend logs live           ║"
echo "║  4) Exit                             ║"
echo "╚══════════════════════════════════════╝"
read -p "Choice [1-4]: " CHOICE

case $CHOICE in
  1)
    echo "🔄 Restarting all containers..."
    $COMPOSE restart
    echo "✅ Done. Wait 30 seconds then open http://localhost"
    ;;
  2)
    echo "🔨 Full rebuild (this may take 3-5 minutes)..."
    $COMPOSE down
    docker system prune -f
    $COMPOSE up -d --build
    echo ""
    echo "✅ Done! Opening http://localhost"
    echo "   Admin: http://localhost/admin"
    ;;
  3)
    echo "📋 Backend live logs (Ctrl+C to stop):"
    docker logs -f chatcta-backend
    ;;
  4)
    echo "Bye!"
    exit 0
    ;;
  *)
    echo "Invalid choice"
    ;;
esac
