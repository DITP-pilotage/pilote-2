#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$ROOT_DIR"
rm -rf kpilot-api-deploy
pnpm deploy --filter @pilote/kpilot-api --prod --legacy kpilot-api-deploy
cp "$SCRIPT_DIR/start.sh" start.sh
echo "kpilot-api-deploy/ produit, start.sh copié à la racine"
