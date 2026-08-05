# syntax=docker/dockerfile:1.4

# ============================================================
# Stage 1: builder — установка production-зависимостей
# Системные компиляторы нужны только здесь (для sqlite3)
# ============================================================
FROM node:18-alpine AS builder

WORKDIR /src/backend

# Системные пакеты для компиляции нативных модулей
RUN apk add --no-cache python3 py3-pip build-base

# Сначала копируем только манифесты зависимостей,
# чтобы слой с npm ci кэшировался независимо от кода
COPY backend/package.json backend/package-lock.json ./

# Устанавливаем только production-зависимости детерминированно (npm ci)
# Кэш npm переживает пересборки через BuildKit
RUN --mount=type=cache,target=/root/.npm \
    NODE_ENV=production npm ci

# ============================================================
# Stage 2: runtime — минимальный образ без компиляторов
# ============================================================
FROM node:18-alpine

WORKDIR /src

# В рантайме нужен только docker CLI для управления Docker
RUN apk add --no-cache docker-cli

# Копируем уже установленные production-зависимости из builder
COPY --from=builder /src/backend/node_modules ./backend/node_modules

# Копируем исходники приложения
COPY ./backend ./backend
COPY ./app.js ./app.js

EXPOSE 3230

CMD ["node", "/src/app.js"]