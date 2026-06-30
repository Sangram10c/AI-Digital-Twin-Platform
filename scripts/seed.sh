#!/usr/bin/env bash
# ========================================
# AI Digital Twin Platform - Seed Script
# ========================================
# Seeds the database with initial data
# Usage: bash scripts/seed.sh
# ========================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🌱 Seeding database..."
echo "======================"

cd "$ROOT_DIR/backend"

# Run Prisma seed
npx prisma db seed

echo ""
echo "✅ Database seeded successfully!"
