# Daily script to:
#   - reset the db
#   - run FULL_DJ datajobs
#   - run a dbt command (for example)
#   - exec descente de prod
#   - run PROD datajobs
# 

echo ">> Reset db"
npm run database:init
# npm run database:init-force pour éviter le prompt :p (Colin)
echo ">> Descente de prod"
bash scripts/ddp_dump.sh
bash scripts/ddp_restore.sh
bash scripts/anonymisation_utilisateurs.sh
echo ">> Run dj prod"
cd data_management
FULL_DJ=false pipenv run /bin/bash scripts/run_datajobs.sh
