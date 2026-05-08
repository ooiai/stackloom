# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS deps
WORKDIR /app/frontend

ENV NEXT_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY frontend/package.json frontend/pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM node:22-bookworm-slim AS builder
WORKDIR /app/frontend

ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_SIGIN

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL} \
    NEXT_PUBLIC_SIGIN=${NEXT_PUBLIC_SIGIN}

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY --from=deps /app/frontend/node_modules ./node_modules
COPY frontend ./

RUN pnpm build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

LABEL maintainer="ooiai@gmail.com"
LABEL version="1.0.0"

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY --from=builder --chown=node:node /app/frontend/public ./public
COPY --from=builder --chown=node:node /app/frontend/.next/standalone ./
COPY --from=builder --chown=node:node /app/frontend/.next/static ./.next/static

EXPOSE 3000

USER node

CMD ["node", "server.js"]
