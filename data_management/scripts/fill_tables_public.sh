#!/bin/bash

# Uniquement sur du local
if [ -z $PGHOST ] || [ -z $PGPORT ] || [ -z $PGUSER ] || [ -z $PGPASSWORD ] || [ -z $PGDATABASE ];
then
  if [ -f .env ];
  then
    export $(grep -v '^#' .env | xargs)
  else
    echo "ERROR : .env does not exist. Cannot load variable DATABASE_URL. Exiting"
    exit 1
  fi
fi

# TODO: supprimer le truncate de commenantaire
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.commentaire"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.synthese_des_resultats"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.axe"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.perimetre"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.ppg"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.chantier"
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.indicateur"

dbt run --project-dir data_factory/ --select intermediate marts
