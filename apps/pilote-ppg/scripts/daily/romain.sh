# Daily script to:
#   - reset the db
#   - exec descente de dev
#   - run datajobs with FULL_DJ=false

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ">> Reset db"
pnpm database:init-force
cd "$SCRIPT_DIR"/../..
bash scripts/ddp_dump.sh
bash scripts/ddp_restore.sh
echo ">> Run dj prod"
cd "$SCRIPT_DIR"/../../../pilote-ppg-data-management
UV_ENV_FILE=.env FULL_DJ=false uv run python3 scripts/__main__.py
