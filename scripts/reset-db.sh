#!/usr/bin/env bash
# ========================================
# AI Digital Twin Platform - Reset DB
# ========================================
# Resets the database (WARNING: destructive)
# Usage: bash scripts/reset-db.sh
# ========================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "⚠️  WARNING: This will reset the entire database!"
echo "=================================================="
read -p "Are you sure? (y/N): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "❌ Aborted."
  exit 0
fi

cd "$ROOT_DIR/backend"

echo ""
echo "🗑️  Resetting database..."
npx prisma migrate reset --force

echo ""
echo "✅ Database has been reset!"
echo ""
echo "Run 'bash scripts/seed.sh' to re-seed the database."
