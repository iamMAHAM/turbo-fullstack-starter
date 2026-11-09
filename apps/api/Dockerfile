# syntax=docker/dockerfile:1
# Build context: repository root.
#   docker build -f apps/api/Dockerfile -t app-api .

# --- manifests ---------------------------------------------------------------
FROM oven/bun:1.4.4-alpine AS manifests
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY apps/api/package.json apps/api/
COPY apps/admin/package.json apps/admin/
COPY apps/mobile/package.json apps/mobile/
COPY packages/schemas/package.json packages/schemas/
COPY packages/i18n/package.json packages/i18n/

# --- deps --------------------------------------------------------------------
FROM manifests AS deps
RUN bun install --frozen-lockfile --ignore-scripts --filter '@app/api'

# --- build -------------------------------------------------------------------
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/schemas packages/schemas
COPY apps/api apps/api
RUN cd packages/schemas && bun run build \
	&& cd ../../apps/api && bun run db:generate && bun run build

# --- migrate -----------------------------------------------------------------
#   docker build -f apps/api/Dockerfile --target migrate -t app-migrate .
FROM build AS migrate
WORKDIR /app/apps/api
ENV PRISMA_HIDE_UPDATE_MESSAGE=1
CMD ["bun", "run", "db:deploy"]

# --- prod deps ---------------------------------------------------------------
FROM manifests AS prod-deps
RUN bun install --frozen-lockfile --production --ignore-scripts --filter '@app/api' \
	&& mkdir -p apps/api/node_modules

# --- runtime -----------------------------------------------------------------
FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nestjs -G nodejs

COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=nestjs:nodejs /app/packages/schemas/package.json ./packages/schemas/
COPY --from=build --chown=nestjs:nodejs /app/packages/schemas/dist ./packages/schemas/dist
COPY --from=build --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --chown=nestjs:nodejs apps/api/package.json ./apps/api/

USER nestjs
WORKDIR /app/apps/api
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD wget -qO /dev/null "http://127.0.0.1:${PORT}/health" || exit 1
CMD ["node", "dist/main.js"]
