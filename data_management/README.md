# Data factory
Ce répertoire administre les pipelines d'imports, de chargement et transformation des données de _Pilote V2_. 

## Description

Ce projet est décomposé en 2 parties : 
1. Exploration des données issues de _Dfakto_ et du projet _PPG_metadata_ : 
   - Projet python pour explorer les données du projet.
   - Ces données se situent dans le dossier `input_data`. 
   On mettra les données privées dans le repertoire `private_data` et les données publiques dans `open_data`. 
2. Pipelines d'imports, de chargement et transformation des données. L'ensemble de ces pipelines passeront par des scripts.
   - Les jobs d'imports et de transformations seront réalisés avec DBT dans un environnement python.
   - Enfin les données sont exposées dans des tables dont le schéma est géré par Prisma et exposées à l'application Pilote.  


## Avant de démarrer

### Pré-requis

#### Version de Python

Il est nécessaire d'avoir la version de Python indiquée dans le Pipfile sur
votre machine, voici les étapes à suivre.

Installer pyenv :

- <https://github.com/pyenv/pyenv#installation>

Insaller la bonne version de Python (voir Pipfile, ligne `python_full_version`) :

- <https://github.com/pyenv/pyenv#install-additional-python-versions>

Installer pipenv :

- <https://pipenv.pypa.io/en/latest/installation/>

Avoir docker ou un outil de containerisation :

- <https://www.docker.com/>

#### Webapp et SQL

Il faut avoir configuré et initialisé votre base de données de Webapp comme précisé dans le README.md à la racine du projet.
Pour la suite du projet, il faut s'assurer que la base de données soit démarrée.

Le client Postgres `psql` est également nécessaire pour les scripts d'import :

- <https://www.postgresql.org/download/>

### Installation

Les projets et pipelines s'appuient sur des métadonnées à récupérer en provenance de plusieurs sources.

