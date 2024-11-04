# Scripts

## Webapp

Pour réinitialiser la base de données avec prisma, exécuter

```sh
# Reset db [docker]
docker compose run --rm pilote_webapp /bin/bash scripts/prisma_reset_and_migrate.sh
## [local]
/bin/bash scripts/prisma_reset_and_migrate.sh
```

Les commandes `npm` (*lint, test, ...*) sont également éxécutables via Docker:

```sh
# Commande npm [docker]
docker compose run --rm pilote_webapp npm run lint
# [local]
npm run lint
```

## Descente de prod partielle

Ce processus permet de copier certaines tables de la base de données de production vers un autre environement.

Prérequis:
- les données seront copiées vers `DATABASE_URL`
- configurer `CONN_STR_PROD` dans le fichier d'environnement de `data_management`. **Attention:** Si vous ciblez une base en local, il faut utiliser `172.17.0.1` comme hote, et non `localhost` si vous exécutez le script via Docker
- Etablir les connections en tunnel ssh si besoin.
- Le fichier `.dump` généré par le dump et chargé dans la base de destination sera disponible dans `scripts/dumps/`

```sh
# Exécuter une descente de prod partielle [docker]
docker compose run --rm descente_de_prod
## [local]
pipenv run /bin/bash scripts/descente_de_prod_partielle.sh
```

## Scripts "daily"

Voir [daily](./daily).

## Exécuter sur Scalingo

Etapes à réaliser sur Scalingo:

- se connecter à un one-off de l'environnement souhaité sur l'app des datajobs
- *descente de prod*: exécuter `/bin/bash scripts/descente_de_prod_partielle.sh`
