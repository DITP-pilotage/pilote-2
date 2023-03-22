# PILOTE 

## Docker (facultatif)
Un fichier `docker-compose.yml` se trouve à la racine du projet et permet de démarrer simplement le projet si vous le souhaitez

> Avertissement : le hot reload ne fonctionnera pas sur l'application NextJS si vous utilisez docker ⚠️

<br />

--------------
<br />

## Lancer l'application en mode dev

### Prérequis
- Avoir un serveur postgresql disponible et démarré
- Créer une base de donnée `pilote` par exemple
- Copier le fichier `.env.example` avec le nom `.env`, et bien mettre à jour la variable d'environnement `DATABASE_URL`

### Initialiser la base de données
- Créer les tables et populer la base avec un jeu de test (attention cette action peut prendre du temps [> 30 secondes])
```bash
npm run database:seed
```

### Lancer le serveur de développement
```bash
npm run dev
```
<br />

--------------------
<br />

## Lancer les tests et les linters
### Prérequis
- Avoir un serveur postgresql disponible et démarré
- Créer une base de donnée `pilote_test` par exemple
- Copier le fichier `.env.example` avec le nom `.env.test`, et bien mettre à jour la variable d'environnement `DATABASE_URL`

> Avertissement : si vous n'avez pas de fichier`.env.test` et que vous avez un fichier `.env`, Jest va le trouver et lancer les tests sur votre base locale de run ⚠️

### Initialiser la base de données
- Créer les tables avec la commande suivante
```bash
npm run test:database:init
```

### Lancer les tests et les linters
- Afin de s'assurer que tous les tests et que les linters sont au vert avant de démarrer le développement lancer les deux commandes 
```bash
npm run test 
npm run lint
```

### Complément d'informations
- Il existe de nombreuses sous commandes permettant de lancer les tests de manière isolés (unitaire, intégration, client, server). Se référer au package.json pour plus d'informations.
- Afin de lancer les tests en mode watch, vous pouvez ajouter cette option `-- --watch` à la tâche npm :
```bash
npm run test:client -- --watch
```
<br />

-------
<br />

## Lancer l'application en mode production

### Prérequis
- Avoir suivi les étapes pour avoir lancer l'application en mode dev
- Ne pas avoir le serveur de développement de lancé

### Générer l'app de prod et lancer un serveur en local
```bash
npm run build
npm run start
```
<br />

--------------------
<br />

## Commandes utiles
| Commande                                        | Fonction                                                                                    |
|-------------------------------------------------|---------------------------------------------------------------------------------------------|
| npm run dev                                     | Lance le site en mode développeur (avec hot reload)                                         |
| npm run build                                   | Prépare les fichiers (optimisations) afin de pouvoir les mettre en prod                       |
| npm run start                                   | Lance un serveur en local qui utilise les fichiers créés pour la production (cf build)       |
| npm run lint                                    | Lance le linter ESLint, Typescript et Stylelint                                             |
| npm run lint:fix                                 | Lance le linter ESLint et Stylelint et tente de corriger les erreurs automatiquement        |
| npm run lint:eslint                             | Lance le linter ESLint                                                                      |
| npm run lint:tsc                                | Lance le linter Typescript                                                                  |
| npm run lint:stylelint                          | Lance le linter Stylelint                                                                   |
| npm run test                                    | Lance tous les tests (front et back)                                                        |
| npm run test:ci                                 | Utilisé par la CI. Lance tous les tests (front et back)                                     |
| npm run test:client                             | Lance tous les tests côté front (dossier src/client)                                        |
| npm run test:client:unit                        | Lance les tests unitaires côté front (dossier src/client)                                   |
| npm run test:client:integration                 | Lance les tests d'intégration côté front (dossier src/client)                               |
| npm run test:client:coverage                    | Lance les tests d'intégration côté front et permet d'obtenir le code coverage               |
| npm run test:server                             | Lance tous les tests côté back (dossier src/server)                                         |
| npm run test:server:unit                        | Lance les tests unitaires côté back (dossier src/server)                                    |
| npm run test:server:integration                 | Lance les tests d'intégration côté back (dossier src/server)                                |
| npm run test:server:domain:coverage             | Lance les tests du dossier domain dans le back et permet d'obtenir le code coverage         |
| npm run test:server:infrastructure:coverage     | Lance les tests du dossier infrastructure dans le back et permet d'obtenir le code coverage |
| npm run test:database:init                      | Permet de réinitialiser la base de donnée de test sans aucune données                       |
| npm run database:init                           | Permet de réinitialiser la base de donnée sans aucune données                               |
| npm run database:seed                           | Permet de réinitialiser la base de donnée et de la populer avec un jeu de test              |
