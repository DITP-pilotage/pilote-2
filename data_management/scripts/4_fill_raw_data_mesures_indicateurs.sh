#!/bin/bash

# Uniquement sur du local
if [ -z $DATABASE_URL ] || [ -z $INPUT_DATA_INDICATEURS ];
then
  if [ -f .env ];
  then
    source .env
  else
    echo "ERROR : .env does not exist. Cannot load variable DATABASE_URL. Exiting"
    exit 1
  fi
fi

# 1er hypothèse : on prend l'hypothèse que les données sont validées dans le front et le back de la data factory
#  c-a-d que si les données arrivent dans la table raw_data.mesure_indicateur, elles sont valides
# 2nd hypothèse : le format n'est pas encore défini (a ajuster en amont de cette étape ou dans l'état staging)
# Creation de la table temporaire pour charger les données en base dans la table temp_metric_indicateur

psql "$DATABASE_URL" -c "TRUNCATE TABLE utilisateur, rapport_import_mesure_indicateur, raw_data.mesure_indicateur CASCADE"

# Remplissage de la table avec les dernières données indicateurs
psql "$DATABASE_URL" -c "copy utilisateur (id ,email, nom, prenom, profil_code, auteur_modification, date_modification, fonction) from STDIN with csv delimiter ',' header;" < input_data/private_data/private_seeds/utilisateur_uuid.csv
psql "$DATABASE_URL" -c "copy rapport_import_mesure_indicateur (id, date_creation, utilisateur_email, est_valide) from STDIN with csv delimiter ',' header;" < input_data/private_data/private_seeds/rapport_import_mesure_indicateur_uuid.csv
psql "$DATABASE_URL" -c "copy raw_data.mesure_indicateur (date_import, indic_id,  metric_date, metric_type, metric_value, zone_id, id, rapport_id) from STDIN with csv delimiter ',' header;" < input_data/private_data/private_seeds/valeurs-sample-uuid.csv

replace with dbt run -s seed