# ============================================================
# Godot Learning Platform — Multi-stage Dockerfile
# ============================================================
# Создаёт минимальный production-образ с Next.js standalone build.
# Godot Web Editor обслуживается отдельным Nginx-контейнером
# с COOP/COEP заголовками для SharedArrayBuffer.
#
# Использование:
#   docker build -t godot-learning .
#   docker compose up -d
# ============================================================

# --- Stage 1: Dependencies ---
FROM node:20-slim AS deps
WORKDIR /app

# Устанавливаем bun для быстрой сборки
RUN npm install -g bun

# Копируем package-файлы
COPY package.json bun.lock* package-lock.json* ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN if [ -f bun.lock ]; then \
      bun install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install; \
    fi

# Генерируем Prisma Client
RUN npx prisma generate

# --- Stage 2: Build ---
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Переменные окружения для сборки
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Собираем Next.js (standalone output)
RUN npm run build

# --- Stage 3: Production ---
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаём непривилегированного пользователя
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Копируем standalone-билд
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Копируем Prisma схему и базу данных
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Создаём директорию для БД и устанавливаем права
RUN mkdir -p /app/db && chown nextjs:nodejs /app/db

# Переключаемся на непривилегированного пользователя
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Запускаем Next.js standalone сервер
CMD ["node", "server.js"]
