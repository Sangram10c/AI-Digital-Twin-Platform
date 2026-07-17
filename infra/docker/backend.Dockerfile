# ========================================
# Backend Dockerfile - Monorepo multi-stage
# Build context: repository root
# ========================================

FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY scripts/utilities/check-workspace-install.js ./scripts/utilities/check-workspace-install.js
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/utils/package.json ./packages/utils/package.json

RUN npm ci

FROM node:22-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY scripts ./scripts
COPY packages ./packages
COPY apps/backend ./apps/backend
COPY apps/frontend/package.json ./apps/frontend/package.json

WORKDIR /app/apps/backend
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_digital_twin?schema=public
RUN npx prisma generate
RUN npm run build

WORKDIR /app
RUN npm prune --omit=dev

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl dumb-init
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nestjs \
  && adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nestjs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder --chown=nestjs:nestjs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nestjs:nestjs /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder --chown=nestjs:nestjs /app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts

USER nestjs
WORKDIR /app/apps/backend
EXPOSE 4000

CMD ["dumb-init", "node", "dist/main.js"]
