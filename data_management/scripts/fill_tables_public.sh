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

dbt run --project-dir data_factory/ --select intermediate exposition
