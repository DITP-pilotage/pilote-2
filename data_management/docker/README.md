
# Commandes data Docker 

Commandes utiles:

```sh
# Exécuter une commande dbt
docker compose run --rm pilote_dbt dbt run --select barometre
dbt run --select barometre

# Exécuter les datajobs
docker compose run --rm pilote_datajobs
pipenv run /bin/bash scripts/run_datajobs.sh

# Exécuter les datajobs en mode FULL_DJ
docker compose run --rm -e FULL_DJ=true pilote_datajobs
FULL_DJ=true pipenv run /bin/bash scripts/run_datajobs.sh

# Exécuter un script
docker compose run --rm pilote_datajobs scripts/2_seed_ppg_metadata.sh
pipenv run /bin/bash scripts/2_seed_ppg_metadata.sh

# Exécuter une descnte de prod
docker compose run --rm pilote_datajobs scripts/descente_de_prod_partielle.sh
pipenv run /bin/bash scripts/descente_de_prod_partielle.sh

```


