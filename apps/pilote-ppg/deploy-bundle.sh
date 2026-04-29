#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cp "$SCRIPT_DIR/start.sh" "$ROOT_DIR/start.sh"
cp "$SCRIPT_DIR/cron.json" "$ROOT_DIR/cron.json"
echo "start.sh et cron.json copiés à la racine"
