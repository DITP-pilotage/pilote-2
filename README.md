# Pilote — Monorepo

Outil de pilotage territorial pour le suivi des politiques publiques.

Le monorepo regroupe deux familles d'applications :

- **Pilote PPG** : l'application historique de pilotage des Politiques Prioritaires du Gouvernement (Next.js), avec son Keycloak et son pipeline de données.
- **kpilote** : la nouvelle plateforme, composée d'une API, d'une webapp, d'un back-office et de deux packages partagés.

Les deux familles sont indépendantes : `pilote-ppg` n'utilise aucun package `kpilote-*`.

## Structure

```
pilote/
├── apps/
│   ├── pilote-ppg/                  Application PPG (Politiques Prioritaires du Gouvernement)
│   │   ├── src/                     Code source (client + server)
│   │   ├── tests/                   Tests E2E (Playwright)
│   │   └── ...
│   ├── pilote-ppg-auth/             Keycloak (authentification)
│   ├── pilote-ppg-data-management/  Pipeline dbt (Python)
│   ├── kpilote-api/                 API REST kpilote (Hono + Prisma)
│   ├── kpilote-webapp/              Webapp kpilote (React + TanStack Router, BFF Hono)
│   └── kpilote-admin/               Back-office kpilote multi-environnement (clé API)
├── packages/
│   ├── kpilote-shared/              Schémas Zod et logique pure partagés
│   ├── kpilote-ui/                  Composants React et thème Tailwind partagés
│   └── kpilote-acme/                Routes Hono du challenge ACME (renouvellement SSL)
├── scripts/                         Outillage du monorepo (campagne de dépendances)
├── package.json                     Scripts d'alias vers le workspace actif
├── pnpm-workspace.yaml              Configuration workspaces
└── pnpm-lock.yaml                   Lockfile unique
```

| Projet | Package | README |
| --- | --- | --- |
| pilote-ppg | `@pilote/ppg` | [apps/pilote-ppg](apps/pilote-ppg/README.md) |
| pilote-ppg-auth | — | [apps/pilote-ppg-auth](apps/pilote-ppg-auth/README.md) |
| pilote-ppg-data-management | — | [apps/pilote-ppg-data-management](apps/pilote-ppg-data-management/README.md) |
| kpilote-api | `@pilote/kpilote-api` | [apps/kpilote-api](apps/kpilote-api/README.md) |
| kpilote-webapp | `@pilote/kpilote-webapp` | [apps/kpilote-webapp](apps/kpilote-webapp/README.md) |
| kpilote-admin | `@pilote/kpilote-admin` | [apps/kpilote-admin](apps/kpilote-admin/README.md) |
| kpilote-shared | `@pilote/kpilote-shared` | [packages/kpilote-shared](packages/kpilote-shared/README.md) |
| kpilote-ui | `@pilote/kpilote-ui` | [packages/kpilote-ui](packages/kpilote-ui/README.md) |
| kpilote-acme | `@pilote/kpilote-acme` | [packages/kpilote-acme](packages/kpilote-acme/README.md) |

### kpilote en un coup d'œil

```
kpilote-webapp ──(JWT ProConnect / Keycloak)──▶ kpilote-api ──▶ PostgreSQL
kpilote-admin  ──(BFF + clé API, par env)────▶ kpilote-api
       │                                          │
       └──── @pilote/kpilote-ui ◀── @pilote/kpilote-shared ──┘
```

## Prérequis

- **Node.js** 24.20.0
- **pnpm** 10 (`npm install -g pnpm@10`)
- **PostgreSQL** 16+ (pilote-ppg) ; kpilote-api fournit un `docker-compose.yml` (PostgreSQL 17)
- **Authentification** : **ProConnect** et **Keycloak** (fournisseurs OIDC utilisés par pilote-ppg et kpilote)

## Installation

```bash
git clone git@github.com:DITP-pilotage/pilote-2.git
cd pilote-2
pnpm install
```

Les fichiers `.env` vivent dans chaque app. Pour `pilote-ppg` :

```bash
cp apps/pilote-ppg/.env.example apps/pilote-ppg/.env
# Éditer apps/pilote-ppg/.env avec vos valeurs
```

Même principe pour `kpilote-api`, `kpilote-webapp` et `kpilote-admin` (`apps/<app>/.env.example`).

## Commandes

Toutes les commandes se lancent depuis la racine du monorepo. Par défaut elles ciblent `@pilote/ppg`. Pour cibler une autre app, exporter `APP_PACKAGE` :

