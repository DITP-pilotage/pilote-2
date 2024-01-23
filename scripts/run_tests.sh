echo "Tests will run on db" $DATABASE_URL

npm --prefix /app install
npm --prefix /app run test:database:init
npm --prefix /app run test
