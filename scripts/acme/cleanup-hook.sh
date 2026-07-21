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

# API en HTTPS (l'app redirige http->https sur /api/*). ACME_BASE_URL force la
# base — utilisé par les tests. ACME_INSECURE tolère un cert invalide (amorçage).
API_BASE="${ACME_API_BASE_URL:-${ACME_BASE_URL:-https://$CERTBOT_DOMAIN}}"
STYLE="${ACME_DELETE_STYLE:-query}"

curl_cmd=(curl -sS)
[ -n "${ACME_INSECURE:-}" ] && curl_cmd+=(-k)

if [ "$STYLE" = "path" ]; then
  url="$API_BASE$ACME_PUSH_PATH/$CERTBOT_TOKEN"
else
  url="$API_BASE$ACME_PUSH_PATH?token=$CERTBOT_TOKEN"
fi

code="$("${curl_cmd[@]}" -o /dev/null -w '%{http_code}' -X DELETE \
  -H "Authorization: Bearer $ACME_UPLOAD_API_KEY" \
  "$url" || echo "000")"
echo "[cleanup-hook] DELETE $url -> HTTP $code"

# Best-effort : succès quel que soit le résultat.
exit 0
