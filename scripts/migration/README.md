# Scripts de migration SQL

Les fichiers `.sql` correspondent au migrations SQL à effectuer sur la donnée (par opposition à la structure des tables).

Ils sont lancés via le script [run_migration.sh](run_migration.sh) en lui passant comme premier argument le path de la racine jusqu'au fichier `.sql` de migration

## Lancement des scripts en local:
```
bash scripts/migration/run_migration.sh scripts/migration/YYYYMMDD-migr-script-name.sql
```

## Lancement des scripts dans sur Scalingo

```
scalingo --app app-name --region osc-secnum-fr1 run "bash scripts/migration/run_migration.sh scripts/migration/YYYYMMDD-migr-script-name.sql"
```