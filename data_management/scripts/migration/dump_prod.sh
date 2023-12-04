#DROP SCHEMA df3 CASCADE;
#DROP SCHEMA marts CASCADE;
#DROP SCHEMA public CASCADE;
#DROP SCHEMA raw_data CASCADE;

# script 0 1 2

export $(cat .env | xargs)

export PGPASSWORD="$PWD_PROD"
# Export table with CREATE command
pg_dump -h $prod_host -p $prod_port -U $prod_user -d $prod_db \
    -O -v \
    -t "public.utilisateur" \
    > out/export_public_utilisateur.sql
# Export table without CREATE command
pg_dump -h $prod_host -p $prod_port -U $prod_user -d $prod_db \
    -O -v \
    -t "public.commentaire" \
    -t "public.synthese_des_resultats" \
    -t "public.rapport_import_mesure_indicateur" \
    -t "public.habilitation" \
    -a > out/export_public.sql

# Export table with CREATE command
pg_dump -h $prod_host -p $prod_port -U $prod_user -d $prod_db \
    -O -v \
    -t "raw_data.commentaires" \
    > out/export_raw_commentaire.sql

# Export table without CREATE command
pg_dump -h $prod_host -p $prod_port -U $prod_user -d $prod_db \
    -O -v \
    -t "raw_data.mesure_indicateur" \
    -a > out/export_raw_mesure_indicateur.sql

unset PGPASSWORD

