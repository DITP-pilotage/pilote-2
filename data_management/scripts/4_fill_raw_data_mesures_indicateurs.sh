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

dbt run --project-dir data_factory --select seeds_
