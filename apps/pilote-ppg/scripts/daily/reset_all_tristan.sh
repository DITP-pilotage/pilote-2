# Daily script to:
#   - reset the db
#   - run FULL_DJ datajobs
#   - run a dbt command (for example)
#   - exec descente de prod
#   - run PROD datajobs
# 

echo ">> Reset db"
pnpm database:init
cd apps/pilote-ppg
echo ">> Descente de prod"
bash scripts/ddp_dump.sh
bash scripts/ddp_restore.sh
bash scripts/anonymisation_utilisateurs.sh
echo ">> Run dj prod"
cd ../pilote-ppg-data-management
FULL_DJ=false UV_ENV_FILE=.env uv run python3 scripts/__main__.py
