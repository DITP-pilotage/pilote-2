#!/bin/bash

set -o errexit   # abort on nonzero exitstatus
set -o pipefail  # don't hide errors within pipes

echo ">> Init elementary"
dbt run --project-dir data_factory --select elementary
