# Pilote Data jobs
Ce répertoire les pipelines d'imports, de chargement et transformation des données de _Pilote V2_. 
Il gère également les migrations de base pour les données brutes.

## Description

Ce projet est décomposé de 3 parties : 
1. Migration des tables avec alembic : 
   - Afin de versionner les changements de tables sur le schéma `raw_data` de la database du projet _Pilote V2_.
   - L'ensemble des migrations de base se trouve dans le dossier `migrations`
2. Exploration des données issues de _Dfakto_ et du projet _PPG_metadata_ : 
   - Projet python pour explorer les données du projet.
   - Ces données se situent dans le dossier `input_data`. 
   On mettra les données privées dans le repertoire `private_data` et les données publiques dans `open_data`. 
3. Pipelines d'imports, de chargement et transformation des données
   - Les jobs d'imports et chargement des données seront exécutés via des commandes `psql` dans un script.
   - Les transformations seront faites avec DBT dans un environnement python et également exécutées par script.


## Avant de démarrer

### Pré-requis

Il est nécessaire d'avoir [python 3.9.15](https://www.python.org/downloads/release/python-3915/) sur votre machine.

Il faut avoir configuré et initialisé votre base de données de Webapp comme précisé dans le README.md à la racine du projet.
Pour la suite du projet, il faut s'assurer que la base de données soit démarrée.

Le client Postgres `psql` est également nécessaire pour les scripts d'import :

- <https://www.postgresql.org/download/>

### Installation

Les projets et pipelines s'appuient sur des métadonnées à récupérer en provenance de plusieurs sources.

