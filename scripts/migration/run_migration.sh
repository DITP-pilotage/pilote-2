#!/bin/bash

# Charger les variables d'environnement (si le fichier .env existe)
if [ -f .env ]; then
    # shellcheck disable=SC1091
    . .env
fi

# Vérifier qu'un argument est bien fourni
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <chemin_vers_fichier_sql>"
    exit 1
fi

# Utiliser le premier argument passé au script
fichier_sql="$1"

# Exécuter la commande psql avec le fichier SQL
psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f "$fichier_sql"
