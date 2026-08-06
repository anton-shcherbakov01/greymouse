# syntax=docker/dockerfile:1

# ── deps ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── builder ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next пререндерит страницы кейсов на этапе сборки, поэтому доступ к уже
# мигрированной базе делает сборку полноценной: в образ попадает готовый HTML.
# Адрес передаётся build-аргументом (см. docker-compose.server.yml).
#
# Если база недоступна, сборка не падает: запросы к CMS в этом случае возвращают
# пустой результат, а страницы отрисуются при первом обращении. Такой образ
# рабочий, но менее оптимальный — предпочтительно собирать с доступной базой.
ARG DATABASE_URI=postgres://build:build@127.0.0.1:5432/build
ARG PAYLOAD_SECRET=build-time-placeholder-not-used-at-runtime
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URI=$DATABASE_URI
ENV PAYLOAD_SECRET=$PAYLOAD_SECRET
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN pnpm run build

# ── migrator ─────────────────────────────────────────────────────────────────
# Цель для запуска миграций и CLI-команд проекта (seed, create-admin).
#
# Собирается из deps и исходников БЕЗ `next build`: миграции должны применяться
# до сборки приложения, поэтому эта цель не может от неё зависеть.
FROM node:22-alpine AS migrator
RUN apk add --no-cache libc6-compat
WORKDIR /app
# NODE_ENV=production обязателен: иначе Payload синхронизирует схему напрямую
# (push), в обход миграций, и следующий `payload migrate` останавливается
# на интерактивном вопросе — в контейнере без TTY это вечное ожидание.
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# pnpm устанавливается на этапе сборки. Иначе corepack скачивает его при каждом
# запуске контейнера, и миграции не проходят там, где нет доступа в интернет.
RUN corepack enable && corepack install
CMD ["pnpm", "migrate"]

# ── runner ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "server.js"]
