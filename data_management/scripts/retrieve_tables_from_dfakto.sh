#!/bin/bash

# Uniquement sur du local
if [ -z $PASSWORD_DFAKTO_DATABASE ] || [ -z $DFAKTO_DATABASE_USER ] || [ -z $DFAKTO_DATABASE_SCHEMA ] || [ -z $DFAKTO_DATABASE_DBNAME ] || [ -z $DFAKTO_DATABASE_HOST ] || [ -z $DFAKTO_DATABASE_PORT ] ;
then
  if [ -f .env ];
  then
    export $(grep -v '^#' .env | xargs)
  else
    echo "ERROR : .env does not exist. Cannot load variable DATABASE_URL. Exiting"
    exit 1
  fi
fi

echo "INFO : Récupération des données de DFAKTO"

if [ $ENVIRONMENT = 'PROD' ] ;
then
  mkdir tmp
  psql "sslmode=require host=$DFAKTO_DATABASE_HOST port=$DFAKTO_DATABASE_PORT user=$DFAKTO_DATABASE_USER dbname=$DFAKTO_DATABASE_DBNAME password=$DFAKTO_DATABASE_PASSWORD" -c "\copy (select * from $DFAKTO_DATABASE_SCHEMA_IM_PROPILOT.dim_structures) TO 'tmp/dim_structures.csv' with csv header"
  psql "sslmode=require host=$DFAKTO_DATABASE_HOST port=$DFAKTO_DATABASE_PORT user=$DFAKTO_DATABASE_USER dbname=$DFAKTO_DATABASE_DBNAME password=$DFAKTO_DATABASE_PASSWORD" -c "\copy (select * from $DFAKTO_DATABASE_SCHEMA_IM_PROPILOT.dim_tree_nodes) TO 'tmp/dim_tree_nodes.csv' with csv header"
  psql "sslmode=require host=$DFAKTO_DATABASE_HOST port=$DFAKTO_DATABASE_PORT user=$DFAKTO_DATABASE_USER dbname=$DFAKTO_DATABASE_DBNAME password=$DFAKTO_DATABASE_PASSWORD" -c "\copy (select * from $DFAKTO_DATABASE_SCHEMA_IM_PROPILOT.dim_effects) TO 'tmp/dim_effects.csv' with csv header"
  psql "sslmode=require host=$DFAKTO_DATABASE_HOST port=$DFAKTO_DATABASE_PORT user=$DFAKTO_DATABASE_USER dbname=$DFAKTO_DATABASE_DBNAME password=$DFAKTO_DATABASE_PASSWORD" -c "\copy (select * from $DFAKTO_DATABASE_SCHEMA_IM_PROPILOT.fact_financials) TO 'tmp/fact_financials.csv' with csv header"
  psql "sslmode=require host=$DFAKTO_DATABASE_HOST port=$DFAKTO_DATABASE_PORT user=$DFAKTO_DATABASE_USER dbname=$DFAKTO_DATABASE_DBNAME password=$DFAKTO_DATABASE_PASSWORD" -c "\copy (select * from $DFAKTO_DATABASE_SCHEMA_IM.fact_progress_chantier) TO 'tmp/fact_progress_chantier.csv' with csv header"
  psql "sslmode=require host=$DFAKTO_DATABASE_HOST port=$DFAKTO_DATABASE_PORT user=$DFAKTO_DATABASE_USER dbname=$DFAKTO_DATABASE_DBNAME password=$DFAKTO_DATABASE_PASSWORD" -c "\copy (select * from $DFAKTO_DATABASE_SCHEMA_IM.fact_progress) TO 'tmp/fact_progress.csv' with csv header"
fi
