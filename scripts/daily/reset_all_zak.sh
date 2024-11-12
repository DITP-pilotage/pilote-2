# Daily script to:
#   - reset the db
#   - run FULL_DJ datajobs
#   - exec descente de prod DUMP
#   - exec descente de prod RESTORE
#   - run PROD datajobs
# 

echo ">> Reset db"
bash scripts/prisma_reset_and_migrate.sh
cd data_management
echo ">> Run dj FULL"
FULL_DJ=true pipenv run bash scripts/run_datajobs.sh
echo ">> Run descente de prod"
cd ..
bash scripts/ddp_dump.sh
bash scripts/ddp_restore.sh
echo ">> Run dj prod"
cd data_management
FULL_DJ=false pipenv run bash scripts/run_datajobs.sh
