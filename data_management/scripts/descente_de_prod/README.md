## Processus de descente de prod

Ce processus permet de copier l'ensemble de la base de données de production vers un autre environement.


Prérequis:
- configurer `CONN_STR_PROD` et `CONN_STR_DESTINATION` dans le fichier d'environnement. **Attention:** Si vous ciblez une base en local, il faut utiliser `172.17.0.1` comme hote, et non `localhost` si vous exécutez le script vi Docker
- Etablir les connections en tunnel ssh si besoin. *Note:* Un autre script, plus complet, réalise l'établissement de ces tunnels, mais ce n'est pas le cas ici.
- Lancer le script en local via `/bin/bash descente_de_prod_partielle.sh` ou via `docker-compose up` (ne fonctionne pas actuellement pour les connexions avec tunnel ssh)
- Le fichier `.dump` généré par le dump et chargé dans la base de destination sera disponible dans `out/`

### Via Docker

Pour utiliser Docker, renseigner les variables d'environement suivantes:

```sh
# for docker use
API_TOKEN_SCALINGO=TBD
SCALINGO_REGION=TBD
SCALINGO_APP=TBD
SCALINGO_PORT_BIND=TBD
```

et ajouter une clé ssh autorisée par Scalingo dans `ssh_key_scalingo`.

### Exécuter sur Scalingo

Etapes à réaliser sur Scalingo:

- se connecter à un one-off de l'environnement souhaité
- `cd /app/scripts/descente_de_prod` puis `/bin/bash descente_de_prod_partielle.sh`
