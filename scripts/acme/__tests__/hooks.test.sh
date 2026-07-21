#!/usr/bin/env bash
# Tests des hooks ACME : lance le mock server node, exécute les hooks contre lui,
# vérifie les requêtes journalisées. Aucune dépendance hors node + curl.
set -uo pipefail

ICI="$(cd "$(dirname "$0")" && pwd)"
ACME_DIR="$(dirname "$ICI")"
ECHECS=0

demarrer_mock() {
  MOCK_LOG="$(mktemp)"
  export MOCK_LOG
  PORT_FILE="$(mktemp)"
  # Lance le mock en background ; MOCK_PID est bien le pid de node.
  node "$ICI/mock-challenge-server.mjs" > "$PORT_FILE" &
  MOCK_PID=$!
  # Attend la ligne "PORT=<port>" écrite par le mock une fois à l'écoute.
  ligne_port=""
  for _ in $(seq 1 50); do
    ligne_port="$(cat "$PORT_FILE")"
    [ -n "$ligne_port" ] && break
    sleep 0.1
  done
  MOCK_PORT="${ligne_port#PORT=}"
  BASE_URL="http://127.0.0.1:$MOCK_PORT"
}

arreter_mock() {
  kill "$MOCK_PID" 2>/dev/null || true
  wait "$MOCK_PID" 2>/dev/null || true
  rm -f "$MOCK_LOG" "$PORT_FILE"
}

assert_contient() {
  # $1 = description, $2 = motif grep, $3 = fichier
  if grep -q "$2" "$3"; then
    echo "  ok   $1"
  else
    echo "  FAIL $1 (motif '$2' absent)"
    ECHECS=$((ECHECS + 1))
  fi
}

assert_code() {
  # $1 = description, $2 = code attendu, $3 = code obtenu
  if [ "$2" = "$3" ]; then
    echo "  ok   $1"
  else
    echo "  FAIL $1 (attendu $2, obtenu $3)"
    ECHECS=$((ECHECS + 1))
  fi
}

echo "== auth-hook : dépose puis voit le challenge servi =="
demarrer_mock
CERTBOT_DOMAIN=exemple.test \
CERTBOT_TOKEN=tok123 \
CERTBOT_VALIDATION=keyauth-abc \
ACME_PUSH_PATH=/api/admin/acme-challenge \
ACME_UPLOAD_API_KEY=secret-key \
ACME_BASE_URL="$BASE_URL" \
ACME_POLL_INTERVAL=1 ACME_POLL_TIMEOUT=10 \
  bash "$ACME_DIR/auth-hook.sh"
code=$?
assert_code "auth-hook exit 0" 0 "$code"
assert_contient "POST reçu sur la bonne route" '"method":"POST".*"path":"/api/admin/acme-challenge"' "$MOCK_LOG"
assert_contient "Bearer transmis" '"authorization":"Bearer secret-key"' "$MOCK_LOG"
assert_contient "body contient token+keyAuthorization" 'keyauth-abc' "$MOCK_LOG"
assert_contient "poll GET well-known" '"method":"GET".*"/.well-known/acme-challenge/tok123"' "$MOCK_LOG"
arreter_mock

echo ""
echo "== cleanup-hook : style query (webapp) =="
demarrer_mock
CERTBOT_DOMAIN=exemple.test \
CERTBOT_TOKEN=tok123 \
ACME_PUSH_PATH=/api/admin/acme-challenge \
ACME_UPLOAD_API_KEY=secret-key \
ACME_DELETE_STYLE=query \
ACME_BASE_URL="$BASE_URL" \
  bash "$ACME_DIR/cleanup-hook.sh"
assert_code "cleanup-hook (query) exit 0" 0 "$?"
assert_contient "DELETE avec ?token=" '"method":"DELETE".*"search":"?token=tok123"' "$MOCK_LOG"
assert_contient "Bearer transmis au cleanup" '"authorization":"Bearer secret-key"' "$MOCK_LOG"
arreter_mock

echo ""
echo "== cleanup-hook : style path (auth) =="
demarrer_mock
CERTBOT_DOMAIN=exemple.test \
CERTBOT_TOKEN=tok999 \
ACME_PUSH_PATH=/api/acme/challenge \
ACME_UPLOAD_API_KEY=secret-key \
ACME_DELETE_STYLE=path \
ACME_BASE_URL="$BASE_URL" \
  bash "$ACME_DIR/cleanup-hook.sh"
assert_code "cleanup-hook (path) exit 0" 0 "$?"
assert_contient "DELETE sur /:token" '"method":"DELETE".*"path":"/api/acme/challenge/tok999"' "$MOCK_LOG"
arreter_mock

echo ""
echo "== auth-hook : ACME_INSECURE + bases API/challenge séparées =="
demarrer_mock
CERTBOT_DOMAIN=exemple.test \
CERTBOT_TOKEN=tok-insecure \
CERTBOT_VALIDATION=val-insecure \
ACME_PUSH_PATH=/api/admin/acme-challenge \
ACME_UPLOAD_API_KEY=secret-key \
ACME_API_BASE_URL="$BASE_URL" \
ACME_CHALLENGE_BASE_URL="$BASE_URL" \
ACME_INSECURE=true \
ACME_POLL_INTERVAL=1 ACME_POLL_TIMEOUT=8 \
  bash "$ACME_DIR/auth-hook.sh"
assert_code "auth-hook (insecure) exit 0" 0 "$?"
assert_contient "dépôt via API_BASE" '"method":"POST".*"path":"/api/admin/acme-challenge"' "$MOCK_LOG"
assert_contient "poll via CHALLENGE_BASE" '"method":"GET".*"/.well-known/acme-challenge/tok-insecure"' "$MOCK_LOG"
arreter_mock

echo ""
if [ "$ECHECS" -eq 0 ]; then
  echo "TOUS LES TESTS PASSENT"
  exit 0
else
  echo "$ECHECS test(s) en échec"
  exit 1
fi
