# df2

Ce dossier contient le code de construction des tables de sortie de la datafactory 2 (dbt).

La description des *modèles dbt* se trouve dans le fichier [properties.yml](./properties.yml).

Pour lancer la construction de ces modèles, exécuter:

```sh
dbt run --select df2
```

## Documentation

Pour mettre en évidence les dépendances dans la documentation, des couleurs ont été ajoutées à la doc dbt. Si vous lancez la doc dbt sur le port *8088*, ce shema est accessible à l'adresse `http://localhost:8088/#!/model/model.ditp_ppg_dbt.df2_indicateur?g_v=1&g_i=%2Bexposition%2B%20%2Bdf2%2B`.

Ajout de tags `scope_pst` pour identifier rapidement les modèles qui concernent les projets structurants, avec `dbt <command> --select tag:scope_pst`.

## Tests

Des tests pour vérifier l'exactitude des données sont mis en places dans le dossier [tests/df2](../../tests/df2). Pour les lancer, exécuter:

```sh
dbt test --select df2
```