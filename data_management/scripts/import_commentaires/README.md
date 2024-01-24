# Import de fichiers commentaires

Import d'un fichier de commentaires `import_commentaires.csv` dans `raw_data.commentaires`. 

Etapes de préparation de la copie des données de `import_commentaires.csv`:

- `cp .env.example .env` : copier le fichier d'env 
- Renseigner `TARGET_DB` dans le `.env` (*connexion string* de la base de données à utiliser)
- `cp import_commentaires.example.csv import_commentaires.csv` : créer un fichier `import_commentaires.csv` puis l'alimenter avec les données en suivant le modèle du fichier d'exemple

## Via Docker (recommandé)

Cette solution fonctionne actuellement uniquement sur une base locale. Il faut utiliser `172.17.0.1` comme hote, et non `localhost`. L'accès aux bases scalingo via tunnel est pour l'instant impossible depuis un conteneur. 

Solution recommandée car on utilise l'image Docker `postgres:16.1` qui est compatible avec le serveur postgres de l'app Scalingo. On peut faire évoluer cela si besoin. Donc il n'est pas nécessaire d'installer la version précise de psql sur sa machine.

- `docker-compose up` pour lancer la copie

## En local

- `/bin/bash import.sh` pour lancer la copie
