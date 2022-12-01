# Pilote Data Jobs

Ce répertoire contient les jobs qui permettent d'importer et transformer les données de Pilote existant vers le nouveau format nécessaire pour les Politiques Prioritaires du Gouvernement.

## Prérequis

Avoir docker sur sa machine.

Démarrer le service docker-compose postgres définit à la racine de ce
repository.

## Installation

[setup]

## Lancement des jobs

Aller dans le répertoire `data/pilote_data_jobs`.

### Job d'import

#### Préparation

Récupérer le fichier `DITP_Liste_chantiers_perseverants-avec-trigramme.csv` et le placer dans le répertoire `data/input_data`.

#### Création de la table et import du csv

Note : cette table est créée dans le schémas `raw_data`, pas le schémas par défaut `public`.

``` bash
psql "postgres://postgresql:secret@localhost:5432/postgresql" < import/reset.sql
psql "postgres://postgresql:secret@localhost:5432/postgresql" -c "copy raw_data.ditp_liste_chantiers_perseverants_avec_trigramme from STDIN with csv delimiter ',' header;" < ../input_data/DITP_Liste_chantiers_perseverants-avec-trigramme.csv
```

Exemple pour explorer ce qu'il y a dans le schémas `raw_data` :

``` bash
PGOPTIONS="--search_path=raw_data" psql service=ppg -c '\dt'
```

### Job de transformations

Le répertoire `data/pilote_data_jobs/transformations` contient le projet dbt qui permet de transformer les données de Pilote existant vers le nouveau format nécessaire pour les Politiques Prioritaires du Gouvernement.

#### Hypothèses

- Les données sources sont importées dans le schéma `raw_data` par l'étape précédente (job d'import) ;
- Le schémas destination est le schémas utilisé par la Webapp. À date, ce schéma est le schéma par défaut (`public`) ;
- DBT lit dans `raw_data`, le schéma d'import des données ;
- DBT écrit dans `public`, le schéma de destination.

#### Comment démarrer

*Récupérer l'image docker de DBT*

``` bash
docker pull ghcr.io/dbt-labs/dbt-postgres:1.3.1
```

*Configurer le profil dbt*

Créer le fichier `dbt_root/profiles.yml` sur le modèle du fichier `dbt_root/profiles.yml.example`, pour le faire pointer sur le service docker-compose définit à la racine. Le fichier d'exemple a normalement les bonnes valeurs configurées pour se connecter au serveur de dev local.

*Lancer des commandes dbt*

Avec les confs ci-dessus, on peut lancer des commandes dbt à partir de l'image docker depuis le répertoire de ce README.md :

Pour tester la connexion à DBT lancer la commande "debug": 

``` bash
docker run -it --rm \
      --network=host \
      --mount type=bind,source=$(pwd)/transformations/ditp_ppg_dbt,target=/usr/app \
      --mount type=bind,source=$(pwd)/transformations/dbt_root,target=/root/.dbt/ \
      ghcr.io/dbt-labs/dbt-postgres:1.3.1 \
      debug
```

Pour executer la transformation finale lancer la commande "run":

``` bash
docker run -it --rm \
      --network=host \
      --mount type=bind,source=$(pwd)/transformations/ditp_ppg_dbt,target=/usr/app \
      --mount type=bind,source=$(pwd)/transformations/dbt_root,target=/root/.dbt/ \
      ghcr.io/dbt-labs/dbt-postgres:1.3.1 \
      run
```

## Références

- Docker Install ~ <https://docs.getdbt.com/docs/get-started/docker-install>
- profiles.yml ~ <https://docs.getdbt.com/reference/profiles.yml>
- Connection profiles ~ <https://docs.getdbt.com/docs/get-started/connection-profiles>
- Getting started with dbt Core ~ <https://docs.getdbt.com/docs/get-started/getting-started-dbt-core>

Liens dbt :

- Learn more about dbt [in the docs](https://docs.getdbt.com/docs/introduction)
- Check out [the blog](https://blog.getdbt.com/) for the latest news on dbt's development and best practices
