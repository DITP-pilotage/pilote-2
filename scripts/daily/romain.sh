# Daily script to:
#   - reset the db
#   - exec descente de dev
#   - run datajobs with FULL_DJ=false



echo ">> Reset db"
npm run database:init-force

bash scripts/ddp_dump.sh
bash scripts/ddp_restore.sh
echo ">> Run dj prod"
cd data_management
FULL_DJ=false pipenv run python3 scripts/__main__.py
