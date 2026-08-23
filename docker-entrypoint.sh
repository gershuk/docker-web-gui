#!/bin/sh
set -e

# Том данных мог быть создан предыдущей версией образа (файлы принадлежат
# root). Исправляем владельца, чтобы приложение от пользователя node могло
# писать в БД и создавать WAL-файлы. Работает и для свежих, и для старых томов.
chown -R node:node /src/backend/data

# HOME для непривилегированного пользователя (иначе docker CLI ругается на
# /root/.docker/config.json).
export HOME=/home/node

# Определяем группу, которой принадлежит docker.sock, на ЛЮБОМ хосте:
# работает и для root:docker, и для root:root и т.д.
DOCKER_GID="$(stat -c '%g' /var/run/docker.sock 2>/dev/null || echo 0)"

# Сбрасываем привилегии до пользователя node, сохраняя группу сокета в
# supplementary-groups (в отличие от su-exec, setpriv её не теряет).
exec setpriv --reuid=node --regid=node --groups "${DOCKER_GID}" -- node /src/app.js
