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

Récupérer le projet github PPG_metadata et le placer dans le répertoire `data/input_data/private_data`.

#### Création de la table et import du csv
Dans le dossier `data/`, exécuter les commandes suivantes.

Si cela n'est pas déjà fait, créer les tables nécessaires au job d'import :

```bash
npx prisma migrate dev
```

Note : ces tables sont créées dans le schéma `raw_data`, pas le schéma par défaut `public`.

A la racine du projet, lancer la commande suivante :
``` bash
npm run database:raw_data:fill:local
```

NB: cette commande peut être utilisé directement avec la commande "database:fill" du package.json

### Job de transformations

Le répertoire `data/pilote_data_jobs/transformations` contient le projet dbt qui permet de transformer les données de Pilote existant vers le nouveau format nécessaire pour les Politiques Prioritaires du Gouvernement.

#### Hypothèses

- Les données sources sont importées dans le schéma `raw_data` par l'étape précédente (job d'import) ;
- Le schémas destination est le schémas utilisé par la Webapp. À date, ce schéma est le schéma par défaut (`public`) ;
- DBT lit dans `raw_data`, le schéma d'import des données ;
- DBT écrit dans `public`, le schéma de destination.

#### Comment démarrer

A la racine du projet :
``` bash
npm run database:public:fill
```

Ou bien directement dans le dossier `data/pilote_data_jobs`, réaliser les 3 étapes suivantes :

1. *Récupérer l'image docker de DBT*

``` bash
docker pull ghcr.io/dbt-labs/dbt-postgres:1.3.1
```

2. *Configurer le profil dbt*

Créer le fichier `dbt_root/profiles.yml` sur le modèle du fichier `dbt_root/profiles.yml.example`, pour le faire pointer sur le service docker-compose définit à la racine. Le fichier d'exemple a normalement les bonnes valeurs configurées pour se connecter au serveur de dev local.

3. *Lancer des commandes dbt*

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
