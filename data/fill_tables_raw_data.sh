#!/bin/bash

export $(grep -v '^#' .env | xargs)

psql $DATABASE_URL -c "truncate table raw_data.metadata_chantier"
psql $DATABASE_URL -c "truncate table raw_data.metadata_perimetre"

psql $DATABASE_URL -c "copy raw_data.metadata_chantier from STDIN with csv delimiter ',' header;" < data/input_data/PPG_metadata/views/chantier/view_meta_chantier.csv
psql $DATABASE_URL -c "copy raw_data.metadata_perimetre from STDIN with csv delimiter ',' header;" < data/input_data/PPG_metadata/views/perimetre/view_meta_perimetre.csv
