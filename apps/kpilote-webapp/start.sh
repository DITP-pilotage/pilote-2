#!/usr/bin/env bash
set -euo pipefail

exec node kpilote-webapp-deploy/dist/server/index.js
