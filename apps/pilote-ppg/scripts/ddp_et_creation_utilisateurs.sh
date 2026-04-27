dbclient-fetcher psql 16
cd apps/pilote-ppg
/bin/bash scripts/ddp_dump.sh
/bin/bash scripts/ddp_restore.sh
/bin/bash scripts/anonymisation_utilisateurs.sh
curl -X POST \
  -H "Authorization: Bearer ${CRON_AUTH_SECRET}" \
  "${APP_URL}/api/admin/unitaire/seed-utilisateurs-test" \
  | cat
