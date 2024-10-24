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

echo ">> Seeding database"
python3 load_ppg_metadata/load.py seeds
dbt run --project-dir data_factory --select seeds_.sql_incremental
