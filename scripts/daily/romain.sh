# Daily script to:
#   - reset the db
#   - exec descente de dev
#   - run datajobs with FULL_DJ=false
# 
# Warn: only with docker commands


echo ">> Reset db"
npm run database:init-force

bash scripts/ddp_dump.sh
bash scripts/ddp_restore.sh
echo ">> Run dj prod"
cd data_management
FULL_DJ=false docker compose run --rm -e FULL_DJ pilote_datajobs
