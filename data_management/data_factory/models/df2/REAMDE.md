# df2

Ce dossier contient le code de construction des tables de sortie de la datafactory 2 (dbt).

La description des *modèles dbt* se trouve dans le fichier [properties.yml](./properties.yml).

Pour lancer la construction de ces modèles, exécuter:

```sh
dbt run --select df2
```