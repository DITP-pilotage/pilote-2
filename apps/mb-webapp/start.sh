#!/usr/bin/env bash
set -euo pipefail

exec node mb-webapp-deploy/dist/server/index.js
