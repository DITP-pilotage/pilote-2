This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

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
