# syntax=docker/dockerfile:1

ARG NODE_VERSION=26

FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app
ENV npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM dependencies AS build
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY source ./source
RUN npm run build

FROM base AS production-dependencies
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --ignore-scripts

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    STORAGE_ROOT=/app/storage

COPY --chown=node:node package.json ./
COPY --chown=node:node --from=production-dependencies /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/distribution ./distribution
COPY --chown=node:node public/documentation ./public/documentation

RUN mkdir -p /app/storage && chown node:node /app/storage
VOLUME ["/app/storage"]

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/ping').then((res) => process.exit(res.ok ? 0 : 1), () => process.exit(1))"]

CMD ["node", "--enable-source-maps", "distribution/main.js"]
