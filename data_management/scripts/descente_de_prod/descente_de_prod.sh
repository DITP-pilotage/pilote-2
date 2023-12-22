DUMP_DEST=out/dump_prod.dump

export $(cat .env | xargs)

# [export]
## [export.dump] Export table with CREATE command
echo ">> Dumping data..."
time pg_dump -d $CONN_STR_PROD -c -O -v -Fc -Z 9 --file=$DUMP_DEST


# [import]

echo ">> Wiping schemas..."
time psql -d $CONN_STR_DESTINATION -c "DROP SCHEMA if exists raw_data, analysis, public, df3,marts,minio,trello cascade; CREATE SCHEMA public;"
echo ">> Importing data..."
time pg_restore --clean --exit-on-error --if-exists --no-owner --no-privileges -d $CONN_STR_DESTINATION --verbose $DUMP_DEST
