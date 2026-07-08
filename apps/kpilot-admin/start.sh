#!/usr/bin/env bash
set -euo pipefail

exec node mb-admin-deploy/dist/server/index.js
