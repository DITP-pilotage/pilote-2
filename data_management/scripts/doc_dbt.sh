## dbt docs
echo "-- [dbt.docs] Génération de la doc"
pipenv run dbt docs generate
echo "-- [dbt.docs] Lancement du serveur de doc"
pipenv run dbt docs serve
