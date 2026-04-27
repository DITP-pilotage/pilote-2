# Daily script to:
#   - reset the db
#   - run FULL_DJ datajobs
#   - run a dbt command (for example)
#   - exec descente de prod
#   - run PROD datajobs


echo ">> Reset db"
pnpm database:init

bash scripts/ddp_dump.sh
bash scripts/daily/jordan_only_restore.sh
