echo "-- [log] Chargement des variables d'env depuis le .env"
source .env
# pipenv shell
echo "-- [log.pipenv] Détails du virtualenv actuel"
pipenv --venv
echo "-- [log.pipenv] Packages installés dans le virtualenv"
pipenv run pip freeze
echo "-- [dbt.deps] Installation des dépendances dbt"
pipenv run dbt deps --profiles-dir . --project-dir data_factory
echo "-- [dbt.docs] Génération de la doc"
pipenv run dbt docs generate --profiles-dir . --project-dir data_factory/ 
echo "-- [dbt.docs] Lancement du serveur de doc"
pipenv run dbt docs serve --profiles-dir . --project-dir data_factory/
