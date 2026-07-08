#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$ROOT_DIR"
rm -rf kpilote-api-deploy
pnpm deploy --filter @pilote/kpilote-api --prod --legacy kpilote-api-deploy
cp "$SCRIPT_DIR/start.sh" start.sh
echo "kpilote-api-deploy/ produit, start.sh copié à la racine"
