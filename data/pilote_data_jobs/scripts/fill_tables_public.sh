#!/bin/bash

# Uniquement sur du local
if [ -z $PG_HOST ] || [ -z $PG_PORT ] || [ -z $PG_USER ] || [ -z $PG_PASSWORD ] || [ -z $PG_DATABASE ];
then
  export $(grep -v '^#' .env | xargs)
fi

# TODO : attention au chemin des fichier qui casse la commande npm
dbt run --project-dir pilote_data_jobs/transformations/ditp_ppg_dbt/ --profiles-dir pilote_data_jobs/transformations/dbt_root/
