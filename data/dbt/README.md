Ce répertoire contient le projet dbt qui permet de transformer les données de Pilote existant vers le nouveau format nécessaire pour les Politiques Prioritaires du Gouvernement.

## Hypothèses

- Les données sources sont importées par l'étape précédente, dans le schéma `raw_data` ;
- Le schémas destination est le schémas utilisé par la Webapp. À date, ce schéma est le schéma par défaut (`public`) ;
- DBT lit dans `raw_data`, le schéma d'import des données ;
- DBT écrit dans `public`, le schéma de destination.

## Comment démarrer

### Prérequis

Avoir docker sur sa machine.

Démarrer le service docker-compose postgres définit à la racine de ce
repository.

Importer les données, voir la doc du job d'import. Ce job créé le schémas `raw_data`.

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
