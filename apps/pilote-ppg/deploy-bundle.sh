#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cp "$SCRIPT_DIR/start.sh" "$ROOT_DIR/start.sh"
echo "start.sh copié à la racine"
