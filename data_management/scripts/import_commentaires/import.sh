source .env
echo -n "Version de psql: "
psql --version
echo -n "Lignes copiées: "
psql -d $TARGET_DB -c "\copy raw_data.commentaires(chantier_id,maille,code_insee,date,type,contenu,meteo,date_meteo,auteur_email) FROM 'import_commentaires.csv' delimiter ';' csv header"