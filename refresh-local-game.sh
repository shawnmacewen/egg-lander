#!/usr/bin/env bash
set -euo pipefail

SCRIPT_PATH="${BASH_SOURCE[0]}"
while [ -L "$SCRIPT_PATH" ]; do
  LINK_TARGET="$(readlink "$SCRIPT_PATH")"
  if [[ "$LINK_TARGET" = /* ]]; then
    SCRIPT_PATH="$LINK_TARGET"
  else
    SCRIPT_PATH="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)/$LINK_TARGET"
  fi
done
ROOT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
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
