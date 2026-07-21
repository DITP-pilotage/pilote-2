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

# Bases distinctes :
#   - API_BASE (dépôt/suppression) en HTTPS : l'app redirige http->https sur /api/*.
#   - CHALLENGE_BASE (lecture du challenge) en HTTP : /.well-known/acme-challenge/
#     est exempté de la redirection et c'est le canal que la CA utilise (HTTP-01).
# ACME_BASE_URL (si défini) force les deux — utilisé par les tests contre un mock.
API_BASE="${ACME_API_BASE_URL:-${ACME_BASE_URL:-https://$CERTBOT_DOMAIN}}"
CHALLENGE_BASE="${ACME_CHALLENGE_BASE_URL:-${ACME_BASE_URL:-http://$CERTBOT_DOMAIN}}"
POLL_TIMEOUT="${ACME_POLL_TIMEOUT:-60}"
POLL_INTERVAL="${ACME_POLL_INTERVAL:-2}"

# ACME_INSECURE : tolère un certificat TLS invalide (amorçage — le certificat
# n'existe pas encore). Le transport reste chiffré, seul le contrôle du cert est
# désactivé ; le Bearer n'est donc pas exposé en clair.
curl_cmd=(curl -sS)
[ -n "${ACME_INSECURE:-}" ] && curl_cmd+=(-k)

reponse="$(mktemp)"
trap 'rm -f "$reponse"' EXIT

# 1. Dépose le challenge (API, HTTPS).
corps="$(printf '{"token":"%s","keyAuthorization":"%s"}' "$CERTBOT_TOKEN" "$CERTBOT_VALIDATION")"
code="$("${curl_cmd[@]}" -o "$reponse" -w '%{http_code}' -X POST \
  -H "Authorization: Bearer $ACME_UPLOAD_API_KEY" \
  -H "Content-Type: application/json" \
  --data "$corps" \
  "$API_BASE$ACME_PUSH_PATH")"

if [ "$code" -lt 200 ] || [ "$code" -ge 300 ]; then
  echo "[auth-hook] échec du POST du challenge (HTTP $code)"
  cat "$reponse"
  exit 1
fi
echo "[auth-hook] challenge déposé pour $CERTBOT_DOMAIN (token $CERTBOT_TOKEN)"

# 2. Attend que le challenge soit servi publiquement (HTTP, comme la CA).
url_challenge="$CHALLENGE_BASE/.well-known/acme-challenge/$CERTBOT_TOKEN"
echeance=$(( $(date +%s) + POLL_TIMEOUT ))
while true; do
  servi="$("${curl_cmd[@]}" "$url_challenge" 2>/dev/null || true)"
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
