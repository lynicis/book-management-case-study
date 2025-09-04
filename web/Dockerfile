FROM imbios/bun-node:latest-22-alpine AS base

FROM base AS deps

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_PUBLIC_API_URL="http://127.0.0.1:3001"

RUN bun run build

# Runner stage
FROM oven/bun:alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup webapp
RUN adduser -SDH webapp

COPY --from=builder --chown=webapp:webapp /app/.next/standalone ./

USER webapp

EXPOSE 3000

CMD ["bun", "run", "server.js"]
