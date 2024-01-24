source .env
echo -n "Version de psql: "
psql --version
echo -n "Lignes copiées: "
psql -d $TARGET_DB -c "\copy raw_data.commentaires FROM 'import_commentaires.csv' delimiter ';' csv header"
