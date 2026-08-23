# syntax=docker/dockerfile:1.4

# ============================================================
# Stage 1: backend-builder — установка production-зависимостей
# Системные компиляторы нужны только здесь (для sqlite3)
# ============================================================
FROM node:22-alpine AS backend-builder

WORKDIR /src/backend

# Системные пакеты для компиляции нативных модулей
RUN apk add --no-cache python3 py3-pip build-base

# Сначала копируем только манифесты зависимостей,
# чтобы слой с npm ci кэшировался независимо от кода
COPY backend/package.json ./

# Устанавливаем только production-зависимости.
# lock-файл не хранится в git, поэтому npm install вместо npm ci.
RUN --mount=type=cache,target=/root/.npm \
    NODE_ENV=production npm install --no-audit --no-fund

# ============================================================
# Stage 2: client-builder — сборка React-фронтенда
# ============================================================
FROM node:22-alpine AS client-builder

WORKDIR /src/client

# Копируем манифест зависимостей клиента
# (lock-файл не хранится в git, см. client/.gitignore)
COPY client/package.json ./

# Устанавливаем зависимости клиента (нужны и dev-зависимости, т.к. react-scripts в них).
# Используем npm install вместо npm ci: lock-файл клиента не синхронизирован с package.json,
# поэтому npm ci падает с EUSAGE. --legacy-peer-deps нужен из-за старых peer-зависимостей
# react-scripts 3.1.1 (строгие peer-правила современного npm их не переваривают).
RUN --mount=type=cache,target=/root/.npm \
    npm install --no-audit --no-fund --legacy-peer-deps

# Копируем исходники клиента (package.json уже на месте, поэтому копируем поверх)
COPY ./client ./

# Собираем production-сборку.
# NODE_OPTIONS=--openssl-legacy-provider нужен из-за старого webpack (react-scripts 3.1.1),
# который не поддерживает новые алгоритмы хэширования OpenSSL в node 18+.
RUN NODE_OPTIONS=--openssl-legacy-provider npm run build

# ============================================================
# Stage 3: runtime — минимальный образ без компиляторов
# ============================================================
FROM node:22-alpine

WORKDIR /src

# В рантайме нужны docker CLI (управление Docker) и util-linux (setpriv —
# сброс привилегий с сохранением supplementary-groups для доступа к docker.sock).
RUN apk add --no-cache docker-cli util-linux

# Копируем уже установленные production-зависимости из backend-builder
COPY --from=backend-builder /src/backend/node_modules ./backend/node_modules

# Копируем исходники бэкенда
COPY ./backend ./backend

# Предсоздаём каталог БД с пустым файлом: именованный том в docker-compose
# монтируется на /src/backend/data, и при первом запуске Docker переносит
# содержимое образа (этот каталог) в пустой том.
# Каталог отдаётся пользователю node, т.к. сервис работает не от root.
RUN mkdir -p /src/backend/data && touch /src/backend/data/data.db && chown -R node:node /src/backend/data

# Копируем собранный фронтенд из client-builder поверх backend/web,
# чтобы сервер отдавал актуальную сборку клиента
COPY --from=client-builder /src/client/build ./backend/web

# Копируем точку входа
COPY ./app.js ./app.js

# Точка входа: от root чинит владельца смонтированного тома данных (он может
# принадлежать root от предыдущих запусков), затем запускает приложение от
# непривилегированного пользователя node через setpriv.
COPY ./docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3230

ENTRYPOINT ["/entrypoint.sh"]
