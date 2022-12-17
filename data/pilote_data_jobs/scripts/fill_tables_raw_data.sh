#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "No arguments supplied : running job on open_data"
    FOLDER="open_data"
else
    FOLDER=$1
fi

# Uniquement sur du local
if [ -z $DATABASE_URL ];
then
  if [ -f .env ];
  then
    export $(grep -v '^#' .env | xargs)
  else
    echo "ERROR : .env does not exist. Cannot load variable DATABASE_URL. Exiting"
    exit 1
  fi
fi

psql $DATABASE_URL -c "truncate table raw_data.metadata_chantier"
psql $DATABASE_URL -c "truncate table raw_data.metadata_perimetre"

# TODO : attention au chemin des fichiers qui casse la commande npm
psql $DATABASE_URL -c "copy raw_data.metadata_chantier from STDIN with csv delimiter ',' header;" < input_data/$FOLDER/PPG_metadata/views/chantier/view_meta_chantier.csv
psql $DATABASE_URL -c "copy raw_data.metadata_perimetre from STDIN with csv delimiter ',' header;" < input_data/$FOLDER/PPG_metadata/views/perimetre/view_meta_perimetre.csv
