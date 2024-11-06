# Daily script to:
#   - reset the db
#   - run FULL_DJ datajobs
#   - run a dbt command (for example)
#   - exec descente de prod partielle
#   - run PROD datajobs
# 

echo ">> Reset db"
/bin/bash scripts/prisma_reset_and_migrate.sh
cd data_management
echo ">> Run dj FULL"
FULL_DJ=true pipenv run /bin/bash scripts/run_datajobs.sh
echo ">> Run descente de prod"
cd ..
pipenv run /bin/bash scripts/descente_de_prod_partielle.sh
echo ">> Run dj prod"
cd data_management
FULL_DJ=false pipenv run /bin/bash scripts/run_datajobs.sh
