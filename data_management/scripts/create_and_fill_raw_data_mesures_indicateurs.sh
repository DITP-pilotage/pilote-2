#!/bin/bash

# Uniquement sur du local
if [ -z $DATABASE_URL ] || [ -z $INPUT_DATA_INDICATEURS ];
then
  if [ -f .env ];
  then
    export $(grep -v '^#' .env | xargs)
  else
    echo "ERROR : .env does not exist. Cannot load variable DATABASE_URL. Exiting"
    exit 1
  fi
fi

# 1er hypothèse : on prend l'hypothèse que les données sont validées dans le front et le back de la data factory
#  c-a-d que si les données arrivent dans la table raw_data.mesure_indicateur, elles sont valides
# 2nd hypothèse : le format n'est pas encore défini (a ajuster en amont de cette étape ou dans l'état staging)
# Creation de la table temporaire pour charger les données en base dans la table temp_metric_indicateur

#psql "$DATABASE_URL" -c "TRUNCATE TABLE raw_data.mesure_indicateur"
#psql "$DATABASE_URL" -c "ALTER TABLE raw_data.mesure_indicateur DROP COLUMN id"
#psql "$DATABASE_URL" -c "ALTER TABLE raw_data.mesure_indicateur ADD COLUMN id UUID DEFAULT (gen_random_uuid())"

# Remplissage de la table avec les dernières données indicateurs
#  Fichier de tests
#psql "$DATABASE_URL" -c "copy raw_data.mesure_indicateur (indic_id, zone_id, metric_date, metric_type, metric_value) from STDIN with csv delimiter ',' header;" < "$INPUT_DATA_INDICATEURS"/pass_culture_indic_test.csv
#psql "$DATABASE_URL" -c "copy raw_data.mesure_indicateur (indic_id, zone_id, metric_date, metric_type, metric_value) from STDIN with csv delimiter ',' header;" < "$INPUT_DATA_INDICATEURS"/pass_culture_indic_with_dept_and_reg.csv

#  Quelques fichiers de prod
#psql "$DATABASE_URL" -c "copy raw_data.mesure_indicateur (indic_id, zone_id, metric_date, metric_type, metric_value) from STDIN with csv delimiter ',' header;" < "$INPUT_DATA_INDICATEURS"/data_import1_IND-228.csv
#psql "$DATABASE_URL" -c "copy raw_data.mesure_indicateur (indic_id, zone_id, metric_date, metric_type, metric_value) from STDIN with csv delimiter ',' header;" < "$INPUT_DATA_INDICATEURS"/data_import1_IND-229.csv
#psql "$DATABASE_URL" -c "copy raw_data.mesure_indicateur (indic_id, zone_id, metric_date, metric_type, metric_value) from STDIN with csv delimiter ',' header;" < "$INPUT_DATA_INDICATEURS"/data_import1_IND-230.csv
#psql "$DATABASE_URL" -c "copy raw_data.mesure_indicateur (indic_id, zone_id, metric_date, metric_type, metric_value) from STDIN with csv delimiter ',' header;" < "$INPUT_DATA_INDICATEURS"/data_import1_IND-243.csv

#  Tous les fichiers
for f in "$INPUT_DATA_INDICATEURS"/*; do
  case $f in
    *IND-[0-9]*.csv)
      psql "$DATABASE_URL" -c "copy raw_data.mesure_indicateur (indic_id, zone_id, metric_date, metric_type, metric_value) from STDIN with csv delimiter ',' header;" < $f
      ;;
  esac
done

# Si n'existe pas, création de la table fait_indicateurs
#psql "$DATABASE_URL" -c "CREATE SCHEMA IF NOT EXISTS marts"
#psql "$DATABASE_URL" -c "CREATE TABLE IF NOT EXISTS marts.fait_indicateurs (
#    id            TEXT NOT NULL,
#    indic_id      TEXT NOT NULL,
#    zone_id       TEXT NOT NULL,
#    metric_date   DATE NOT NULL,
#    metric_type   TEXT NOT NULL,
#    metric_value  INTEGER NOT NULL,
#    import_date   TIMESTAMP NOT NULL
#);"
#
#dbt run --project-dir pilote_data_jobs/transformations/ditp_ppg_dbt/ --profiles-dir pilote_data_jobs/transformations/dbt_root/ --select datamarts
#
#psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS raw_data.mesures_indicateurs"
