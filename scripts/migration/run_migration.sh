#!/bin/bash

# Charger les variables d'environnement
source .env

# Vérifier qu'un argument est bien fourni
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <chemin_vers_fichier_sql>"
    exit 1
fi

# Utiliser le premier argument passé au script
fichier_sql="$1"

# Exécuter la commande psql avec le fichier SQL
psql "$DATABASE_URL" -f "$fichier_sql"