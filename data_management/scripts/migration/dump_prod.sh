#DROP SCHEMA df3 CASCADE;
#DROP SCHEMA marts CASCADE;
#DROP SCHEMA public CASCADE;
#DROP SCHEMA raw_data CASCADE;

# script 0 1 2

export $(cat .env | xargs)

export PGPASSWORD="$PWD_PROD"
pg_dump -h $prod_host -p $prod_port -U $prod_user -d $prod_db \
    -t "public.utilisateur" \
    -t "public.commentaire" \
    -t "public.synthese_des_resultats" \
    -t "public.rapport_import_mesure_indicateur" \
    -t "public.habilitation" \
    -a > out/export_public.sql

pg_dump -h $prod_host -p $prod_port -U $prod_user -d $prod_db \
    -t "raw_data.commentaires" \
    -t "raw_data.mesure_indicateur" \
    -a > out/export_raw.sql

unset PGPASSWORD

