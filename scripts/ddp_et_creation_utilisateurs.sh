dbclient-fetcher psql 16
/bin/bash scripts/ddp_dump.sh
/bin/bash scripts/ddp_restore.sh
/bin/bash scripts/anonymisation_utilisateurs.sh
npm ci
npx tsx scripts/seedUtilisateursTest.ts
