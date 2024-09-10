#!/bin/bash

set -o errexit   # abort on nonzero exitstatus
set -o pipefail  # don't hide errors within pipes



## dbt docs
echo "-- [log] Chargement des variables d'env depuis le .env"
source .env
echo "-- [dbt.docs] Génération de la doc"
pipenv run dbt docs generate --profiles-dir . --project-dir data_factory/  --target-path /tmp/dbt_docs
cp -r /tmp/dbt_docs public/dbt_docs

# PROBLEME: les fichiers générés sont sur le conteneur des datajobs mais c'est le conteneur web qui en a besoin.
# Pas de communication entre ces deux sauf via la db.

# test
# docker run -it --rm -p 8080:80 -v "$PWD":/usr/local/apache2/htdocs/ httpd:2.4
