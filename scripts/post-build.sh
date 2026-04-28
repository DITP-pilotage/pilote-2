#!/usr/bin/env bash
set -euo pipefail

APP_PACKAGE="${APP_PACKAGE:-@pilote/ppg}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

case "$APP_PACKAGE" in
  "@pilote/mb-api")
    cd "$ROOT_DIR"
    rm -rf mb-api-deploy
    pnpm deploy --filter @pilote/mb-api --prod --legacy mb-api-deploy
    echo "mb-api-deploy/ produced"
    ;;
  *)
    ;;
esac
