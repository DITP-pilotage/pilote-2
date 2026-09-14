#!/usr/bin/env bash
set -euo pipefail

# Scalingo positionne HOSTNAME au nom du conteneur, que le serveur standalone de
# Next.js utilise comme adresse d'écoute. Ce nom résout vers deux IP (réseau
# Scalingo et bridge Docker) dans un ordre non déterministe : Next n'écoute alors
# que sur l'une des deux, et le déploiement échoue en « took more than 60 seconds
# to boot » quand ce n'est pas celle sondée par la plateforme.
export HOSTNAME=0.0.0.0

exec node --max-old-space-size=${MAX_OLD_SPACE_SIZE:-768} apps/pilote-ppg/.next/standalone/apps/pilote-ppg/server.js
