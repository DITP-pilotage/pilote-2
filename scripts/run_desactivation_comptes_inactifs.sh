export NPM_CONFIG_PRODUCTION=false
npm ci
npx tsx scripts/desactivationComptesInactifs.ts
