#!/bin/bash

# Uniquement sur du local
if [ -z $DATABASE_URL ] || [ -z $PGHOST ] || [ -z $PGPORT ] || [ -z $PGUSER ] || [ -z $PGPASSWORD ] || [ -z $PGDATABASE ] || [ -z $DUMP_DFAKTO_RP_VIEWS_DATA ] || [ -z $DUMP_DFAKTO_2 ] || [ -z $PPG_METADATA_VIEWS ] || [ -z $PPG_METADATA_MODELS ];
then
  if [ -f .env ];
  then
    source .env
  else
    echo "ERROR : .env does not exist. Cannot load variable DATABASE_URL. Exiting"
    exit 1
  fi
fi

dbt run --project-dir data_factory/ --select raw.import_commentaires
