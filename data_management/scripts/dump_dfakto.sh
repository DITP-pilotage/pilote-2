#!/bin/env bash

# Uniquement sur du local
if [[ -z $SSH_KEY_INGEST_DATA_DFAKTO ]] || [[ -z $URL_INGEST_CHANTIER_DFAKTO ]] || [[ -z $PGHOST ]] || [[ -z $PGPORT ]] || [[ -z $PGUSER ]] || [[ -z $PGPASSWORD ]] || [[ -z $PGDATABASE ]];
then
  if [ -f .env ];
  then
    source .env
  else
    echo "ERROR : .env does not exist. Cannot load variable SSH_KEY_INGEST_DATA_DFAKTO. Exiting"
    exit 1
  fi
fi

mkdir -p input_data/temp

echo "$SSH_KEY_INGEST_DATA_DFAKTO" > input_data/temp/id_ed25519
chmod 600 input_data/temp/id_ed25519

cmd_retrieve_files=$(cat <<EOF
get dim_periods.csv input_data/temp/
get dim_structures.csv input_data/temp/
get dim_tree_nodes.csv input_data/temp/
get fact_financials.csv input_data/temp/
get fact_progress.csv input_data/temp/
get fact_progress_chantier.csv input_data/temp/
EOF
)

ssh-keyscan -p 2022 -H $URL_INGEST_CHANTIER_DFAKTO >> ~/.ssh/known_hosts

echo -e "$cmd_retrieve_files" | sftp -oPort=2022 -i input_data/temp/id_ed25519 "$USER_INGEST_CHANTIER_DFAKTO@$URL_INGEST_CHANTIER_DFAKTO"

dbt run --project-dir data_factory/ --select raw.dfakto
