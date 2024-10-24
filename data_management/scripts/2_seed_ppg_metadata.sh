#!/bin/bash

set -o errexit   # abort on nonzero exitstatus
set -o pipefail  # don't hide errors within pipes

# Uniquement sur du local
if [[ -z $PGHOST ]] || [[ -z $PGPORT ]] || [[ -z $PGUSER ]] || [[ -z $PGPASSWORD ]] || [[ -z $PGDATABASE ]];
then
  if [ -f .env ];
  then
    source .env
  else
    echo "ERROR : .env does not exist. Cannot load PG variables. Exiting"
    exit 1
  fi
fi

python3 load_ppg_metadata/load.py ppg_metadata
dbt run --project-dir data_factory --select raw.ppg_metadata.metadata_indicateurs
