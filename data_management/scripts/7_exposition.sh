#!/bin/bash

set -o errexit   # abort on nonzero exitstatus
set -o pipefail  # don't hide errors within pipes

# Uniquement sur du local
if [ -z $PGHOST ] || [ -z $PGPORT ] || [ -z $PGUSER ] || [ -z $PGPASSWORD ] || [ -z $PGDATABASE ];
then
  if [ -f .env ];
  then
    source .env
  else
    echo "ERROR : .env does not exist. Cannot load PG variables. Exiting"
    exit 1
  fi
fi

dbt run --select intermediate

psql "$DATABASE_URL" -f scripts/sql/1_set_flag_true.sql 

dbt run --select exposition df3 barometre

if [ $? -eq 0 ]; then
  psql "$DATABASE_URL" -f scripts/sql/2_delete_flag_true.sql 

else
  echo "dbt job failed. Skipping delete queries."
fi
