# Daily script to:
#   - reset the db
#   - run FULL_DJ datajobs
#   - run a dbt command (for example)
#   - exec descente de prod partielle
#   - run PROD datajobs
# 
# Warn: only with docker commands
# You can dupplicate this file and modify it to fit your local env (example: use docker only for data operations)


echo ">> Reset db"
bash scripts/prisma_reset_and_migrate.sh
cd data_management
echo ">> Run dj FULL"
FULL_DJ=true docker compose run --rm -e FULL_DJ pilote_datajobs
echo ">> Run descente de prod"
cd ..
pipenv run /bin/bash scripts/descente_de_prod_partielle.sh
echo ">> Run dj prod"
cd data_management
FULL_DJ=false docker compose run --rm -e FULL_DJ pilote_datajobs
