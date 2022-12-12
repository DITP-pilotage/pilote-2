#!/bin/bash

docker pull ghcr.io/dbt-labs/dbt-postgres:1.3.1

docker run -it --rm \
      --network=host \
      --mount type=bind,source=$(pwd)/data/pilote_data_jobs/transformations/ditp_ppg_dbt,target=/usr/app \
      --mount type=bind,source=$(pwd)/data/pilote_data_jobs/transformations/dbt_root,target=/root/.dbt/ \
      ghcr.io/dbt-labs/dbt-postgres:1.3.1 \
      run