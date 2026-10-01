# kpilote-api

API REST de kpilote (package `@pilote/kpilote-api`). Elle expose les indicateurs, référentiels, individus, collections, valeurs et commentaires consommés par [kpilote-webapp](../kpilote-webapp) et [kpilote-admin](../kpilote-admin), ainsi que par des clients tiers via clé API.

## Stack

- **Hono** + `@hono/zod-openapi` (routes typées, spec OpenAPI générée)
- **Prisma 7** (adapter `pg`) sur **PostgreSQL 17**, avec requêtes typées `prisma/sql/*.sql` (`generate --sql`)
- **Zod 4**, **neverthrow**, **pino**
- **Vite** pour le dev (`@hono/vite-dev-server`) et le build (`@hono/vite-build`)
- **Vitest** (tests d'intégration sur une vraie base)
- Schémas partagés avec les fronts via [`@pilote/kpilote-shared`](../../packages/kpilote-shared)

## Démarrage

```bash
cp .env.example .env               # renseigner les secrets
docker compose up -d               # postgres (5434) + postgres_test (5435)
pnpm database:init                 # prisma migrate reset (migrations + seed)
pnpm dev                           # https://kpilote-api.modernisation.localhost
```

Depuis la racine du monorepo : `pnpm dev:kpilote-api`.

Le dev passe par [portless](https://www.npmjs.com/package/portless), qui sert l'app sur un domaine `*.localhost` en HTTPS. La documentation interactive est exposée sur `/docs` (Swagger UI) et la spec sur `/openapi.json`.

## Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Connexion PostgreSQL |
| `CORS_ORIGINS` | Origines autorisées, séparées par des virgules |
| `OIDC_ISSUER_URL`, `OIDC_USERINFO_URL`, `OIDC_JWKS_URI`, `OIDC_AUDIENCE` | Validation des tokens ProConnect |
| `KEYCLOAK_ISSUER_URL`, `KEYCLOAK_JWKS_URI`, `KEYCLOAK_AUDIENCE` | Validation des tokens Keycloak |
| `API_KEY_HMAC_SECRET` | Secret HMAC (≥ 32 caractères) des clés API |
| `ALBERT_API_KEY` | Optionnel — active la normalisation d'imports par le LLM Albert |
| `LOG_LEVEL`, `LOG_TO_DATABASE` | Niveau de log, persistance des logs en base |
| `MAX_ASYNC_CONCURRENCY` | Parallélisme des traitements asynchrones |
| `ACME_UPLOAD_API_KEY` | Optionnel — clé Bearer du dépôt des challenges ACME ([renouvellement SSL](../../.github/workflows/README-renouvellement-ssl.md)) |

Le schéma est validé au démarrage dans `src/env.ts`. Les tests lisent `.env.test`.

## Authentification

Toutes les routes métier passent par `requireAuthentication`. Le header `Authorization: Bearer <token>` accepte :

- un **access token JWT** émis par ProConnect ou Keycloak (utilisateurs de la webapp) ;
- une **clé API** au format `pilote_live_<secret>` (partenaires, kpilote-admin), rôle `CONTRIBUTOR` ou `ADMIN`.

Détails dans [`docs/architecture/auth-design.md`](docs/architecture/auth-design.md) et [`docs/architecture/permissions-design.md`](docs/architecture/permissions-design.md).

## Organisation du code

```
src/
├── app.ts              Assemblage des routes, OpenAPI, CORS, contexte auth/DB
├── index.ts            Point d'entrée serveur
├── env.ts              Variables d'environnement (Zod)
├── framework/          Briques transverses : auth, erreurs, logger, openapi, persistence…
├── <domaine>/          Un dossier par sous-système (indicateur, collection, valeurImport…)
│   ├── routes.ts       Routes OpenAPI du domaine
│   ├── queries/        Lectures
│   └── commands/       Écritures
├── generated/prisma/   Client Prisma généré (ne pas éditer)
└── test/               Helpers de test (integrationTest, fixtures, buildTestApp…)
prisma/
├── schema.prisma
├── migrations/
├── sql/                Requêtes SQL brutes typées
├── seed.ts             Jeu de données de démonstration
└── seedData/
```

Les alias `@/` sont déclarés **dossier par dossier** dans `tsconfig.json` : tout nouveau sous-système doit y ajouter son entrée `@/<dossier>/*`.

## Commandes

```bash
pnpm dev                  # Serveur de dev
pnpm build                # migrate deploy + generate --sql + vite build
pnpm start                # Serveur de production (dist/index.js)
pnpm test                 # Tests (base de test sur le port 5435)
pnpm lint                 # oxlint + tsc + prettier
pnpm lint:fix
pnpm format
```

### Base de données

```bash
pnpm database:migration   # prisma migrate dev (nouvelle migration)
pnpm prisma:generate      # prisma generate --sql (à relancer après une migration)
pnpm database:init        # Reset complet + seed
pnpm db:seed              # Seed seul
```

`prisma generate --sql` introspecte les tables réelles : la base doit être à jour de ses migrations.

### Scripts

```bash
pnpm api-key:generate --secret=<hmac> [--label=<label>] [--admin] [--expires-at=YYYY-MM-DD]
pnpm feature:creer --key=<KEY> --nom="<nom>" [--etat=DESACTIVE|ACTIVE|ACTIVE_POUR_UTILISATEUR]
```

- `api-key:generate` imprime une clé en clair et le SQL d'insertion à exécuter manuellement ; il ne touche pas la base.
- `feature:creer` scaffolde une migration Prisma qui insère un feature flag.

## Tests

Les tests d'intégration tournent sur la base `postgres_test` (port 5435). Le `globalSetup` applique les migrations, puis chaque test enveloppé dans `integrationTest(...)` s'exécute dans une transaction annulée à la fin. Les tests sont lancés en parallèle.

## Déploiement

Déployée sur Scalingo avec `APP_PACKAGE=@pilote/kpilote-api` :

1. `deploy:prepare` copie le `.slugignore` de l'app à la racine ;
2. `build` applique les migrations et compile ;
3. `deploy:bundle` produit `kpilote-api-deploy/` (`pnpm deploy --prod`) et copie `start.sh` à la racine.

Le seed n'est **pas** joué au build : il est lancé sur `dev-kpilote-api` par le workflow `.github/workflows/seed-kpilote-dev.yml` (au merge d'une modification du seed, ou manuellement).

## Documentation

Les documents de conception sont dans [`docs/architecture/`](docs/architecture) : authentification, permissions, collections, taux de progression, valeurs et objectifs dérivés.
