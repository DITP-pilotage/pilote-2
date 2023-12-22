## Processus de descente de prod

Ce processus permet de copier l'ensemble de la base de données de production vers un autre environement.


Prérequis:
- configurer `CONN_STR_PROD` et `CONN_STR_DESTINATION` dans le fichier d'environnement. **Attention:** Si vous ciblez une base en local, il faut utiliser `172.17.0.1` comme hote, et non `localhost` si vous exécutez le script vi Docker
- Etablir les connections en tunnel ssh si besoin. *Note:* Un autre script, plus complet, réalise l'établissement de ces tunnels, mais ce n'est pas le cas ici.
- Lancer le script via `docker-compoe up` ou en local (non testé) via `/bin/bash descente_de_prod.sh`
- Cela va créer un fichier `.dump` qui va être chargé dans la base de destination

