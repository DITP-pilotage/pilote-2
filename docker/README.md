

Pour n'importe quelle commande
docker compose run --rm pilote_webapp npm run lint
Reset la db
docker compose run --rm pilote_webapp /bin/bash scripts/prisma_reset_and_migrate.sh
ou /bin/bash scripts/prisma_reset_and_migrate.sh


commande DJ
cd data_management
docker compose run --rm pilote_dbt dbt run --select barometre


