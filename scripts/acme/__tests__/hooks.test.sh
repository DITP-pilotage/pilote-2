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
  # Lance le mock, récupère le port sur sa première ligne stdout.
  exec 3< <(node "$ICI/mock-challenge-server.mjs")
  MOCK_PID=$!
  read -r ligne_port <&3
  MOCK_PORT="${ligne_port#PORT=}"
  BASE_URL="http://127.0.0.1:$MOCK_PORT"
}

arreter_mock() {
  kill "$MOCK_PID" 2>/dev/null || true
  exec 3<&- 2>/dev/null || true
  rm -f "$MOCK_LOG"
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
if [ "$ECHECS" -eq 0 ]; then
  echo "TOUS LES TESTS PASSENT"
  exit 0
else
  echo "$ECHECS test(s) en échec"
  exit 1
fi
