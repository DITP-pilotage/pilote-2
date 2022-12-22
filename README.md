## Lancer l'application

### Prérequis

Avoir installé Docker et Docker Compose sur sa machine.

Copier le fichier `.env.example` avec le nom `.env`, et entrez cette
valeur pour la variable d'environnement `DATABASE_URL` :

```env
DATABASE_URL="postgresql://postgresql:secret@localhost:5432/postgresql"
```

Note : ce fichier .env ne sera pas versionné, et sera trouvé automatiquement
par Jest pour lancer les tests.

Démarrer votre service postgres avec Docker Compose :

```bash
docker-compose up -d postgresql
```

Initialiser votre base de tests  :

```bash
npm run database:init
```

### Build & Start

Lancer un build puis un start :

```
npm run build
```

et

```
npm start
```

## Lancer les tests automatisés

Les tests automatisés sont séparés en tests du code client, et tests du code
serveur.

### Tests automatisés client

Pour lancer les tests automatisés unitaires et d'intégration du client :

```bash
npm run test:client
```

Note : pour lancer les tests en mode watch, vous pouvez ajouter cette option à la tâche npm :

```bash
npm run test:client -- --watch
```

### Tests automatisés serveur

#### Tests unitaires

Pour lancer les tests unitaires du serveur :

```bash
npm run test:server:unit
```

#### Tests d'intégration

Lancer les tests d'intégration du serveur nécessite une préparation initiale, car une partie de ces tests nécessitent une base de donnée de tests pour s'exécuter.

La documentation ci-dessous part du principe que vous utilisez Docker pour
avoir une base de donnée de test. Vous pouvez également utiliser votre propre
base Postgres locale par exemple, demandez à l'équipe si vous avez besoin
d'aide pour la configuration.

Prérequis : avoir installé Docker et Docker Compose sur sa machine.

Copier le fichier `.env.example` avec le nom `.env.test`, et entrez cette
valeur pour la variable d'environnement `DATABASE_URL` :

```env
DATABASE_URL="postgresql://postgresql:secret@localhost:5432/postgresql_test"
```

Note : ce fichier .env.test ne sera pas versionné, et sera trouvé
automatiquement par Jest pour lancer les tests.

Démarrer votre service postgres avec Docker Compose :

```bash
docker-compose up -d postgresql
```

Initialisez votre base de tests  :

```bash
npx dotenv -e .env.test -- npm run database:init
```

Note : on utilise dotenv pour faire pointer vers la configuration de test.

Votre base de donnée de test tourne et a la bonne structure, vous pouvez
maintenant lancer les tests d'intégration du serveur :

```bash
npm run test:server:integration
```

Avertissement : si vous n'avez pas de fichier`.env.test` et que vous avez un
fichier `.env`, Jest va le trouver et lancer les tests sur votre base locale de
run ⚠️


### Commandes utiles
| Commande                         | Fonction                                                                               |
|----------------------------------|----------------------------------------------------------------------------------------|
| npm run dev                      | Lance le site en mode développeur (avec hot reload)                                    |
| npm run build                    | Prépare les fichiers (optimisations) afin de pouvoir les mettre en prod                  |
| npm run start                    | Lance un serveur en local qui utilise les fichiers créés pour la production (cf build)  |
| npm run lint                     | Lance le linter ESLint, Typescript et Stylelint                                        |
| npm run lint:fix        | Lance le linter ESLint, Typescript et Stylelint et tente de corriger les erreurs automatiquement |
| npm run test                     | Lance tous les tests (front et back)                                                   |
| npm run test:ci                  | Utilisé par la CI. Lance tous les tests (front et back)                                |
| npm run test:client              | Lance tous les tests côté front (dossier src/client)                                   |
| npm run test:client:unit         | Lance les tests unitaires côté front (dossier src/client)                              |
| npm run test:client:integration  | Lance les tests d'intégration côté front (dossier src/client)                          |
| npm run test:server              | Lance tous les tests côté back (dossier src/server)                                    |
| npm run test:server:unit         | Lance les tests unitaires côté back (dossier src/server)                               |
| npm run test:server:integration  | Lance les tests d'intégration côté back (dossier src/server)                           |
| npm run database:init            | Permet de réinitialiser la base de donnée via Prisma                                   |
| npm run postdeploy          | Utilisé automatiquement lors du déploiement sur Scalingo afin de jouer les migrations Prisma |