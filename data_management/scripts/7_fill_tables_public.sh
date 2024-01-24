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

psql "$DATABASE_URL" -c "UPDATE public.axe SET a_supprimer = TRUE"
psql "$DATABASE_URL" -c "UPDATE public.perimetre SET a_supprimer = TRUE"
psql "$DATABASE_URL" -c "UPDATE public.ppg SET a_supprimer = TRUE"
psql "$DATABASE_URL" -c "UPDATE public.chantier SET a_supprimer = TRUE"
psql "$DATABASE_URL" -c "UPDATE public.indicateur SET a_supprimer = TRUE"
psql "$DATABASE_URL" -c "UPDATE public.ministere SET a_supprimer = TRUE"

PROJECT_DIR=data_factory
dbt run --project-dir $PROJECT_DIR --select intermediate exposition df3 --exclude raw.dfakto+

if [ $? -eq 0 ]; then
  psql "$DATABASE_URL" -c "DELETE FROM public.axe WHERE a_supprimer = TRUE"
  psql "$DATABASE_URL" -c "DELETE FROM public.perimetre WHERE a_supprimer = TRUE"
  psql "$DATABASE_URL" -c "DELETE FROM public.ppg WHERE a_supprimer = TRUE"
  psql "$DATABASE_URL" -c "DELETE FROM public.chantier WHERE a_supprimer = TRUE"
  psql "$DATABASE_URL" -c "DELETE FROM public.indicateur WHERE a_supprimer = TRUE"
  psql "$DATABASE_URL" -c "DELETE FROM public.ministere WHERE a_supprimer = TRUE"
  # Add similar delete queries for other tables if needed
else
  echo "dbt job failed. Skipping delete queries."
fi
