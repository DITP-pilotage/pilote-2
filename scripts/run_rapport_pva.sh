# Vérifier si la date est le 09/06/2025 (A supprimer)
if [ "$(date +\%Y-\%m-\%d)" == "2025-06-09" ]; then
  echo "Tâche ignorée le 9 juin 2025"
  exit 0
fi

if [ $ENVIRONMENT == "PROD" ]; then
  export NPM_CONFIG_PRODUCTION=false
  npm ci
  npx tsx scripts/rapportPropositionValeurAvancement.ts
fi
