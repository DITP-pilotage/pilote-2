## dbt docs
echo "-- [log] Chargement des variables d'env depuis le .env"
source .env
echo "-- [dbt.docs] Génération de la doc"
dbt docs generate --profiles-dir . --project-dir data_factory/ 
echo "-- [dbt.docs] Lancement du serveur de doc"
dbt docs serve --profiles-dir . --project-dir data_factory/
