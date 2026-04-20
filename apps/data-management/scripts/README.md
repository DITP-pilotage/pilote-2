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


## Exécuter sur Scalingo

Etapes à réaliser sur Scalingo:

- se connecter à un one-off de l'environnement souhaité sur l'app des datajobs
- *datajobs*: exécuter `/bin/bash scripts/run_datajobs.sh`