Récupérez le zip des métadonnées PPG, dont le nom commence par `PPG_metadata` (demandez à l'équipe). 
Décompressez le répertoire `PPG_metadata` dans `data/input_data/private_data`.
Ce projet est aussi récupérable de github.

Il faut également récupérer le dump dfakto qui se trouve sur le drive à l'adresse https://drive.google.com/drive/folders/1NI_VQIqJ3JPovOWC7b73j_cJt3O9qXA-.
Dans le même dossier drive, il vous faudra le fichier fact_financials_enr_short.csv. A placer dans le `input_data/private_data/dump_dfakto_octo/rp/raw/fact_financials_enr_short.csv`.

On se retrouve avec une arborescence qui ressemble à cela :

```
data/input_data/private_data/
├── PPG_metadata
    ├── CONTRIBUTING.md
    ├── PPG_metadata.Rproj
    ├── README.md
    ├── docs
    ├── generators
    ├── ingestion
    ├── models
    └── views
└── dump_dfakto_octo
    ├── ps
    └── rp
        ├── raw
        └── views
            ├── data
            └── meta
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

#### Récupération des dépendances DBT 
``` bash 
dbt deps --project-dir pilote_data_jobs/transformations/ditp_ppg_dbt/ --profiles-dir pilote_data_jobs/transformations/dbt_root/ 
```

#### Initialisation de la base de données

Copier le fichier `/.env.example` vers `/data/.env` :

```bash
cp ../.env.example .env
```

Afin d'effectuer les migrations sur votre base de données :

```bash
alembic upgrade head
```

Note : alembic charge automatiquement les variables contenues dans le fichier `.env`,
et est capable de trouver le `.env` dans le répertoire racine du projet.

Voir dans le fichier `migrations/env.py` pour connaître les variables d'env
utilisées par alembic.

## Usage

### Import des données

#### Import des données open data en local

Toujours depuis le répertoire data :

```bash
bash pilote_data_jobs/scripts/fill_tables_raw_data.sh
```

#### Import des données privées vers la base live :

Ouvrir un tunnel vers la base grâce au cli Scalingo :

```bash
scalingo -a pilote-ppg db-tunnel SCALINGO_POSTGRESQL_URL
```

Modifier les valeurs de votre `.env` pour les faire pointer vers votre tunnel

Depuis le répertoire data :

```bash
bash pilote_data_jobs/scripts/fill_tables_raw_data.sh private_data
```

### Transformations

Les transformations sont effectuées par dbt, qui est déjà installé par le setup initial. 
Les transformations sont décrites dans le répertoire
`data/pilote_data_jobs/transformations`

Vérifiez que les valeurs de votre `data/.env` correspondent bien à la base que
vous souhaitez modifier (voir les sections sur l'import pour un exemple en
local et un exemple en live).

Depuis le répertoire data :

```bash
bash pilote_data_jobs/scripts/fill_tables_public.sh
```

#### Hypothèses actuelles pour les transformations

- Les données sources sont importées dans le schéma `raw_data` par l'étape précédente (job d'import) ;
- Le schéma destination est le schéma utilisé par la Webapp. À date, ce schéma est le schéma par défaut (`public`) ;
- DBT lit dans `raw_data`, le schéma d'import des données ;
- DBT écrit dans `public`, le schéma de destination.

### Evolutions du schéma `raw_data`

Dans le cas où on souhaiterait ajouter ou modifier une table du schéma `raw_data`, 
il faut modifier le fichier `migrations/model.py` selon la structure attendue du fichier importé.

Par exemple, on souhaite ajouter la colonne `is_barometre` dans la table `metadata_chantier`, 
on peut ajouter la ligne suivante à la classe `MetadataChantier` : 
``` python 
is_barometre = Column(BOOLEAN)
```

Pour créer la migration de la base associée au changement réalisé, il suffit de : 
``` bash
alembic revision --autogenerate -m "Mon message de commit"
```

Pour toute information complémentaire, [consultez la doc](https://alembic.sqlalchemy.org/en/latest/tutorial.html).

# Schéma des flux de données

Ce document souhaite poser les bases des flux de données alimentant l'application Pilote 2.

L'évolution de ces flux se fera au fur et à mesure de la création et l'évolution de Pilote 2.

## Schéma macro des flux

``` mermaid
graph LR
PM(PPG_metadata) --> PG[(Base PG Pilote 2)]
DFAK(Dump Dfakto) --> PG
PG --> BE(Back-end) --> FE(Front-end)

```

## Zoom sur la partie ingestion de données
### Brique PPG_metdata vers Datawarehouse

Aujourd'hui, le chargement des données se fait manuellement une seule fois
en provenance du répertoire `PPG_metadata`.
A terme, nous devons pouvoir charger les données du serveur SFTP.

``` mermaid
graph LR
PPG(PPG_metdata) --> |view_meta_chantier.csv| PG[(Base PG Pilote 2)]
PPG --> |view_meta_perimetre.csv| PG
PPG --> |view_meta_indicateur.csv| PG
PPG --> |view_meta_zone.csv| PG
PPG --> |view_meta_porteur.csv| PG
PPG --> |ref_indic_type.csv| PG
PPG --> |view_meta_axe.csv| PG
PPG --> |view_meta_ppg.csv| PG
PPG --> |rp_view_data_properties.csv| PG
```

Légende :
- Est appelé `PPG_metdata` le répertoire éponyme qui se propose en interface 
du _dump Dfakto_ avec des données plus facilement exploitables et déjà enrichies.

_NB_ :
- Les données du csv `ref_indic_type` sont importées dans la table `indicateur_type`.

### Brique Dfakto vers Datawarehouse

Pour le moment aucun pipeline de données n'a été implémentée. On peut imaginer des flux suivants :

``` mermaid
graph LR
DFAK(Dump Dfakto) --> |fact_progress.csv| PG[(Base PG Pilote 2)]
DFAK --> |dim_tree_nodes.csv| PG
DFAK --> |fact_progress_reform.csv| PG
DFAK --> |dim_structures.csv| PG
DFAK --> |dim_periods.csv| PG
DFAK --> |fact_financials_enr.csv| PG
```

_NB_ : 
- Les données du csv `fact_progress_reform` sont importées dans la table `fact_progress_chantier`.
- Les données du csv `fact_progress` sont importées dans la table `fact_progress_indicateur_`.

## Zoom sur la partie transformation de données

Dans cette brique datawarehouse, deux schémas de données se distinguent :
- Les données brutes ou `raw_data` qui sont situées dans le schéma `raw_data`.
- Les données transformées et agrégées ou 'ready to use data' qui sont situées dans le schéma `public`.

Il faudrait également mener une réflexion sur la pertinence d'avoir un schéma de données pour les données nettoyées et
pré-processées.

``` mermaid
graph LR
subgraph Base PG Pilote 2
   subgraph raw_data
      M_CHA[metadata_chantier]
      M_PER[metadata_perimetre]
      M_IND[metadata_indicateur]
      M_ZON[metadata_zone]
      D_FPI[fact_progress_indicateur]
      D_FPC[fact_progress_chantier]
      D_DTN[dim_tree_nodes]
      D_DS[dim_structures]
      M_TYPE[indicateur_type]
      M_PORT[metadata_porteur]
      D_FPE[fact_progress_enr]
      D_VDP[view_data_properties]
   end
   subgraph public
      M_PER --> PER[perimetre]
      D_FPC --> CHA
      M_PORT --> CHA
      M_CHA --> CHA[chantier]
      M_ZON --> CHA
      D_DTN --> CHA
      D_DS  --> CHA
      M_CHA --> SDR
      M_ZON --> SDR
      D_VDP --> SDR[synthese_des_resultats]
      M_ZON --> IND
      D_DTN --> IND
      D_DS  --> IND
      D_FPI --> IND
      M_TYPE --> IND
      M_IND --> IND[indicateur]
      D_FPE --> IND
      linkStyle 0,1,2,3,4,5,6 stroke:red;
   end
end
```

*NB* : 
- L'action de `select` correspond à la sélection de colonnes.
- En rouge, les flèches utilisant DBT pour les transformations.
- En blanc, les flèches utilisant PSQL pour la/les transformations.
