export $(cat .env | xargs)

export PGPASSWORD="$PWD_DF2"
# Importer les données dans la deuxième base de données
echo ">> Load public data"
psql -h $df2_host -p $df2_port -U $df2_user -d $df2_db -f out/export_public_utilisateur.sql
psql -h $df2_host -p $df2_port -U $df2_user -d $df2_db -f out/export_public.sql
echo ">> Load raw data"
psql -h $df2_host -p $df2_port -U $df2_user -d $df2_db -f out/export_raw_commentaire.sql
psql -h $df2_host -p $df2_port -U $df2_user -d $df2_db -f out/export_raw_mesure_indicateur.sql
unset PGPASSWORD

# script 5 7