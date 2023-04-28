#!/bin/bash

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