Clonez le répertoire PPG_metadata (demande d'accès à celui-ci à la DITP) dans le répertoire `data_management/input_data/private_data`.
Ce projet est aussi récupérable par token (en le mettant en variable d'environnement) et en executant le script `scripts/2_fill_tables_ppg_metadata.sh`.

On se retrouve avec une arborescence qui ressemble à cela :

```
data_management/input_data/private_data/
└── PPG_metadata
    ├── CONTRIBUTING.md
    ├── PPG_metadata.Rproj
    ├── README.md
    ├── 1_roles_definition
    ├── barometre_data
    ├── config_calculs
    ├── config_viz
    ├── docs
    ├── generators
    ├── ingestion
    ├── models
    └── views
```

#### Ajout des variables d'environnement

Copier le fichier `/.env.example` vers `/data_management/.env` :

```bash
cp ../.env.example .env
```

Pensez à mettre jour le fichier `.env` en demandant les variables à l'équipe.

#### Initialisation de l'environnement python

Afin d'installer les dépendances liées au projet, il faut exécuter la commande suivante :

```bash
pipenv install
```

Afin de démarrer l'environnement :

```bash
pipenv shell
```

#### Initialisation des dépendances de DBT

```bash
dbt deps --project-dir data_factory
```



## Hypothèses actuelles pour les transformations

- Les données sources sont importées dans le schéma `raw_data` par l'étape précédente (job d'import) ;
- Le schéma destination est le schéma utilisé par la Webapp. À date, ce schéma est le schéma par défaut (`public`) ;
- DBT écrit et lit dans `raw_data`, le schéma d'import des données ;
- DBT écrit et lit dans `marts`, le schéma de la data factory ;
- DBT écrit dans `public`, le schéma de destination qui aliment l'application Pilote 2.

## Usage

### Import des données

#### Import des données local

Toujours depuis le répertoire data, 
executer la commande suivante pour remplir les tables de dfakto :

```bash
bash scripts/1_dump_dfakto.sh
```

Puis pour remplir les tables de ppg_metadata :

```bash
bash scripts/2_fill_tables_ppg_metadata.sh
```

NB : en dev et en production, les données sont remplis automatiquement par des jobs 
tournant toutes les 12 heures (X */12 * * *)

Enfin, afin de réaliser un import massif de commentaires, 
il faut mettre les fichiers à importer dans le répertoire `input_data/private_data/import/commentaires/`. 
Puis exécuter le script suivant :

```bash
bash scripts/3_fill_tables_import_massif_commentaires.sh
```

#### Import massif de commentaire vers la base live :

WARNING : cette étape n'est pas encore automatisée en env de DEV et PROD car il n'existe pas encore d'écran associé dans pilote.
Il est donc nécessaire d'exécuter le script manuellement sur ces environnement.

Ouvrir un tunnel vers la base grâce au cli Scalingo (exemple avec la base de DEV) :

```bash
scalingo --region osc-secnum-fr1 -a dev-pilote-ditp db-tunnel SCALINGO_POSTGRESQL_URL
```

Modifier les variables de base PG de votre `.env` pour les faire pointer vers votre tunnel.

Toujours depuis le répertoire data :

```bash
bash scripts/3_fill_tables_import_massif_commentaires.sh
```

Si vous rencontrez un problème, pensez à supprimer le dossier target généré par DBT dans le dossier `data_factory`.

NB: après avoir importer les données, coupez le tunnel et changer vos variables d'environnement.


### Standardisation des données 

Afin d'avoir un nommage cohérent une étape de staging est ajoutée dans le schéma `raw_data`. 
Celle-ci va réaliser des vues sur les tables importés.

```bash
bash scripts/5_fill_tables_staging.sh
```

### Data factory

WARNING : cette étape n'est pas encore automatisée en env de DEV et PROD car il n'existe pas encore d'écran associé dans pilote.
Il manque également le paramétrage des indicateurs afin de pouvoir l'exécuter.

Les transformations des mesures des indicateurs en taux d'avancement, ou datafactory, sont représentés par les étapes du dossier  
`models/marts`.

```
data_factory/models/
└── marts
    ├── 0_faits_indicateur_avec_hypotheses
    ├── 1_agregation_geographique
    ├── 2_pivot_faits_indicateur
    ├── 3_fill_vi_vca_vcg
    ├── 4_decumul_va
    ├── 5_calcul_vaca_vacg
    ├── 6_calcul_ta_indicateur
    ├── 7_calcul_ta_chantier
    └── 8_evolution_indicateur
```

#### Détail des étapes de calcul de la data factory

*0_faits_indicateur_avec_hypotheses* : cette étape permet d'appliquer les hypothèses suivantes aux données des indicateurs :

*1_agregation_geographique* : on commence par découper les calculs des agrégations de manière géographique (départementale, régionale et nationale).
Cela permet, selon le paramétrage, de prendre les valeurs d'une maille donnée afin d'appliquer l'opération d'agrégation du paramétrage 
ou bien de sélectionner les données rentrées par l'utilisateur.

*2_pivot_faits_indicateur* : 

*3_fill_vi_vca_vcg* : 

*4_decumul_va* : 

*5_calcul_vaca_vacg* : 

*6_calcul_ta_indicateur* : 

*7_calcul_ta_chantier* : 

*8_evolution_indicateur* : 


#### Execution des transformation de la data factory 

Afin d'exécuter les jobs de la data factory il suffit de :

```bash
bash scripts/6_fill_tables_marts.sh
```

### Mise à disposition des données à Pilote 2

Afin de remplir les tables du schéma `public` et ainsi alimenter l'application Pilote 2, il faut exécuter le script suivant en local:

```bash
bash scripts/7_fill_tables_public.sh
```

# Schéma des flux de données

Ce document souhaite poser les bases des flux de données alimentant l'application Pilote 2.

L'évolution de ces flux se fera au fur et à mesure de la création et l'évolution de Pilote 2.

## Schéma macro des flux

### Pour les chantiers 
``` mermaid
graph LR
PM(PPG_metadata) --> PG[(Base PG Pilote 2)]
PT(ImportCommentaires) --> PG[(Base PG Pilote 2)]
DFAK(Dump Dfakto Chantier) --> PG
PG --> BE(Back-end) --> FE(Front-end)
```

### Pour les projets structurants 
``` mermaid
graph LR
PM(PPG_metadata) --> PG[(Base PG Pilote 2)]
DFAK(Dump Dfakto PS) --> PG
PG --> BE(Back-end) --> FE(Front-end)
```

## Zoom sur la partie ingestion de données

Afin de mieux visualiser le DAG à l'intérieur du projet, nous vous proposons de vous référer à la doc générée par DBT.
Il est possible d'y avoir accès en executant la commande suivante : 

```bash
dbt docs generate --project-dir data_factory/  && dbt docs serve --project-dir data_factory/
```

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
PPG --> |ref_chantier_meteo.csv| PG
PPG --> |view_meta_axe.csv| PG
PPG --> |view_meta_ppg.csv| PG
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
DFAK --> |fact_progress_reform.csv| PG
DFAK --> |fact_financials_enr.csv| PG
DFAK --> |dim_tree_nodes.csv| PG
DFAK --> |dim_structures.csv| PG
DFAK --> |dim_periods.csv| PG
DFAK --> |rp_view_data_properties.csv| PG
```

_NB_ : 
- Les données du csv `fact_progress_reform` sont importées dans la table `fact_progress_chantier`.
- Les données du csv `fact_progress` sont importées dans la table `fact_progress_indicateur`.

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
      linkStyle 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16 stroke:red;
   end
end
```

*NB* : 
- L'action de `select` correspond à la sélection de colonnes.
- En rouge, les flèches utilisant DBT pour les transformations.
- En blanc, les flèches utilisant PSQL pour la/les transformations.
