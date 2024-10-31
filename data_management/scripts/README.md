# Scripts

## Descente de prod partielle

Ce processus permet de copier certaines tables de la base de données de production vers un autre environement.


Prérequis:
- les données seront copiées vers `DATABASE_URL`
- configurer `CONN_STR_PROD` dans le fichier d'environnement de `data_management`. **Attention:** Si vous ciblez une base en local, il faut utiliser `172.17.0.1` comme hote, et non `localhost` si vous exécutez le script via Docker
- Etablir les connections en tunnel ssh si besoin.
- Lancer le script en local via `/bin/bash scripts/descente_de_prod_partielle.sh` ou `docker compose run --rm pilote_dbt scripts/descente_de_prod_partielle.sh`
- Le fichier `.dump` généré par le dump et chargé dans la base de destination sera disponible dans `scripts/dumps/`

### Exécuter sur Scalingo

Etapes à réaliser sur Scalingo:

- se connecter à un one-off de l'environnement souhaité sur l'app des datajobs
- `cd /app/` puis `/bin/bash scripts/descente_de_prod_partielle.sh`
