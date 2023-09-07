PROJECT_DIR=data_factory
echo "-- [dbt.test] Lancement de tous les tests"
pipenv run dbt test --project-dir data_factory/ 
