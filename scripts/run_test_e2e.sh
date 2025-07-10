if [ $ENVIRONMENT == "E2E" ]; then
  export NPM_CONFIG_PRODUCTION=false
  npm ci
  npx playwright test --workers 1 --reporter=null
fi
