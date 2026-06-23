#!/bin/sh
set -eu

echo "[railway-start] DATABASE_URL=${DATABASE_URL:-not set}"
echo "[railway-start] PORT=${PORT:-3000}"
echo "[railway-start] NODE_ENV=${NODE_ENV:-not set}"

if echo "${DATABASE_URL:-}" | grep -q '^file:/data/'; then
  echo "[railway-start] preparing /data volume..."
  mkdir -p /data
  chmod 1777 /data 2>/dev/null || true
fi

echo "[railway-start] prisma db push..."
if ! npx prisma db push --skip-generate; then
  echo "[railway-start] ERROR: prisma db push failed"
  exit 1
fi

echo "[railway-start] starting next.js on port ${PORT:-3000}..."
exec npm run start -- -p "${PORT:-3000}" -H "0.0.0.0"
