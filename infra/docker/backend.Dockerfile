# ========================================
# Backend Dockerfile - Multi-stage Build
# ========================================

# Stage 1: Dependencies
FROM node:26-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY apps/backend/package.json apps/backend/package-lock.json* ./
RUN npm ci

# Stage 2: Build
FROM node:26-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY apps/backend/ .

RUN npx prisma generate
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Stage 3: Production
FROM node:26-alpine AS runner
RUN apk add --no-cache openssl dumb-init
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nestjs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nestjs /app/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/package.json ./
COPY --from=builder --chown=nestjs:nestjs /app/prisma ./prisma

USER nestjs

EXPOSE 4000

CMD ["dumb-init", "node", "dist/main.js"]
