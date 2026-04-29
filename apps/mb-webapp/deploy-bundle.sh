#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$ROOT_DIR"
rm -rf mb-webapp-deploy
pnpm deploy --filter @pilote/mb-webapp --prod --legacy mb-webapp-deploy
cp "$SCRIPT_DIR/nginx.conf" nginx.conf
cp "$SCRIPT_DIR/start.sh" start.sh
echo "mb-webapp-deploy/ produit, nginx.conf et start.sh copiés à la racine"