```bash
export APP_PACKAGE=@pilote/ppg  # optionnel, c'est le défaut
APP_PACKAGE=@pilote/kpilote-api pnpm test
```

On peut aussi passer directement par le filtre pnpm : `pnpm -F @pilote/kpilote-ui test`.

### kpilote en local

```bash
pnpm dev:kpilote-api                  # https://kpilote-api.modernisation.localhost
pnpm dev:kpilote-webapp               # https://kpilote.modernisation.localhost
pnpm -F @pilote/kpilote-admin dev     # https://kpilote-admin.modernisation.localhost
```

Les apps kpilote sont servies en HTTPS sur des domaines `*.localhost` via [portless](https://www.npmjs.com/package/portless). La base de kpilote-api se lance avec `docker compose up -d` dans `apps/kpilote-api` (voir son [README](apps/kpilote-api/README.md)).

### Développement

```bash
pnpm dev:ppg              # Serveur de dev pilote-ppg (Next.js + pino-pretty)
pnpm build                # Build production (standalone + Prisma + Pagefind)
pnpm start                # Serveur de production
```

### Base de données

```bash
pnpm database:init        # Reset + migrate + seed
pnpm database:migration   # Créer une nouvelle migration
```

### Tests

```bash
pnpm test                 # Tests unitaires + intégration (Vitest)
pnpm test:client          # Tests client uniquement
pnpm test:server          # Tests serveur uniquement
pnpm test:e2e             # Tests E2E (Playwright)
```

### Qualité de code

```bash
pnpm lint                 # oxlint + TypeScript + Prettier
pnpm lint:fix             # Auto-fix
pnpm format               # Prettier
```

## Déploiement (Scalingo)

| App | Type | Configuration |
|-----|------|---------------|
| **pilote-ppg** | Node.js (Next.js) | Pas de `PROJECT_DIR` — buildpack à la racine, `APP_PACKAGE=@pilote/ppg` |
| **pilote-ppg-auth** | Keycloak | `PROJECT_DIR=apps/pilote-ppg-auth` |
| **pilote-ppg-data-management** | Python/dbt | `PROJECT_DIR=apps/pilote-ppg-data-management` |
| **kpilote-api** | Node.js (Hono) | Pas de `PROJECT_DIR`, `APP_PACKAGE=@pilote/kpilote-api` |
| **kpilote-webapp** | Node.js (Hono + SPA) | Pas de `PROJECT_DIR`, `APP_PACKAGE=@pilote/kpilote-webapp` |
| **kpilote-admin** | Node.js (Hono + SPA) | Pas de `PROJECT_DIR`, `APP_PACKAGE=@pilote/kpilote-admin` |

### Comment ça marche pour les apps Node.js

Le buildpack tourne à la racine du repo, détecte pnpm via `pnpm-lock.yaml`, exécute `pnpm install` puis `pnpm build` et `pnpm start`. Le `build` racine enchaîne trois scripts du workspace ciblé (`pnpm -F ${APP_PACKAGE:-@pilote/ppg}`) :

1. `deploy:prepare` copie le `.slugignore` de l'app à la racine (exclusion des fichiers inutiles au runtime) ;
2. `build` compile l'app ;
3. `deploy:bundle` produit le bundle de production (`pnpm deploy --prod` pour les apps kpilote) et copie le `start.sh` de l'app à la racine, lancé ensuite par `pnpm start`.

### Ajouter une nouvelle app Node.js sur Scalingo

1. Créer l'app Scalingo
2. `scalingo --app <app-name> env-set APP_PACKAGE=@pilote/<nom>`
3. Le buildpack utilisera les alias scripts racine qui délèguent au bon workspace

## Ajouter une nouvelle app au monorepo

1. Créer le dossier dans `apps/` (ex: `apps/pilote-core/`)
2. Ajouter un `package.json` avec `"name": "@pilote/core"`
3. `pnpm install` depuis la racine
4. Pour cibler la nouvelle app localement : `pnpm -F @pilote/core dev`
5. Sur Scalingo : `APP_PACKAGE=@pilote/core`

## Documentation

- ADRs kpilote : `docs/architecture/decisions/`
- Architecture kpilote (auth, permissions, collections, valeurs dérivées…) : `apps/kpilote-api/docs/architecture/`
- Architecture et ADRs pilote-ppg : `apps/pilote-ppg/docs/architecture/decisions/`
- Modèle de données : `apps/pilote-ppg/README_modele_de_donnees.md`
- Procédures techniques : `apps/pilote-ppg/README_procedures_tech.md`
