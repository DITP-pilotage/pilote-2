export $(cat .env | xargs)

export PGPASSWORD="$PWD_LOCAL"
# Importer les données dans la deuxième base de données
echo ">> Load public data"
psql -h $local_host -p $local_port -U $local_user -d $local_db -f out/export_public_utilisateur.sql
psql -h $local_host -p $local_port -U $local_user -d $local_db -f out/export_public.sql
echo ">> Load raw data"
psql -h $local_host -p $local_port -U $local_user -d $local_db -f out/export_raw_commentaire.sql
psql -h $local_host -p $local_port -U $local_user -d $local_db -f out/export_raw_mesure_indicateur.sql
unset PGPASSWORD

# script 5 7