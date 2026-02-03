#!/bin/bash
if [ "$NEXT_PUBLIC_FF_RAPPORT_COORDINATEURS" == "true" ] && [ "$ENVIRONMENT" == "PROD" ]; then
  export NPM_CONFIG_PRODUCTION=false
  npm ci
  npx tsx scripts/rapportHebdomadaireCoordinateurs.ts
fi
