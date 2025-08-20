source .env
psql "$DATABASE_URL" -f "scripts/rattrapage_evenements_va/rattrapage.sql"
