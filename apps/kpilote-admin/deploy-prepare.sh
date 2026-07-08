#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cp "$SCRIPT_DIR/.slugignore" "$ROOT_DIR/.slugignore"
echo "mb-admin .slugignore copié à la racine du monorepo"
