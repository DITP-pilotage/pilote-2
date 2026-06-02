#!/usr/bin/env bash
# ------------------------------------------------------------------------------
# start.sh — orchestre Keycloak + acme-proxy dans un même dyno Scalingo
#
# Principe :
#   Le dyno expose UN seul port public ($PORT, imposé par Scalingo). On veut
#   pouvoir intercepter /.well-known/acme-challenge/* — le challenge HTTP-01
#   du flow ACME, où certbot dépose une keyAuthorization que la CA vient
#   vérifier — avant que les requêtes n'atteignent Keycloak, qui ne sait pas
#   servir ces fichiers.
#
#   Architecture :
#       Internet ──$PORT──► acme-proxy (Hono, node) ──127.0.0.1:$INTERNAL_PORT──► Keycloak
#
#   Le script :
#     1. Démarre Keycloak en background sur $INTERNAL_PORT (port privé).
#     2. Attend qu'il réponde HTTP avant de lancer le proxy (sinon les premières
#        requêtes prendraient un 502).
#     3. Démarre le proxy en background sur $PORT.
#     4. Couple la vie des deux process : si Keycloak meurt, on tue le proxy
#        (et inversement), et on exit non-zéro pour que Scalingo redémarre le
#        container. Sinon on se retrouvait avec un proxy orphelin qui répondait
#        des 502 sans que la plateforme ne s'en rende compte.
# ------------------------------------------------------------------------------

# -e : abort si une commande échoue ; -u : abort si une variable est lue sans
# être définie. Évite de continuer dans un état corrompu.
set -eu

# Scalingo *doit* fournir $PORT (port public). Sans lui on ne sait pas où binder.
: "${PORT:?PORT must be set by Scalingo}"
# Port privé sur lequel Keycloak écoute en local (jamais exposé à Internet).
# 8080 est la valeur par défaut historique de Keycloak/Quarkus.
export INTERNAL_PORT="${INTERNAL_PORT:-8080}"

# --- 1. Démarrage de Keycloak en background ----------------------------------
echo "[start] launching Keycloak on internal port $INTERNAL_PORT"
# KC_HTTP_PORT est lu par kc.sh pour configurer Quarkus. On lance en background
# pour pouvoir enchaîner le démarrage du proxy ensuite.
KC_HTTP_PORT="$INTERNAL_PORT" /app/bin/kc.sh start &
# $! = PID du dernier process lancé en background. On le mémorise pour pouvoir
# surveiller / tuer Keycloak plus tard.
KC_PID=$!

# --- 2. Attente de la readiness de Keycloak ----------------------------------
# On poll HTTP plutôt que de dormir un délai fixe : le temps de boot varie
# (warm vs cold start, JVM, etc.). On lance le proxy seulement quand Keycloak
# répond, sinon les premières requêtes utilisateur tombent en 502.
echo "[start] waiting for Keycloak readiness on http://127.0.0.1:$INTERNAL_PORT"
for i in $(seq 1 300); do
  # kill -0 : ne tue rien, vérifie juste que le process existe. Si Keycloak a
  # crashé pendant son démarrage (erreur de config, DB injoignable…) inutile
  # d'attendre 5 minutes pour rien.
  if ! kill -0 "$KC_PID" 2>/dev/null; then
    echo "[start] Keycloak process exited before becoming ready, aborting"
    # wait pour récolter le code de sortie et éviter un zombie. || true car
    # le process est déjà mort, wait peut ne rien avoir à attendre.
    wait "$KC_PID" 2>/dev/null || true
    exit 1
  fi
  # Tant pis si Keycloak répond 404 sur / : ce qui compte c'est qu'il accepte
  # une connexion TCP et parle HTTP — preuve qu'il est prêt à servir.
  if curl -sS -o /dev/null "http://127.0.0.1:$INTERNAL_PORT/" 2>/dev/null; then
    echo "[start] Keycloak ready after ${i}s"
    break
  fi
  # Timeout dur à 5 min : au-delà c'est probablement un blocage, mieux vaut
  # faire échouer le boot pour que Scalingo retente.
  if [ "$i" -eq 300 ]; then
    echo "[start] Keycloak failed to become ready within 300s, aborting"
    kill -TERM "$KC_PID" 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

# --- 3. Démarrage du proxy en background -------------------------------------
echo "[start] launching acme-proxy on PORT=$PORT → http://127.0.0.1:$INTERNAL_PORT"
# Le proxy lit $PORT et $INTERNAL_PORT depuis l'env. Il est lancé en background
# (et non avec exec) pour qu'on puisse surveiller les deux process en parallèle.
node /app/acme-proxy/dist/server.mjs &
PROXY_PID=$!

# --- 4. Couplage des cycles de vie -------------------------------------------
# Quand Scalingo arrête le dyno, il envoie SIGTERM au PID 1 du container (ce
# script). Sans trap, bash le reçoit mais ne le propage pas aux enfants, qui
# seraient tués brutalement par SIGKILL après la grace period. On propage donc
# SIGTERM/SIGINT pour permettre un shutdown propre (Keycloak flush ses caches,
# le proxy ferme ses connexions HTTP/2).
shutdown() {
  # On désarme le trap pour éviter une boucle si shutdown est rappelé.
  trap - SIGTERM SIGINT EXIT
  echo "[start] shutdown signal received, terminating children"
  kill -TERM "$KC_PID" "$PROXY_PID" 2>/dev/null || true
  wait "$KC_PID" "$PROXY_PID" 2>/dev/null || true
}
trap shutdown SIGTERM SIGINT

# wait -n bloque jusqu'à ce que *n'importe lequel* des PID passés meure (vs.
# wait qui attend qu'ils meurent tous). C'est le coeur du couplage : dès qu'un
# des deux process tombe, on sort de l'attente.
# set +e/-e : wait -n renvoie le code de sortie de l'enfant mort, qui peut
# être non-zéro ; on ne veut pas que `set -e` nous fasse exit avant d'avoir
# capturé EXIT_CODE et nettoyé l'autre process.
set +e
wait -n "$KC_PID" "$PROXY_PID"
EXIT_CODE=$?
set -e

# Diagnostic : on regarde qui est encore vivant pour identifier le mort.
if ! kill -0 "$KC_PID" 2>/dev/null; then
  echo "[start] Keycloak exited (code=$EXIT_CODE), killing acme-proxy and aborting"
else
  echo "[start] acme-proxy exited (code=$EXIT_CODE), killing Keycloak and aborting"
fi

# Désarme le trap shutdown : on est déjà en train de tout fermer, pas besoin
# qu'il se redéclenche sur l'EXIT implicite ou un signal tardif.
trap - SIGTERM SIGINT
# Tue le survivant proprement (le mort est déjà mort, kill ne fait rien).
kill -TERM "$KC_PID" "$PROXY_PID" 2>/dev/null || true
wait "$KC_PID" "$PROXY_PID" 2>/dev/null || true
# Exit non-zéro → Scalingo détecte la mort du container et le redémarre.
# C'est l'effet recherché : on ne veut pas qu'un proxy orphelin continue à
# répondre 502 indéfiniment sans qu'on relance la plateforme.
exit "$EXIT_CODE"
