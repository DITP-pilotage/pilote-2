#!/bin/bash

# Uniquement sur du local
if [ -z $PGHOST ] || [ -z $PGPORT ] || [ -z $PGUSER ] || [ -z $PGPASSWORD ] || [ -z $PGDATABASE ];
then
  if [ -f .env ];
  then
    source .env
  else
    echo "ERROR : .env does not exist. Cannot load variable DATABASE_URL. Exiting"
    exit 1
  fi
fi

dbt run --project-dir data_factory/ --select marts --full-refresh # TODO ne pas laisser en full refresh en production
