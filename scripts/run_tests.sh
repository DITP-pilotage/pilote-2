echo "NPM_PREFIX is ${NPM_PREFIX:-./}"

[[ -f ".env" ]] && source .env # Source .env if exists
[[ -f ".env.test" ]] && source .env.test # Source .env.test if exists

echo "Tests will run on db" $DATABASE_URL

npm --prefix ${NPM_PREFIX:-./} install
npm --prefix ${NPM_PREFIX:-./} run test:database:init
npm --prefix ${NPM_PREFIX:-./} run test
