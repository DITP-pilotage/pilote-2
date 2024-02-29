set -o xtrace

source .env
echo 'drop database if exists :"v1"' | psql -d $CONTROL_DATABASE_URL -v v1=$PGDATABASE
echo 'create database :"v1"' | psql -d $CONTROL_DATABASE_URL -v v1=$PGDATABASE

# TODO: curl S3 endpoint to get env file
#echo "" > .env

sed -i 's/FORCE_ENVIRONMENT_DATAJOBS=.*/FORCE_ENVIRONMENT_DATAJOBS=LOCAL/g' .env
pipenv run /bin/bash scripts/run_datajobs.sh

#TODO: descente de prod

sed -i 's/FORCE_ENVIRONMENT_DATAJOBS=.*/FORCE_ENVIRONMENT_DATAJOBS=DEV/g' .env
pipenv run /bin/bash scripts/run_datajobs.sh

cd ..
npm run start
