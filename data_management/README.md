# Data factory
Ce répertoire administre les pipelines d'import, de chargement et transformation des données de _Pilote V2_. 

## Description

Ce projet est décomposé en 2 parties : 
1. Exploration des données issues de _Dfakto_ et du projet _PPG_metadata_ : 
   - Projet Python pour explorer les données du projet.
   - Ces données se situent dans le dossier `input_data`. 
   On mettra les données privées dans le répertoire `private_data` et les données publiques dans `open_data`. 
2. Pipelines d'import, de chargement et transformation des données. L'ensemble de ces pipelines passeront par des scripts.
   - Les jobs d'imports et de transformations sont réalisés avec DBT dans un environnement Python.
   - Enfin les données sont exposées dans des tables dont le schéma est géré par Prisma et exposées à l'application _Pilote 2_.  


## Avant de démarrer

### Pré-requis

#### Version de Python

Il est nécessaire d'avoir la version de Python indiquée dans le Pipfile sur
votre machine, voici les étapes à suivre.

Installer pyenv :

- <https://github.com/pyenv/pyenv#installation>

Installer la bonne version de Python (voir Pipfile, ligne `python_full_version`) :

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

Il faut cloner le répertoire _PPG_metadata_ (demande d'accès à celui-ci à la DITP) dans le répertoire `data_management/input_data/private_data`.
Ce projet est aussi récupérable par token (en le mettant en variable d'environnement) et en exécutant le script `scripts/2_fill_tables_ppg_metadata.sh`.

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

:warning: **En cas de changement de nom ou d'emplacement des fichiers de ppg_metadata, 
pensez à mettre à jour vos variable d'environnnement en local ainsi que sur scalingo 
dans les environnements de dev (dev-datajobs-ditp) et de prod (prod-datajobs-ditp).**

#### Initialisation de l'environnement Python

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

### [docker-conf] Installation

La partie des jobs data a été conteneurisé avec Docker. Pour l'utiliser, il faut se place dans le dossier `data_management/` qui contient un fichier `docker-compose.yml`. Ce fichier contient une [instruction `build`](https://github.com/DITP-pilotage/pilote-2/blob/4b1607af5915ba1b218ae3462434869990565462/data_management/docker-compose.yml#L6-L8) qui va construire une image à partir des instructions du fichier [`Dockerfile-data`](https://github.com/DITP-pilotage/pilote-2/blob/265377fa7be1dc6300d86ced624804348e414609/data_management/Dockerfile-data) dans ce même dossier. Il faut donc:

1. `docker-compose build` pour construire l'image Docker
2. `docker-compose run --service-ports postgres` pour lancer une base de données (si besoin)
3. `docker-compose run --service-ports dbt-pilote scripts/<name-of-the-script>.sh` pour lancer un script du dossier [scripts/](scripts/)

Par exemple, pour servir la documentation (cf section [Visualisation de l'ensemble du flux](visualisation-de-lensemble-du-flux)), exécuter la commande:

```bash

docker-compose run --service-ports dbt-pilote scripts/serve_doc.sh

```


## Hypothèses actuelles pour les transformations

- Les données sources sont importées dans le schéma `raw_data` par l'étape précédente (job d'import);
- Le schéma destination est le schéma utilisé par la Webapp. À date, ce schéma est le schéma par défaut (`public`);
- DBT écrit et lit dans `raw_data`, le schéma d'import des données;
- DBT écrit et lit dans `marts`, le schéma de la data factory;
- DBT écrit dans `public`, le schéma de destination qui alimente l'application _Pilote 2_.

## Usage

### Import des données

#### Import des données en local

Toujours depuis le répertoire data, 
exécuter la commande suivante pour remplir les tables de dfakto :

```bash
bash scripts/1_dump_dfakto.sh
```

Puis pour remplir les tables de _PPG_metadata_ :

```bash
bash scripts/2_fill_tables_ppg_metadata.sh
```

NB: en dev et en production, les données sont remplies automatiquement par des jobs 
tournant toutes les 12 heures (X */12 * * *).

Enfin, afin de réaliser un import massif de commentaires, 
il faut mettre les fichiers à importer dans le répertoire `input_data/private_data/import/commentaires/`. 
Puis exécuter le script suivant :

```bash
bash scripts/3_fill_tables_import_massif_commentaires.sh
```

#### Import massif de commentaires vers la base live :

WARNING : cette étape n'est pas encore automatisée en environnement de DEV et de PROD car il n'existe pas encore d'écran associé dans _Pilote 2_.
Il est donc nécessaire d'exécuter le script manuellement sur ces environnements.

Ouvrir un tunnel vers la base grâce au cli Scalingo (exemple avec la base de DEV) :

```bash
scalingo --region osc-secnum-fr1 -a dev-pilote-ditp db-tunnel SCALINGO_POSTGRESQL_URL
```

Modifier les variables de base PG de votre `.env` pour les faire pointer vers votre tunnel.

Toujours depuis le répertoire data_management :

```bash
bash scripts/3_fill_tables_import_massif_commentaires.sh
```

Si vous rencontrez un problème, pensez à supprimer le dossier target généré par DBT dans le dossier `data_factory`.

NB: après avoir importé les données, coupez le tunnel et changez vos variables d'environnement.


### Standardisation des données 

Afin d'avoir un nommage cohérent une étape de staging est ajoutée dans le schéma `raw_data`. 
Celle-ci va réaliser des vues sur les tables importées.

```bash
bash scripts/5_fill_tables_staging.sh
```

### Data factory

WARNING : cette étape n'est pas encore automatisée en environnement de DEV et de PROD car il n'existe pas encore d'écran associé dans _Pilote 2_.
Il manque également le paramétrage complet des indicateurs afin de pouvoir l'exécuter.

Les transformations des mesures des indicateurs en taux d'avancement d'indicateurs et de chantiers, ou data factory, sont représentés par les étapes du dossier  
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

#### Détails des étapes de calcul de la data factory

*0_faits_indicateur_avec_hypotheses* : cette étape permet d'appliquer les hypothèses suivantes aux données des indicateurs :
- Si plusieurs mesures d'indicateurs (vi, va, vc) sont rentrées à la même date de relevé, alors nous dé-dupliquerons la donnée en prenant la plus récente par date d'import.
- De même, si dans un même mois, nous avons plusieurs mesures à des dates de relevé différentes (par exemple 01/01/2022 et 17/01/2022), seule la dernière date sera retenue.
- Si pas de vi n'est renseignée, alors la première va deviendra la vi.
- Si pas de va alors il n'y aura pas de taux d'avancement.

*1_agregation_geographique* : on commence par découper les calculs des agrégations de manière géographique (départementale, régionale et nationale).
Cela permet, selon le paramétrage, de prendre les valeurs d'une maille donnée afin d'appliquer l'opération d'agrégation du paramétrage (somme ou moyenne)
ou bien de sélectionner les données rentrées par l'utilisateur.

*2_pivot_faits_indicateur* : on réalise un pivot sur la table précédente afin d'obtenir 3 colonnes pour les valeurs : initiales, actuelles et cibles).
La colonne metric_type est donc divisée en 3. 

*3_fill_vi_vca_vcg* : dans cette étape, on réalise 3 actions : on fait descendre la valeur initiale la plus ancienne jusqu'à rencontrer une nouvelle valeur initiale,
que l'on fait descendre à son tour. De telle sorte que toutes les lignes de la table aient une valeur initiale non nulle.
Ensuite, on crée une colonne valeur cible annuelle dans laquelle on fait remonter sur les lignes précédentes, la valeur cible qui est la plus proche de la date de relevé de la ligne.
On crée aussi une colonne valeur cible globale qui fait remonter la valeur cible la plus ancienne que l'on a sur toutes les lignes de cette colonne.

*4_decumul_va* : Certaines valeurs actuelles sont renseignées en cumuler (ex: on somme le nombre de kilomètres construits) ou bien en décumuler.
Dans le paramétrage des indicateurs, on a un paramètre nécessaire, que l'on découpe en 2 dans le staging :
- param_vaca_decumul_from est de la forme "condition_decumule::date". 

On crée donc les colonnes decumul_va_par et decumul_va_depuis. Avec ces paramètres, on peut décumuler la va si nécessaire, à partir d'une date custom, d'un nombre de mois ou du début de l'année,...

*5_calcul_vaca_vacg* : cette étape permet de calculer la valeur actuelle comparable des indicateurs. 
Pour cela, il est nécessaire de prendre la valeur va décumulée à l'étape précédente et de, selon le paramétrage, 
l'agréger sur une durée donnée en paramètre. On a les paramètres :
- param_vaca_partition_date : qui détermine depuis quand on agrège les va décumulées
- param_vaca_op : qui donne l'opération à réaliser pour agréger les données (somme ou moyenne)

*6_calcul_ta_indicateur* : on applique la formule classique sur tous les indicateurs pour obtenir 
- le taux d'avancement annuel : (vaca-vi) / (vca-vi)
- le taux d'avancement global : (vacg-vi) / (vcg-vi)

*7_calcul_ta_chantier* : pour obtenir les taux d'avancement annuel et global du chantier, on récupère les paramètres :
- poids_pourcent_dept
- poids_pourcent_reg
- poids_pourcent_nat

qui représente la pondération de l'indicateur pour le calcul du ta du chantier. Il est en pourcentage, compris entre 0 et 100.
Ainsi, pour obtenir le ta du chantier, on récupère le ta de ses indicateurs qu'on multiplie par sa pondération.

*8_evolution_indicateur* : cette étape consiste à transposer les va des indicateurs de x lignes pour x va en 1 ligne 
avec une liste de va pour un indicateur donné sur un territoire donné.
Ces données seront ensuite utilisées pour avoir l'historique des va des indicateurs dans le graphe concerné sur _Pilote 2_.

#### Exécution des transformations de la data factory 

Afin d'exécuter les jobs de la data factory, il suffit de :

```bash
bash scripts/6_fill_tables_marts.sh
```

### Mise à disposition des données à _Pilote 2_

Afin de remplir les tables du schéma `public` et ainsi alimenter l'application _Pilote 2_, il faut exécuter le script suivant en local :

```bash
bash scripts/7_fill_tables_public.sh
```

# Schéma des flux de données

Ce document souhaite poser les bases des flux de données alimentant l'application _Pilote 2_.

L'évolution de ces flux se fera au fur et à mesure de la création et de l'évolution de _Pilote 2_.

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

## Visualisation de l'ensemble du flux

Afin de mieux visualiser le DAG à l'intérieur du projet, nous vous proposons de vous référer à la doc générée par DBT.
Il est possible d'y avoir accès en exécutant la commande suivante : 

```bash
source .env
dbt docs generate --project-dir data_factory/  && dbt docs serve --project-dir data_factory/
```

Cette ligne de commande ouvrira une interface web avec laquelle vous pourrez interagir. 
Une petite icône bleue en bas à droite indique le DAG pour visualiser le flux.

Ou via Docker, puis à l'adresse `localhost:8088` (voir la section [Installation](installation)):
```bash
docker-compose run --service-ports dbt-pilote scripts/serve_doc.sh
```

### Zoom sur une brique du flux

Dans le lineage graph (ou DAG) affiché sur l'interface web générée par DBT, il est possible de sélectionner une partie du graphe.
En bas dans la case `--select`, vous pouvez écrire par exemple `marts` afin de visualiser le flux à l'intérieur du répertoire `data_factory/models/marts`.
Afin de voir les étapes qui précèdent et sont nécessaires à l'exécution du `marts` il suffit d'écrire `+marts`.
De même, pour les étapes qui succèdent, on peut écrire `marts+`.

Enfin si vous souhaitez comprendre comment une table d'exposition est construite, vous pouvez écrire `+ma_table`.
Par exemple pour la table `objectif_projet_structurant`, on écrira simplement `+objectif_projet_structurant`.


_____
# La suite de la DOC est dépréciée
La doc auto générée par DBT peut suffire à la remplacer. 

### Brique PPG_metdata vers Datawarehouse

Aujourd'hui, le chargement des données se fait manuellement une seule fois
en provenance du répertoire `PPG_metadata`.
À terme, nous devons pouvoir charger les données du serveur SFTP.

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
