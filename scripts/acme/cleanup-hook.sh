#!/usr/bin/env bash
# --manual-cleanup-hook de certbot.
# Supprime le challenge déposé. Best-effort : on ne fait jamais échouer la run
# ici (le store est en mémoire et disparaîtra de toute façon au prochain
# redéploiement du dyno). Le chemin de suppression diffère selon l'app :
#   - webapp (query) : DELETE <path>?token=<token>
#   - auth   (path)  : DELETE <path>/<token>
set -uo pipefail

: "${CERTBOT_DOMAIN:?CERTBOT_DOMAIN manquant}"
: "${CERTBOT_TOKEN:?CERTBOT_TOKEN manquant}"
: "${ACME_PUSH_PATH:?ACME_PUSH_PATH manquant}"
: "${ACME_UPLOAD_API_KEY:?ACME_UPLOAD_API_KEY manquant}"

BASE_URL="${ACME_BASE_URL:-https://$CERTBOT_DOMAIN}"
STYLE="${ACME_DELETE_STYLE:-query}"

if [ "$STYLE" = "path" ]; then
  url="$BASE_URL$ACME_PUSH_PATH/$CERTBOT_TOKEN"
else
  url="$BASE_URL$ACME_PUSH_PATH?token=$CERTBOT_TOKEN"
fi

code="$(curl -sS -o /dev/null -w '%{http_code}' -X DELETE \
  -H "Authorization: Bearer $ACME_UPLOAD_API_KEY" \
  "$url" || echo "000")"
echo "[cleanup-hook] DELETE $url -> HTTP $code"

# Best-effort : succès quel que soit le résultat.
exit 0
