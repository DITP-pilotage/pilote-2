# Exploration de données des chantiers

### Pré-requis

Afin de pouvoir lancer un notebook, il est nécessaire d'avoir installé sur sa machine :

- [Python 3.9](https://www.python.org/downloads/)
- [Conda](https://docs.conda.io/projects/conda/en/latest/user-guide/install/index.html)

### Installation

Installer l'environnement avec le Makefile.

Pour créer l'environnement il suffit de :
``` bash
make conda_env
```

Une fois l'environnement créé, pour démarrer celui-ci il suffit d'entrer la commande :
``` bash
conda activate ditp-exploration
```
NB: Il faut relancer cette commande dans chaque terminal "relié" au projet.


Installer les dépendances :
``` bash
make dependencies
```

Lancer cette commande afin de rendre disponible l'environnement à nos notebooks :

``` bash
python -m ipykernel install --user --name=ditp-exploration
```

Ajouter les données du ``dump_dfackto_octo`` au dossier `data/data_exploration/data`.

### Notebooks

Démarrer un notebook en lançant la commande :
``` bash
jupyter notebook
```

Si vous souhaitez créer un nouveau notebook, il vous suffit de dupliquer le ``00_template_notebook.ipynb``.
