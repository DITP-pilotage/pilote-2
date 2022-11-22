Ce qu'on a fait:

### Préparation

Récupérer le fichier `DITP_Liste_chantiers_perseverants-avec-trigramme.csv` et le placer dans le répertoire `data/input-data` (c'est un peu étrange puisqu'on le met ailleurs au dessous, mais on ne souhaite pas conserver l'étape de cp ... ci-dessous).

Pour que le pg copy puisse accéder aux données, on est passé par le volume monté sur le container pg comme ceci :

```
$ cp ../input-data/DITP_Liste_chantiers_perseverants-avec-trigramme.csv ../../db/13/main
```

### Création de la table et import du csv

```
$ psql "postgres://postgresql:secret@localhost:5432/postgresql" <import-chantier.sql
```
