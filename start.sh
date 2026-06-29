#!/bin/bash
# XpressPro FX — Universal Production Start Script
# Works on any Linux/macOS system, VPS, or container.
#
# Usage:
#   bash start.sh                    # build API + start
#   BUILD_ALL=true bash start.sh     # build API + frontends + start (single-service)
#
set -euo pipefail

echo ""
echo "======================================"
echo " XpressPro FX — Production Start"
echo " $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "======================================"
echo ""

# Load .env file if it exists (local/VPS usage)
if [ -f "/etc/xpressfx.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source /etc/xpressfx.env
  set +a
  echo "[env] Loaded /etc/xpressfx.env"
elif [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
  echo "[env] Loaded .env"
fi

export PORT="${PORT:-8080}"
export NODE_ENV="${NODE_ENV:-production}"

echo "[config] PORT=${PORT}  NODE_ENV=${NODE_ENV}"

# Validate required env vars before building
if [ -z "${PORT:-}" ]; then
  echo "ERROR: PORT environment variable is required." >&2
  exit 1
fi
if [ -z "${SESSION_SECRET:-}" ] && [ "$NODE_ENV" = "production" ]; then
  echo "ERROR: SESSION_SECRET is required in production." >&2
  exit 1
fi

# Install dependencies
echo ""
echo "[install] Running npm ci..."
npm ci --prefer-offline 2>&1 | tail -5

# Build API server
echo ""
echo "[build] Building API server..."
npm run build -w @workspace/api-server

# Optionally build frontend apps (single-service mode)
if [ "${BUILD_ALL:-false}" = "true" ]; then
  echo ""
  echo "[build] Building NeXTrade frontend..."
  npm run build -w @workspace/nextrade
  echo "[build] Building admin portal..."
  npm run build -w @workspace/admin-portal
fi

echo ""
echo "[start] Starting API server on port ${PORT}..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
