#!/usr/bin/env bash
# ========================================
# AI Digital Twin Platform - Dev Script
# ========================================
# Starts all services for development
# Usage: bash scripts/dev.sh
# ========================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting AI Digital Twin Platform (Development)"
echo "==================================================="

# ----------------------------------------
# Start infrastructure
# ----------------------------------------
echo ""
echo "🐳 Starting Docker services (PostgreSQL, Redis)..."
cd "$ROOT_DIR" && docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# ----------------------------------------
# Start applications
# ----------------------------------------
echo ""
echo "🖥️  Starting frontend and backend..."
cd "$ROOT_DIR" && npm run dev
