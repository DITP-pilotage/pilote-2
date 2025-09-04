if [ "$NEXT_PUBLIC_FF_RAPPORT_PVA" == "true" ] && [ $ENVIRONMENT == "PROD" ]; then
  export NPM_CONFIG_PRODUCTION=false
  npm ci
  npx tsx scripts/rapportPropositionValeurAvancement.ts
fi
