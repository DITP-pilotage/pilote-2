Ce répertoire contient le projet dbt qui permet de transformer les données de
Pilote existant vers le nouveau format nécessaire pour les Politiques
Prioritaires du Gouvernement.

## Comment démarrer

### Prérequis

Avoir docker sur sa machine.

Démarrer le service docker-compose postgres définit à la racine de ce
repository.

Sur cette instance Postgres, créer la base de donnée `dbt_dev`.

```
=# create database dbt_dev;
```

### Récupérer l'image docker de DBT

```
$ docker pull ghcr.io/dbt-labs/dbt-postgres:1.3.latest
```

### Configurer le profil dbt

Créer le fichier `dbt_root/profiles.yml` sur le modèle du fichier
`dbt_root/profiles.yml.example`, pour le faire pointer sur le service
docker-compose définit à la racine.

### Lancer des commandes dbt

Avec les confs ci-dessus, on peut lancer des commandes dbt à partir de l'image
docker depuis le répertoire de ce README.md :

```
$ docker run -it --rm \
      --network=host \
      --mount type=bind,source=$(pwd)/ditp_ppg_dbt,target=/usr/app \
      --mount type=bind,source=$(pwd)/dbt_root,target=/root/.dbt/ \
      ghcr.io/dbt-labs/dbt-postgres:1.3.latest \
      debug
```

## Références

- Docker Install ~ <https://docs.getdbt.com/docs/get-started/docker-install>
- profiles.yml ~ <https://docs.getdbt.com/reference/profiles.yml>
- Connection profiles ~ <https://docs.getdbt.com/docs/get-started/connection-profiles>
- Getting started with dbt Core ~ <https://docs.getdbt.com/docs/get-started/getting-started-dbt-core>
