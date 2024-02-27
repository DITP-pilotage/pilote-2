set -o xtrace

cd /app

ls -al /app/data_management
ls -al /.env.review
echo $PGHOST
#exit 1

sleep 3
echo $CONTROL_DATABASE_URL
#psql  -c 'drop database if exists $PGDATABASE'

echo 'drop database if exists :"v1"' | psql -d $CONTROL_DATABASE_URL -v v1=$PGDATABASE
echo 'create database :"v1"' | psql -d $CONTROL_DATABASE_URL -v v1=$PGDATABASE

#/buildpack-node/bin/compile /app /tmp/cache /env
export PATH="/app/.scalingo/node/bin/":$PATH
# npm install

#/buildpack-python/bin/compile /app/data_management /tmp/cache /env
export PATH="/app/.scalingo/python/bin/":$PATH
echo $PATH
cd /app/data_management

#cp /.env.review .env
#source .env
echo $PGHOST
unset PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE
echo $PGHOST
PIPENV_DONT_LOAD_ENV=1 pipenv lock
PIPENV_DONT_LOAD_ENV=1 pipenv sync
PIPENV_DONT_LOAD_ENV=1 pipenv run echo $PGHOST
PIPENV_DONT_LOAD_ENV=1 pipenv run /bin/bash scripts/run_datajobs.sh

#npm run start
