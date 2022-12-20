#!/bin/bash

# Uniquement sur du local
if [ -z $PGHOST ] || [ -z $PGPORT ] || [ -z $PGUSER ] || [ -z $PGPASSWORD ] || [ -z $PGDATABASE ];
then
  if [ -f .env ];
  then
    export $(grep -v '^#' .env | xargs)
  else
    echo "ERROR : .env does not exist. Cannot load variable DATABASE_URL. Exiting"
    exit 1
  fi
fi

# TODO : attention au chemin des fichier qui casse la commande npm
dbt run --project-dir pilote_data_jobs/transformations/ditp_ppg_dbt/ --profiles-dir pilote_data_jobs/transformations/dbt_root/

psql -f pilote_data_jobs/transformations/indicateur/brute_vers_public.sql
