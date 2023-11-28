PROJECT_DIR=data_factory
echo "-- [dbt.test] Lancement de tous les tests"
pipenv run dbt build --project-dir data_factory --select df3_indicateur_unnest_va df3_indicateur
