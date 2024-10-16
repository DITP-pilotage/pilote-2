# Data factory
Ce répertoire administre les pipelines d'import, de chargement et transformation des données de _Pilote V2_. 

## Description


La mise à jour des données de la datafactory se fait automatiquement vie l'exécution du script `scripts/run_datajobs.sh`. La fréquence de mise à jour est définie par le job cron de l'app Scalingo (exemple [pour la dev](https://dashboard.scalingo.com/apps/osc-secnum-fr1/dev-datajobs/resources)).

Les modèles de données *dbt* sont dans le dossier [data_factory/models/](data_factory/models/). La doc *dbt* est générée via `scripts/doc_dbt.sh`.

## Avant de démarrer

### Pré-requis

#### Ajout des variables d'environnement

Copier le fichier `.env.example` vers `.env` :

```bash
cp .env.example .env
```
Pensez à mettre jour le fichier `.env` en demandant les variables à l'équipe.


#### Gestion des packages

Utilisation de [Pipenv](https://pipenv.pypa.io/en/latest/commands.html) pour la gestion des dépendances Python.

Commandes utiles:
```sh
# [Installation de packages]
# Installation des versions exactes du Pipenv.lock
pipenv sync
# /!\ Installation des versions les plus récentes compatibles avec le Pipenv
pipenv install pyarrow
# /!\ Installation des versions les plus récentes compatibles avec le Pipenv
#     -> Attention aux màj cassantes
pipenv update

# [Excécution commandes]
# Exécuter une commande dans l'environnement
pipenv run dbt compile --project-dir data_factory --select model_1
# Exécuter des commandes interactivement dans l'environnement
pipenv shell
```

#### Initialisation des dépendances de DBT

Utilisation des [commandes dbt](https://docs.getdbt.com/reference/dbt-commands):

```sh
# Mise à jour des dépendances
dbt deps --project-dir data_factory
# Exécution d'un modèle
dbt run --project-dir data_factory --select model_1
```

### [docker-conf] Installation

L'application complète a été conteneurisées (partie webapp et data). Pour l'utiliser, il faut se place dans le dossier `data_management/` qui contient un fichier `docker-compose.yml`.

Pour l'utiliser:

- *optionnel* `docker-compose build` pour construire les images Docker nécessaires
- `docker-compose up` pour lancer la base de données, la documentation interactive (dbt et prisma), et la webapp
- *optionnel* `docker-compose run pilote_scripts` pour entrer dans le container et lancer les scripts dbt via `/bin/bash scripts/<name-of-the-script>.sh`
- *optionnel* OU `docker-compose run pilote_scripts scripts/<name-of-the-script>.sh` pour lancer le script dbt `<name-of-the-script>.sh`
- *optionnel* `docker container exec -it pilote_webapp /bin/sh` pour entrer dans le container webapp et éventuellement entrer des commandes (ex: npm, yarn, ...)

Le *reverse-proxy* [Traefik](https://traefik.io/traefik/) est utilisé pour définir les différentes routes. Ainsi, on a:
- `pilote.localhost` : webapp
- `pilote-dbt.localhost` : documentation interactive dbt
- `pilote-prisma.localhost` : prisma studio pour naviguer dans les données

Cette technologie permet de n'exposer qu'un seul port, et d'utiliser des routes simples à mémoriser.

**Attention:** Si vous utilisez cette méthode, il faut modifier la variable d'environnement du fichier [/.env](https://github.com/DITP-pilotage/pilote-2/blob/afab0f538e140b30055335ebf161555b18de3334/.env.example#L24): 
```sh
# Sans Traefik
NEXTAUTH_URL=http://localhost:3000
# Avec Traefik
NEXTAUTH_URL=http://pilote.localhost
```

*Note*: Les containers créés sont:
- `pilote_traefik`: reverse proxy
- `pilote_postgres`: base de données
- `pilote_dbt`: documentation interactive dbt
- `pilote_prisma`: prisma studio
- `pilote_webapp`: webapp




Un exemple complet d'utilisation de docker pour cette partie data pourrait être:

```sh
# Build the image
docker-compose build
# Lancement de la base de données, documentation, et webapp
docker-compose up
# Run prisma migrations
docker-compose run pilote_scripts scripts/0_prisma_migrate.sh
# Run script 1
docker-compose run pilote_scripts scripts/1_dump_dfakto.sh
# and so on for all the scripts
```

Pour exécuter les datajobs via Docker, voir [run_datajobs_docker.sh](./run_datajobs_docker.sh). Il est aussi possible de n'exécuter que les datajobs de production avec la variable d'environnement :

```sh
# Force to run datajobs as in specific env. Leave "" to ignore
FORCE_ENVIRONMENT_DATAJOBS="" # PRODUCTION, DEV, PREPROD
```

### Linting des données

L'outil `SQLFluff` permet d'avoir une écriture consistente du code SQL. Pour lancer le linter sur un fichier:

```sh
# Lancer le linter
pipenv run sqlfluff lint <path-to-file>
# Corriger les erreurs
pipenv run sqlfluff fix <path-to-file>
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
- Si des valeurs sont nulles ou undefined, on les laisse circuler dans la suite des calculs de la datafactory.

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
- poids_pourcent_dept_declaree
- poids_pourcent_reg_declaree
- poids_pourcent_nat_declaree

qui représente la pondération de l'indicateur pour le calcul du ta du chantier. Il est en pourcentage, compris entre 0 et 100.
Ainsi, pour obtenir le ta du chantier, on récupère le ta de ses indicateurs qu'on multiplie par sa pondération.

*8_evolution_indicateur* : cette étape consiste à transposer les va des indicateurs de x lignes pour x va en 1 ligne 
avec une liste de va pour un indicateur donné sur un territoire donné.
Ces données seront ensuite utilisées pour avoir l'historique des va des indicateurs dans le graphe concerné sur _Pilote 2_.

#### Exécution des transformations de la data factory 

Afin d'exécuter les jobs de la data factory, il suffit de :

```bash
/bin/bash scripts/6_fill_tables_marts.sh
```

### Tests sur les données

Des tests sur les données ont été implémentés. Ils sont situés dans le dossier [data_factory/tests](./data_factory/tests). Pour les exécuter, utiliser le script `scripts/test_data.sh` ou via Docker: 

```sh
docker-compose run pilote_scripts scripts/test_data.sh
```

*Note:* Vous pouvez également exécuter uniquement certains tests (en se basant sur le dossier ou les tags associés) comme détaillé dans la [documentation dbt](https://docs.getdbt.com/reference/node-selection/test-selection-examples).


### Mise à disposition des données à _Pilote 2_

Afin de remplir les tables du schéma `public` et ainsi alimenter l'application _Pilote 2_, il faut exécuter le script suivant en local :

```bash
bash scripts/7_fill_tables_public.sh
# ou via docker
docker-compose run pilote_scripts scripts/7_fill_tables_public.sh
```

# Schéma des flux de données

Ce document souhaite poser les bases des flux de données alimentant l'application _Pilote 2_.

L'évolution de ces flux se fera au fur et à mesure de la création et de l'évolution de _Pilote 2_.

## Schéma macro des flux

### Pour les chantiers 
``` mermaid
graph LR
PM(PPG_metadata) --> PG[(Base PG Pilote 2)]
IC(ImportCommentaires) --> PG[(Base PG Pilote 2)]
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

### Zoom moyenne maille dans la base PG Pilote
``` mermaid
graph LR
PM(PPG_metadata) --> RAW(Données brutes)
IC(Import massif de commentaires) --> RAW
MI(Import massif de mesures d'indicateurs) --> RAW
DFAK(Dump Dfakto PS) --> RAW
RAW --> STG(Staging / standardisation)
STG --> MARTS(Marts / data factory)
STG --> INTER(Intermediate / filtre sur les sources)
INTER --> PUBLIC(Exposition à Pilote 2)
STG --> PUBLIC
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

Ou via Docker, puis à l'adresse `pilote-dbt.localhost` (voir la section [Installation](installation)) lors de l'exécution de `docker-compose up`.

### Zoom sur une brique du flux

Dans le lineage graph (ou DAG) affiché sur l'interface web générée par DBT, il est possible de sélectionner une partie du graphe.
En bas dans la case `--select`, vous pouvez écrire par exemple `marts` afin de visualiser le flux à l'intérieur du répertoire `data_factory/models/marts`.
Afin de voir les étapes qui précèdent et sont nécessaires à l'exécution du `marts` il suffit d'écrire `+marts`.
De même, pour les étapes qui succèdent, on peut écrire `marts+`.

Enfin si vous souhaitez comprendre comment une table d'exposition est construite, vous pouvez écrire `+ma_table`.
Par exemple pour la table `objectif_projet_structurant`, on écrira simplement `+objectif_projet_structurant`.
