# Pilote geojson

Ce pipeline de traitement de données a pour but de générer le tracé SVG des frontières des départements et des régions à partir de données géographiques au format geojson.

Le traitement se déroule en quatre étapes :
1. Récupérer les coordonnées géographiques des territoires au format geojson
2. Simplifier les contours géographiques afin de réduire la complexité des formes géométriques
3. Modifier la position des territoires sur la cartographie (afficher les DROM à côté de la métropole et afficher un encart zoomé de la petite couronne de l'Île-de-France)
4. Convertir les données geojson en tracés SVG

## 00 -> 01

Télécharger les données géographiques sur [data.gouv.fr](https://miro.com/app/board/uXjVPMRtPuk=/?moveToWidget=3458764541842367374&cot=14).

Rechercher `Départements de France avec Droms rapprochés` et `Régions de France avec Droms rapprochés` et les télécharger dans le répoertoire `/data_management/geojson/01_original`.


## 01 -> 02

TODO


## 02 -> 03

TODO


## 03 -> 04

Pour générer le tracé SVG des territoires
Depuis le répertoire `data_management/geojson/` :

1. Exécuter la commande `node ./scripts/extraire_données_géographiques.js`.
2. Exécuter le formateur de code sur les fichiers générés (`src/client/constants/départements.json` et `src/client/constants/régions.json`)
