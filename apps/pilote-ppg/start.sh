#!/usr/bin/env bash
set -euo pipefail

exec node --max-old-space-size=${MAX_OLD_SPACE_SIZE:-768} apps/pilote-ppg/.next/standalone/apps/pilote-ppg/server.js
