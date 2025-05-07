dbclient-fetcher psql 16
/bin/bash scripts/ddp_dump.sh
/bin/bash scripts/ddp_restore.sh
npm ci
npx tsx scripts/seedUtilisateursTest.ts