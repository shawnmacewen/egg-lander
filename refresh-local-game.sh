#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-5173}"
HOST="${HOST:-0.0.0.0}"

cd "$ROOT_DIR"

echo "[egg-lander] syncing latest branch..."
git pull --ff-only

echo "[egg-lander] installing dependencies..."
npm install --include=dev

if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -ti tcp:"$PORT" || true)"
  if [[ -n "$PIDS" ]]; then
    echo "[egg-lander] stopping process(es) on port $PORT: $PIDS"
    kill $PIDS || true
    sleep 1
  fi
fi

echo "[egg-lander] starting dev server on $HOST:$PORT"
exec npm run dev -- --host "$HOST" --port "$PORT"
