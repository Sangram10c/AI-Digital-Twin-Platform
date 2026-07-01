#!/usr/bin/env bash
# ========================================
# AI Digital Twin Platform - Setup Script
# ========================================
# Usage: bash scripts/setup.sh
# ========================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 AI Digital Twin Platform - Setup"
echo "===================================="

# ----------------------------------------
# Copy environment files
# ----------------------------------------
echo ""
echo "📋 Setting up environment files..."

if [ ! -f "$ROOT_DIR/.env" ]; then
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
  echo "   ✅ Created .env from .env.example"
else
  echo "   ⏭️  .env already exists, skipping"
fi

if [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
  cp "$ROOT_DIR/frontend/.env.example" "$ROOT_DIR/frontend/.env.local"
  echo "   ✅ Created frontend/.env.local"
else
  echo "   ⏭️  frontend/.env.local already exists, skipping"
fi

if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
  echo "   ✅ Created backend/.env"
else
  echo "   ⏭️  backend/.env already exists, skipping"
fi

# ----------------------------------------
# Install dependencies
# ----------------------------------------
echo ""
echo "📦 Installing root dependencies..."
cd "$ROOT_DIR" && npm install

echo ""
echo "📦 Installing frontend dependencies..."
cd "$ROOT_DIR/frontend" && npm install

echo ""
echo "📦 Installing backend dependencies..."
cd "$ROOT_DIR/backend" && npm install

# ----------------------------------------
# Setup Husky
# ----------------------------------------
echo ""
echo "🐶 Setting up Husky..."
cd "$ROOT_DIR" && npx husky init

# ----------------------------------------
# Generate Prisma client
# ----------------------------------------
echo ""
echo "🔧 Generating Prisma client..."
cd "$ROOT_DIR/backend" && npx prisma generate

# ----------------------------------------
# Done
# ----------------------------------------
echo ""
echo "===================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start infrastructure:  docker-compose up -d"
echo "  2. Run migrations:        npm run db:migrate"
echo "  3. Start development:     npm run dev"
echo "===================================="
