#!/bin/bash

# Uniquement sur du local
if [ -z $DATABASE_URL ] || [ -z $PGHOST ] || [ -z $PGPORT ] || [ -z $PGUSER ] || [ -z $PGPASSWORD ] || [ -z $PGDATABASE ] || [ -z $DUMP_DFAKTO_RP_RAW ] || [ -z $DUMP_DFAKTO_RP_VIEWS_DATA ] || [ -z $PPG_METADATA_VIEWS ] || [ -z $PPG_METADATA_MODELS ];
then
  if [ -f .env ];
  then
    export $(grep -v '^#' .env | xargs)
  else
    echo "ERROR : .env does not exist. Cannot load variable DATABASE_URL. Exiting"
    exit 1
  fi
fi


dbt run --project-dir pilote_data_jobs/transformations/ditp_ppg_dbt/ --profiles-dir pilote_data_jobs/transformations/dbt_root/ --select raw staging
