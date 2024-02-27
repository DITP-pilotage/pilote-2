set -o xtrace

sleep 3
echo $CONTROL_DATABASE_URL
#psql  -c 'drop database if exists $PGDATABASE'

echo 'drop database if exists :"v1"' | psql -d $CONTROL_DATABASE_URL -v v1=$PGDATABASE
echo 'create database :"v1"' | psql -d $CONTROL_DATABASE_URL -v v1=$PGDATABASE

pipenv run /bin/bash scripts/run_datajobs.sh

cd ..
npm run start
