#!/usr/bin/env bash
set -eu

: "${PORT:?PORT must be set by Scalingo}"
export INTERNAL_PORT="${INTERNAL_PORT:-8080}"

if [ -d "/app/.profile.d" ]; then
  set +e
  for f in /app/.profile.d/*.sh; do
    [ -r "$f" ] && source "$f"
  done
  set -e
fi

if ! command -v node >/dev/null 2>&1; then
  for candidate in /app/.heroku/node/bin /app/vendor/node/bin /app/node/bin; do
    if [ -x "$candidate/node" ]; then
      export PATH="$candidate:$PATH"
      break
    fi
  done
fi

echo "[start] node: $(command -v node || echo 'NOT FOUND') — PATH=$PATH"

echo "[start] launching Keycloak on internal port $INTERNAL_PORT"
KC_HTTP_PORT="$INTERNAL_PORT" /app/bin/kc.sh start &

echo "[start] waiting for Keycloak readiness on http://127.0.0.1:$INTERNAL_PORT"
for i in $(seq 1 300); do
  if curl -sS -o /dev/null "http://127.0.0.1:$INTERNAL_PORT/" 2>/dev/null; then
    echo "[start] Keycloak ready after ${i}s"
    break
  fi
  if [ "$i" -eq 300 ]; then
    echo "[start] Keycloak failed to become ready within 300s, aborting"
    exit 1
  fi
  sleep 1
done

echo "[start] launching acme-proxy on PORT=$PORT → http://127.0.0.1:$INTERNAL_PORT"
exec node /app/acme-proxy/dist/server.mjs
