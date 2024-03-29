#!/bin/bash

set -o errexit   # abort on nonzero exitstatus
set -o pipefail  # don't hide errors within pipes

# Uniquement sur du local
if [[ -z $SSH_KEY_INGEST_DATA_DFAKTO ]] || [[ -z $URL_INGEST_DFAKTO ]] || [[ -z $PGHOST ]] || [[ -z $PGPORT ]] || [[ -z $PGUSER ]] || [[ -z $PGPASSWORD ]] || [[ -z $PGDATABASE ]];
then
  if [ -f .env ];
  then
    source .env
  else
    echo "ERROR : .env does not exist. Cannot load variable SSH_KEY_INGEST_DATA_DFAKTO. Exiting"
    exit 1
  fi
fi

echo ">> Run dbt deps && init elementary"
dbt deps --project-dir data_factory
dbt run --project-dir data_factory --select elementary
