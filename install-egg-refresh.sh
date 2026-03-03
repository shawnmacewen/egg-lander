#!/usr/bin/env bash
set -euo pipefail

TARGET_BIN="${HOME}/.local/bin"
TARGET_CMD="${TARGET_BIN}/egg-refresh"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_SCRIPT="${ROOT_DIR}/refresh-local-game.sh"

mkdir -p "${TARGET_BIN}"
ln -sf "${SOURCE_SCRIPT}" "${TARGET_CMD}"
chmod +x "${SOURCE_SCRIPT}" "${TARGET_CMD}"

if [[ ":${PATH}:" != *":${TARGET_BIN}:"* ]]; then
  echo "Added command, but ${TARGET_BIN} is not on PATH yet."
  echo "Add this line to ~/.bashrc, then restart shell:"
  echo "export PATH=\"${TARGET_BIN}:\$PATH\""
else
  echo "egg-refresh installed at ${TARGET_CMD}"
  echo "Run: egg-refresh"
fi
