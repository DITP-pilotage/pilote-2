#!/bin/bash

# Uniquement sur du local
if [ -z "$DATABASE_URL" ] || [ -z "$INPUT_DATA_INDICATEURS" ];
then
  if [ -f .env ];
  then
    export $(grep -v '^#' .env | xargs)
  else
    echo "ERROR : .env does not exist. Cannot load variable DATABASE_URL or INPUT_DATA_INDICATEURS. Exiting"
    exit 1
  fi
fi


# Creation de la table temporaire pour charger les données en base dans la table temp_metric_indicateur
psql "$DATABASE_URL" -c "CREATE TABLE raw_data.temp_metric_indicateur (
    indic_id      TEXT,
    zone_id       TEXT,
    metric_date   TEXT,
    metric_type   TEXT,
    metric_value  TEXT
);"

# Remplissage de la table temporaire avec les dernières données indicateurs
psql "$DATABASE_URL" -c "copy raw_data.temp_metric_indicateur from STDIN with csv delimiter ',' header;" < "$INPUT_DATA_INDICATEURS"/pass_culture_indic_046.csv

# Si n'existe pas, création de la table fait_indicateurs
psql "$DATABASE_URL" -c "CREATE SCHEMA IF NOT EXISTS marts"
psql "$DATABASE_URL" -c "CREATE TABLE IF NOT EXISTS marts.fait_indicateurs (
    id            TEXT NOT NULL,
    indic_id      TEXT NOT NULL,
    zone_id       TEXT NOT NULL,
    metric_date   DATE NOT NULL,
    metric_type   TEXT NOT NULL,
    metric_value  INTEGER NOT NULL,
    import_date   TIMESTAMP NOT NULL
);"

dbt run --project-dir pilote_data_jobs/transformations/ditp_ppg_dbt/ --profiles-dir pilote_data_jobs/transformations/dbt_root/ --select datamarts

psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS raw_data.temp_metric_indicateur"
