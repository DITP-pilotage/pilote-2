echo "-- [log] Chargement des variables d'env depuis le .env"
source .env
echo "-- [dbt.deps] Install dependencies"
pipenv run dbt deps --profiles-dir . --project-dir data_factory/
echo "-- [dbt.elementary] Lancement de elementary"
pipenv run dbt run --select elementary --profiles-dir . --project-dir data_factory/ 
