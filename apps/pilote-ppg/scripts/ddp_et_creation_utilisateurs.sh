dbclient-fetcher psql 16
/bin/bash scripts/ddp_dump.sh
/bin/bash scripts/ddp_restore.sh
/bin/bash scripts/anonymisation_utilisateurs.sh
pnpm install --frozen-lockfile
pnpm exec tsx scripts/seedUtilisateursTest.ts
