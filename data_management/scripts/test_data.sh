echo "-- [dbt.test] Lancement de tous les tests"
pipenv run dbt build --select df3_indicateur_unnest_va df3_indicateur
