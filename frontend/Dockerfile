# Build context must be the repo root (.) so shared/ is accessible.
# docker-compose.prod.yml sets: context: . / dockerfile: frontend/Dockerfile

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy manifests only first for better layer caching
COPY shared/package.json ./shared/package.json
COPY frontend/package.json frontend/package-lock.json* ./frontend/

# shared source must exist before npm ci resolves file:../shared
COPY shared/ ./shared/

# Install shared's own deps (axios, zustand, etc.) so webpack can resolve
# imports from shared/ source files during the Next.js build
RUN cd shared && npm install

RUN cd frontend && npm ci

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY shared/ ./shared/
COPY frontend/ ./frontend/

ENV NEXT_TELEMETRY_DISABLED=1

RUN cd frontend && npm run build

# ── Stage 3: Production runtime ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/frontend/public ./public

RUN mkdir .next && chown nextjs:nodejs .next

# next build --output standalone creates .next/standalone with a self-contained server.js
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
