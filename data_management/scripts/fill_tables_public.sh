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

PROJECT_DIR=data_factory
dbt deps --project-dir $PROJECT_DIR

psql "$DATABASE_URL" -c "TRUNCATE TABLE public.axe"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.perimetre"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.ppg"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.chantier"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.indicateur"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.ministere CASCADE"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.projet_structurant"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.indicateur_projet_structurant"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.objectif_projet_structurant"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.commentaire_projet_structurant"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.perimetre_projet_structurant"

dbt run --project-dir $PROJECT_DIR --select intermediate exposition
