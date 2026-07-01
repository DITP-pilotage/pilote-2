# Daily script to:
#   - reset the db
#   - exec descente de dev
#   - run datajobs with FULL_DJ=false
# 
# Warn: only with docker commands


echo ">> Reset db"
pnpm database:init-force

bash scripts/ddp_dump.sh
bash scripts/ddp_restore.sh
echo ">> Run dj prod"
cd ../pilote-ppg-data-management
FULL_DJ=false uv run python3 scripts/__main__.py
