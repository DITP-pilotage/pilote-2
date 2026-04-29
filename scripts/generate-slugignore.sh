#!/usr/bin/env bash
set -euo pipefail

APP_PACKAGE="${APP_PACKAGE:-@pilote/ppg}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

case "$APP_PACKAGE" in
  "@pilote/mb-api")
    cp "$ROOT_DIR/scripts/.slugignore.mb-api" "$ROOT_DIR/.slugignore"
    ;;
  "@pilote/mb-webapp")
    cp "$ROOT_DIR/scripts/.slugignore.mb-webapp" "$ROOT_DIR/.slugignore"
    ;;
  *)
    cp "$ROOT_DIR/scripts/.slugignore.ppg" "$ROOT_DIR/.slugignore"
    ;;
esac

echo "Generated .slugignore for $APP_PACKAGE"
