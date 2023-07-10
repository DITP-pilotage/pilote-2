#!/bin/env bash

set -o errexit   # abort on nonzero exitstatus
set -o pipefail  # don't hide errors within pipes

# Uniquement sur du local
if [[ -z $SSH_KEY_INGEST_DATA_DFAKTO ]] || [[ -z $URL_INGEST_DFAKTO ]] || [[ -z $PGHOST ]] || [[ -z $PGPORT ]] || [[ -z $PGUSER ]] || [[ -z $PGPASSWORD ]] || [[ -z $PGDATABASE ]];
then
  if [ -f .env ];
  then
    source .env
  else
    echo "ERROR : .env does not exist. Cannot load variable SSH_KEY_INGEST_DATA_DFAKTO. Exiting"
    exit 1
  fi
fi

TEMP_DIR=input_data/temp

mkdir -p $TEMP_DIR
mkdir -p ~/.ssh

echo "$SSH_KEY_INGEST_DATA_DFAKTO" > input_data/temp/id_ed25519
chmod 600 input_data/temp/id_ed25519

cmd_retrieve_files=$(cat <<EOF
get dim_periods.csv $TEMP_DIR
get dim_structures.csv $TEMP_DIR
get dim_tree_nodes.csv $TEMP_DIR
get fact_financials_lite.csv $TEMP_DIR
get fact_progress.csv $TEMP_DIR
get fact_progress_chantier.csv $TEMP_DIR
EOF
)

ssh-keyscan -p 2022 -H $URL_INGEST_DFAKTO >> ~/.ssh/known_hosts

echo "Recupération des données des chantiers"
echo -e "$cmd_retrieve_files" | sftp -oPort=2022 -i $TEMP_DIR/id_ed25519 "$USER_INGEST_CHANTIER_DFAKTO@$URL_INGEST_DFAKTO"

cmd_retrieve_files_projets_structurants=$(cat <<EOF
get fact_progress_kpis.csv $TEMP_DIR
get fact_progress_project.csv $TEMP_DIR
get dim_tree_nodes.csv $TEMP_DIR/dim_tree_nodes_ps.csv
get ps_view_data_kpis.csv $TEMP_DIR
get ps_view_data_financials.csv $TEMP_DIR
get fact_property_values.csv $TEMP_DIR
EOF
)

echo "Recupération des données des projets structurants"
echo -e "$cmd_retrieve_files_projets_structurants" | sftp -oPort=2022 -i $TEMP_DIR/id_ed25519 "$USER_INGEST_PROJET_DFAKTO@$URL_INGEST_DFAKTO"

PROJECT_DIR=data_factory
dbt run --project-dir $PROJECT_DIR --select raw.dfakto
