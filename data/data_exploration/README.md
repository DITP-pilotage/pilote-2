# Exploration de données des chantiers

### Pré-requis

Afin de pouvoir lancer un notebook, il est nécessaire d'avoir installé sur sa machine :

- [Python 3.9](https://www.python.org/downloads/)
- [Virtualenv](https://virtualenv.pypa.io/en/latest/)

### Installation

Pour créer l'environnement il suffit de :
``` bash
virtualenv venv --python 3.9
```

Une fois l'environnement ``venv`` créé, pour démarrer celui-ci il suffit d'entrer la commande :
``` bash
source venv/bin/activate
```

Installation des dépendances et du package  ``ditp-exploration `` :
``` bash
pip3 install -e .
```

### Notebooks

Démarrer Jupyter Lab en lançant la commande :
``` bash
jupyter lab
```

Si vous souhaitez créer un nouveau notebook, il vous suffit de dupliquer le ``00_template_notebook.ipynb``.
