#!/bin/bash

set -o errexit   # abort on nonzero exitstatus
set -o pipefail  # don't hide errors within pipes

# Uniquement sur du local
if [[ -z $PGHOST ]] || [[ -z $PGPORT ]] || [[ -z $PGUSER ]] || [[ -z $PGPASSWORD ]] || [[ -z $PGDATABASE ]];
then
  if [ -f .env ];
  then
    source .env
  else
    echo "ERROR : .env does not exist. Cannot load PG variables. Exiting"
    exit 1
  fi
fi

rm -rf "$PPG_METADATA_DIRECTORY"
mkdir "$PPG_METADATA_DIRECTORY"
git clone "https://$PPG_METADATA_GITHUB_TOKEN@github.com/DITP-pilotage/PPG_metadata.git" "$PPG_METADATA_DIRECTORY" -b $PPG_METADATA_GITHUB_BRANCH --depth 1

dbt build --fail-fast --project-dir data_factory --select raw.ppg_metadata
