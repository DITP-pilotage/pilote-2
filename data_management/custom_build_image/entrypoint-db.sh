set -o xtrace

echo $CONTROL_DATABASE_URL
DROP_CMD="drop database if exists $PGDATABASE"

psql -d $CONTROL_DATABASE_URL -c '$DROP_CMD'
#psql -d $CONTROL_DATABASE_URL -c 'create database $PGDATABASE'
