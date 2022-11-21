Ce répertoire contient le projet dbt qui permet de transformer les données de
Pilote existant vers le nouveau format nécessaire pour les Politiques
Prioritaires du Gouvernement.

## Comment démarrer

### Prérequis

Avoir docker sur sa machine.

Démarrer le service docker-compose postgres définit à la racine de ce
repository.

Sur cette instance Postgres, créer la base de donnée `dbt_dev`. Ci-dessous,
trois méthodes équivalentes pour faire ça.

Première méthode, si vous n'avez pas de client postgres sur votre machine, vous
pouvez utiliser le client du container postgres en train de tourner (vous
devrez taper le mot de passe admin définit dans le docker-compose à la racine
du projet) :

```
$ docker exec -it ditp-pilote-draft_postgresql_1 psql -U admin -h localhost postgresql -c 'create database dbt_dev;'
```

Deuxième méthode, si vous avez déjà un client postgres sur votre machine, vous
pouvez vous contenter de la commande psql :

```
$ psql -U admin -h localhost postgresql -c 'create database dbt_dev;'
```

Troisième méthode, si vous avez un client postgres et que vous avez configuré
la base dbt dans votre fichier `~/.pg_service.conf`, pas besoin des infos de
connexion :

```
$ psql --service=dbt -c 'create database dbt_dev;'
```

### Récupérer l'image docker de DBT

```
$ docker pull ghcr.io/dbt-labs/dbt-postgres:1.3.1
```

### Configurer le profil dbt

Créer le fichier `dbt_root/profiles.yml` sur le modèle du fichier
`dbt_root/profiles.yml.example`, pour le faire pointer sur le service
docker-compose définit à la racine. Le fichier d'exemple a normalement les
bonnes valeurs configurées pour se connecter au serveur de dev local.

### Lancer des commandes dbt

Avec les confs ci-dessus, on peut lancer des commandes dbt à partir de l'image
docker depuis le répertoire de ce README.md :

```
$ docker run -it --rm \
      --network=host \
      --mount type=bind,source=$(pwd)/ditp_ppg_dbt,target=/usr/app \
      --mount type=bind,source=$(pwd)/dbt_root,target=/root/.dbt/ \
      ghcr.io/dbt-labs/dbt-postgres:1.3.1 \
      debug
```

## Références

- Docker Install ~ <https://docs.getdbt.com/docs/get-started/docker-install>
- profiles.yml ~ <https://docs.getdbt.com/reference/profiles.yml>
- Connection profiles ~ <https://docs.getdbt.com/docs/get-started/connection-profiles>
- Getting started with dbt Core ~ <https://docs.getdbt.com/docs/get-started/getting-started-dbt-core>

Liens dbt :

- Learn more about dbt [in the docs](https://docs.getdbt.com/docs/introduction)
- Check out [the blog](https://blog.getdbt.com/) for the latest news on dbt's development and best practices
