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
bash scripts/prisma_reset_and_migrate.sh
cd data_management
echo ">> Run dj FULL"
FULL_DJ=true docker compose run --rm -e FULL_DJ pilote_datajobs
echo ">> Prisma seed"
cd ..
bash scripts/ddp_dump.sh
bash scripts/ddp_restore.sh
# ou ddp via docker avec: "docker compose run --rm ddp bash docker/entrypoint.ddp.sh"
#   pré-requis: mettre des clés ssh dans pilote-2/docker (voir pilote-2/docker/.gitignore) 
#       pour que le tunnel vers la db soit fait dans le container (Colin)
echo ">> Run dj prod"
cd data_management
FULL_DJ=false docker compose run --rm -e FULL_DJ pilote_datajobs
