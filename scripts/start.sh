#!/usr/bin/env bash
set -euo pipefail

APP_PACKAGE="${APP_PACKAGE:-@pilote/ppg}"

case "$APP_PACKAGE" in
  "@pilote/mb-api")
    exec node mb-api-deploy/dist/index.js
    ;;
  *)
    exec pnpm -F @pilote/ppg start
    ;;
esac
