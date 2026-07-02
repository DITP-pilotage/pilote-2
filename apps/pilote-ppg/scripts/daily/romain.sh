# Daily script to:
#   - reset the db
#   - exec descente de dev
#   - run datajobs with FULL_DJ=false


echo ">> Reset db"
pnpm database:init-force

bash scripts/ddp_dump.sh
bash scripts/ddp_restore.sh
echo ">> Run dj prod"
cd ../pilote-ppg-data-management
UV_ENV_FILE=.env FULL_DJ=false uv run python3 scripts/__main__.py
