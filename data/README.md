# Pilote Data jobs
Ce répertoire les pipelines d'imports, de chargement et transformation des données de _Pilote V2_. 
Il gère également les migrations de base pour les données brutes.

## Description

Ce projet est décomposé de 3 parties : 
1. Migration des tables avec alembic : 
   - Afin de versionner les changements de tables sur le schéma `raw_data` de la database du projet _Pilote V2_.
2. Exploration des données issues de _Dfakto_ et du projet _PPG_metadata_ : 
   - Projet python pour explorer les données du projet.
3. Pipelines d'imports, de chargement et transformation des données


## Avant de démarrer

### Pré-requis

Il est nécessaire d'avoir python 3.9.15 sur votre machine.

Il faut avoir configuré et initialisé votre base de données de Webapp comme précisé dans le README.md à la racine du projet.
Pour la suite du projet, il faut s'assurer que la base de données soit démarrée.

### Installation

Les projets et pipelines s'appuient sur des métadonnées à récupérer par ailleurs.

Récupérez le zip des métadonnées PPG, dont le nom commence par `PPG_metadata` (demandez à l'équipe). 
Décompressez le répertoire `PPG_metadata` dans `data/input_data/private_data`.
Ce projet est aussi récupérable de github.

On se retrouve avec une arborescence qui ressemble à ça :

```
data/input_data/private_data/
└── PPG_metadata
    ├── CONTRIBUTING.md
    ├── PPG_metadata.Rproj
    ├── README.md
    ├── docs
    ├── generators
    ├── ingestion
    ├── models
    └── views
```

#### Initialisation de l'environnement python

Afin d'installer les dépendances liées au projet, il faut exécuter la commande suivante : 

```bash
pipenv install
```

Afin de démarrer l'environnement :

```bash
pipenv shell
```

#### Initialisation de la base de données

Afin d'effectuer les migrations sur votre base de données : 

```bash
alembic upgrade head
```

## Usage




# Schéma des flux de données

Ce document souhaite poser les bases des flux de données alimentant l'application [Pilote 2](). @Fabien ajouter lien vers l'app

L'évolution de ces flux se fera au fur et à mesure de la création de l'application Pilote 2.

## Schéma macro des flux

``` mermaid
graph LR
SFTP(Chargement initial) --> PG[(Base PG Pilote 2)]
PM(PPG_metadata) --> PG
RB(referentiel-builder) --> PG
PG --> BE(Back-end) --> FE(Front-end)

```

## Zoom sur la partie ingestion de données
### Brique SFTP vers Datawarehouse

Aujourd'hui, le chargement des données se fait manuellement une seule fois.
A terme nous devons pouvoir charger les données du serveur SFTP.

``` mermaid
graph LR
SFTP(Chargement initial) --> |chantier_perseverant.csv| PG[(Base PG Pilote 2)]
```

Légende :
- Est appelé `Chargement initial` les données (ou .csv) issues du _SFTP_.
- Est appelé `chantier_perseverant.csv` le fichier `DITP_Liste_chantiers_perseverants-avec-trigramme.csv`.

### PPG Metadata vers Datawarehouse

Pour le moment aucun pipeline de données n'a été implémentée. On peut imaginer des flux suivants :

``` mermaid
graph LR
PM(PPG_metadata) --> PG[(Base PG Pilote 2)]
```

### Referentiel-builder vers Datawarehouse

Pour le moment aucun pipeline de données n'a été implémentée. On peut imaginer des flux suivants :

``` mermaid
graph LR
RB(referentiel-builder) --> PG[(Base PG Pilote 2)]
```


## Zoom sur la partie transformation de données

Dans cette brique datawarehouse, deux schémas de données se distinguent :
- Les données brutes ou `raw_data` qui sont situées dans le schéma `raw_data`.
- Les données transformées et agrégées ou 'ready to use data' qui sont situées dans le schéma `public`.

Il faudrait également mener une réflexion sur la pertinence d'avoir un schéma de données pour les données nettoyées et
pré-processées.

``` mermaid
graph LR
subgraph Base PG Pilote 2
    RD{{raw_data}} --> |chantier| J((J))
    RD --> |perimetre_ministeriel| J
    J --> |chantier| PU{{public}}
end

subgraph Légende
    SCH{{schéma}}
    JOIN((Jointure))
end
```

NB: Ce schéma n'est pas encore implémenté mais cela permet de poser des conventions de documentation des flux de données à l'intérieur de la base Pilote 2.
