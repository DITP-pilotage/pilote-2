# Daily script to:
#   - reset the db
#   - run FULL_DJ datajobs
#   - run a dbt command (for example)
#   - exec descente de prod
#   - run PROD datajobs
# 
# Warn: only with docker commands
# You can dupplicate this file and modify it to fit your local env (example: use docker only for data operations)


echo ">> Reset db"
docker compose run --rm pilote_webapp bash scripts/prisma_reset_and_migrate.sh
cd data_management
#echo ">> Run dj FULL"
#FULL_DJ=true docker compose run --rm -e FULL_DJ pilote_datajobs
echo ">> Run dbt command"
docker compose run --rm pilote_dbt dbt run --select barometre
echo ">> Run descente de prod"
cd ..
docker compose run --rm ddp bash docker/entrypoint.ddp.sh
echo ">> Run dj prod"
cd data_management
FULL_DJ=false docker compose run --rm -e FULL_DJ pilote_datajobs
echo ">> Restart db + webapp"
cd ..
docker compose restart
