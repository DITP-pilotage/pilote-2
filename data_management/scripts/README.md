# Scripts

## Datajobs

Voici la liste des commandes utiles pour éxécuter les scripts depuis le dossier `data_management`:

```sh
# Exécuter une commande dbt [docker]
docker compose run --rm pilote_dbt dbt run --select barometre
## [local]
dbt run --select barometre

# Exécuter les datajobs [docker]
FULL_DJ=false docker compose run --rm -e FULL_DJ pilote_datajobs
## [local]
FULL_DJ=false pipenv run /bin/bash scripts/run_datajobs.sh


# Exécuter les datajobs en mode FULL_DJ [docker]
FULL_DJ=true docker compose run --rm -e FULL_DJ pilote_datajobs
## [local]
FULL_DJ=true pipenv run /bin/bash scripts/run_datajobs.sh

# Exécuter un script datajob unique [docker]
docker compose run --rm pilote_datajobs scripts/2_seed_ppg_metadata.sh
## [local]
pipenv run /bin/bash scripts/2_seed_ppg_metadata.sh
```

*Note:* 
- *[docker]:* Ne pas oublier d'éxécuter `docker compose build` à la première éxécution **ET** lorsque le fichier `Pipfile.lock` a été modifié (dépendances du projet Python).
- *[local]:* Ne pas oublier d'éxécuter `pipenv sync` à la première éxécution **ET** lorsque le fichier `Pipfile.lock` a été modifié (dépendances du projet Python).


## Descente de prod partielle

Ce processus permet de copier certaines tables de la base de données de production vers un autre environement.

Prérequis:
- les données seront copiées vers `DATABASE_URL`
- configurer `CONN_STR_PROD` dans le fichier d'environnement de `data_management`. **Attention:** Si vous ciblez une base en local, il faut utiliser `172.17.0.1` comme hote, et non `localhost` si vous exécutez le script via Docker
- Etablir les connections en tunnel ssh si besoin.
- Le fichier `.dump` généré par le dump et chargé dans la base de destination sera disponible dans `scripts/dumps/`

```sh
# Exécuter une descente de prod partielle [docker]
docker compose run --rm pilote_datajobs scripts/descente_de_prod_partielle.sh
## [local]
pipenv run /bin/bash scripts/descente_de_prod_partielle.sh
```

## Exécuter sur Scalingo

Etapes à réaliser sur Scalingo:

- se connecter à un one-off de l'environnement souhaité sur l'app des datajobs
- *datajobs*: exécuter `/bin/bash scripts/run_datajobs.sh`
- *descente de prod*: exécuter `/bin/bash scripts/descente_de_prod_partielle.sh`
