#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$ROOT_DIR"
rm -rf kpilote-webapp-deploy
pnpm deploy --filter @pilote/kpilote-webapp --prod --legacy kpilote-webapp-deploy
cp "$SCRIPT_DIR/start.sh" start.sh
echo "kpilote-webapp-deploy/ produit, start.sh copié à la racine"
