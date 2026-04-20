Ce dossier `api` contient l'implémentation des endpoints API de la Webapp.

Note : le dossier `src/pages/api` de Next.js ne gère que ce qui est routing, et pointe vers les fichiers de ce répertoire.

Note : On souhaite conserver une correspondance entre l'arborescence du répertoire `src/pages/api`, guidé par les routes, et l'arborescence de ce répertoire `api` : quand un fichier existe dans le répertoire `src/pages/api`, il existe au même endroit dans ce répertoire `api`. L'inverse n'est pas vrai, ce qui permet d'avoir dans ce répertoire `api` des tests et des modules utilitaires (par exemple pour le parsing de requêtes) qui ne génèrent pas de routes HTTP.
