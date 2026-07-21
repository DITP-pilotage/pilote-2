#!/usr/bin/env bash
# --manual-auth-hook de certbot.
# Dépose la keyAuthorization du challenge HTTP-01 sur la route de push de l'app
# (protégée par Bearer), puis attend que le challenge soit effectivement servi
# sur /.well-known/acme-challenge/<token> avant de rendre la main à certbot
# (sinon la CA pourrait vérifier avant que le dyno n'ait le token en mémoire).
set -euo pipefail

# Variables fournies par certbot.
: "${CERTBOT_DOMAIN:?CERTBOT_DOMAIN manquant}"
: "${CERTBOT_TOKEN:?CERTBOT_TOKEN manquant}"
: "${CERTBOT_VALIDATION:?CERTBOT_VALIDATION manquant}"
# Variables fournies par le workflow.
: "${ACME_PUSH_PATH:?ACME_PUSH_PATH manquant}"
: "${ACME_UPLOAD_API_KEY:?ACME_UPLOAD_API_KEY manquant}"

BASE_URL="${ACME_BASE_URL:-https://$CERTBOT_DOMAIN}"
POLL_TIMEOUT="${ACME_POLL_TIMEOUT:-60}"
POLL_INTERVAL="${ACME_POLL_INTERVAL:-2}"

reponse="$(mktemp)"
trap 'rm -f "$reponse"' EXIT

# 1. Dépose le challenge.
corps="$(printf '{"token":"%s","keyAuthorization":"%s"}' "$CERTBOT_TOKEN" "$CERTBOT_VALIDATION")"
code="$(curl -sS -o "$reponse" -w '%{http_code}' -X POST \
  -H "Authorization: Bearer $ACME_UPLOAD_API_KEY" \
  -H "Content-Type: application/json" \
  --data "$corps" \
  "$BASE_URL$ACME_PUSH_PATH")"

if [ "$code" -lt 200 ] || [ "$code" -ge 300 ]; then
  echo "[auth-hook] échec du POST du challenge (HTTP $code)"
  cat "$reponse"
  exit 1
fi
echo "[auth-hook] challenge déposé pour $CERTBOT_DOMAIN (token $CERTBOT_TOKEN)"

# 2. Attend que le challenge soit servi publiquement.
url_challenge="$BASE_URL/.well-known/acme-challenge/$CERTBOT_TOKEN"
echeance=$(( $(date +%s) + POLL_TIMEOUT ))
while true; do
  servi="$(curl -sS "$url_challenge" 2>/dev/null || true)"
  if [ "$servi" = "$CERTBOT_VALIDATION" ]; then
    echo "[auth-hook] challenge servi sur $url_challenge"
    exit 0
  fi
  if [ "$(date +%s)" -ge "$echeance" ]; then
    echo "[auth-hook] timeout : challenge non servi après ${POLL_TIMEOUT}s sur $url_challenge"
    exit 1
  fi
  sleep "$POLL_INTERVAL"
done
