# Procédures tech 

Ce document détaille les procédures techniques pour lancer le projet et le faire fonctionner au quotidien.


## Variables d'environnement et utilisation

Les variables d'environnement à configurer sont:
- webapp: fichier [.env](./.env.example) + utilisation de [convict](https://www.npmjs.com/package/convict) pour la documentation des variables d'environnement et leurs valeurs par défaut. 
- datajobs: fichier [.env](./data_management/.env.example) 


## Lancer l'application en mode dev

Les étapes suivantes sont nécessaires pour lancer le projet pour le développement. 

Les étapes *3,4,5* sont optionnelles si l'on ne souhaite pas faire un refresh complet.

1. Lancer la base de données
2. Lancer webapp
3. (opt) (Ré)initialiser la base de données
4. (opt) Lancer les datajobs en mode *full*
5. (opt) Faire une descente de prod
6. Lancer les datajobs en mode normal

Scénari utiles:
- Lancement de zéro: *1,2,3,4,5,6*
- Lancer le projet au quotidien: *1,2*
- Exécuter les datajobs au quotidien: *6*

Via Docker:

```sh
# [docker]
## (1) et (2) Lancer la db et la webapp
docker compose up
## (3) Initialiser la base de données
docker compose run --rm pilote_webapp /bin/bash scripts/prisma_reset_and_migrate.sh
## (4) Lancer les datajobs en mode *full*
cd data_management
FULL_DJ=true docker compose run --rm -e FULL_DJ pilote_datajobs
## (5) Faire une descente de prod
cd ..
docker compose run --rm descente_de_prod
## (6) Lancer les datajobs en mode normal
cd data_management
FULL_DJ=false docker compose run --rm -e FULL_DJ pilote_datajobs
## Optionnel: Relancer la db et la webapp
cd ..
docker compose restart
```

En local:

```sh
# [local]
## (1) Lancer une db postgres
## (2) Lancer la webapp
npm run dev
## (3) Initialiser la base de données
bash scripts/prisma_reset_and_migrate.sh
## (4) Lancer les datajobs en mode *full*
cd data_management
FULL_DJ=true pipenv run bash scripts/run_datajobs.sh
## (5) Faire une descente de prod
cd ..
bash scripts/descente_de_prod_partielle.sh
## (6) Lancer les datajobs en mode normal
FULL_DJ=false pipenv run bash scripts/run_datajobs.sh
```

Pour éviter de lancer ces scripts un par un, vous pouvez créer des **scripts personnalisés** (*script daily*) dans le dossier [scripts/daily](./scripts/daily).

## Détail des scripts

Dans le point précédent, nous avons utilisé 2 dossiers scripts:

- pour la base de données (init prisma et descente de prod) [scripts](./scripts)
- pour les datajobs (exécution des calculs) [data_management/scripts](./data_management/scripts)
- pour les taches quotidiennes [scripts/daily](./scripts/daily)

Un fichier `README.md` détaille leur utilisation (via docker ou non) dans chaque dossier.


### Lancer les tests et les linters

TODO refresh 

Afin de s'assurer que tous les tests et que les linters sont au vert avant de démarrer le développement lancer les deux commandes 

```sh
npm run test 
npm run lint
```


## Lancer l'application en mode production

Avec Docker:

```sh
# [docker]
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up
# puis visiter http://localhost:8686
```

En local:

```sh
# [local]
npm run build
npm run start
```

## Commandes utiles

TODO nettoyer les commandes inutiles (+ dans package.json):

| Commande                                    | Fonction                                                                                    |
|---------------------------------------------|---------------------------------------------------------------------------------------------|
| npm run dev                                 | Lance le site en mode développeur (avec hot reload)                                         |
| npm run build                               | Prépare les fichiers (optimisations) afin de pouvoir les mettre en prod                     |
| npm run start                               | Lance un serveur en local qui utilise les fichiers créés pour la production (cf build)      |
| npm run lint                                | Lance le linter ESLint, Typescript et Stylelint                                             |
| npm run lint:fix                            | Lance le linter ESLint et Stylelint et tente de corriger les erreurs automatiquement        |
| npm run lint:eslint                         | Lance le linter ESLint                                                                      |
| npm run lint:tsc                            | Lance le linter Typescript                                                                  |
| npm run lint:stylelint                      | Lance le linter Stylelint                                                                   |
| npm run test                                | Lance tous les tests (front et back)                                                        |
| npm run test:ci                             | Utilisé par la CI. Lance tous les tests (front et back)                                     |
| npm run test:client                         | Lance tous les tests côté front (dossier src/client)                                        |
| npm run test:client:unit                    | Lance les tests unitaires côté front (dossier src/client)                                   |
| npm run test:client:integration             | Lance les tests d'intégration côté front (dossier src/client)                               |
| npm run test:client:coverage                | Lance les tests d'intégration côté front et permet d'obtenir le code coverage               |
| npm run test:server                         | Lance tous les tests côté back (dossier src/server)                                         |
| npm run test:server:unit                    | Lance les tests unitaires côté back (dossier src/server)                                    |
| npm run test:server:integration             | Lance les tests d'intégration côté back (dossier src/server)                                |
| npm run test:server:domain:coverage         | Lance les tests du dossier domain dans le back et permet d'obtenir le code coverage         |
| npm run test:server:infrastructure:coverage | Lance les tests du dossier infrastructure dans le back et permet d'obtenir le code coverage |
| npm run test:database:init                  | Permet de réinitialiser la base de donnée de test sans aucune données                       |
| npm run database:init                       | Permet de réinitialiser la base de donnée sans aucune données                               |
| npm run database:seed                       | Permet de réinitialiser la base de donnée et de la populer avec un jeu de test              |
| npm run postdeploy                          | Utilisé automatiquement lors du déploiement sur Scalingo afin de jouer les migrations Prisma|
| npm ci                                      | Installation et mise à jour des dépendance node                                             |
