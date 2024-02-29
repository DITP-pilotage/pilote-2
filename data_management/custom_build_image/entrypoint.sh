set -o xtrace

source .env
echo 'drop database if exists :"v1"' | psql -d $CONTROL_DATABASE_URL -v v1=$PGDATABASE
echo 'create database :"v1"' | psql -d $CONTROL_DATABASE_URL -v v1=$PGDATABASE

# TODO: curl S3 endpoint to get env file
#echo "" > .env

pipenv run /bin/bash scripts/run_datajobs.sh

cd ..
npm run start
