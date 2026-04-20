# Pilote — Monorepo

Outil de pilotage territorial pour le suivi des politiques publiques.

## Structure

```
pilote/
├── apps/
│   ├── pilote-ppg/                  Application PPG (Politiques Prioritaires du Gouvernement)
│   │   ├── src/                     Code source (client + server)
│   │   ├── tests/                   Tests E2E (Playwright)
│   │   └── ...
│   ├── pilote-ppg-auth/             Keycloak (authentification)
│   └── pilote-ppg-data-management/  Pipeline dbt (Python)
├── package.json                     Scripts d'alias vers le workspace actif
├── pnpm-workspace.yaml              Configuration workspaces
├── pnpm-lock.yaml                   Lockfile unique
└── .slugignore                      Exclusions slug Scalingo
```

## Prérequis

- **Node.js** 24.9.0
- **pnpm** 10 (`npm install -g pnpm@10`)
- **PostgreSQL** 16+
- **Keycloak** (pour l'authentification)

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

## Commandes

Toutes les commandes se lancent depuis la racine du monorepo. Par défaut elles ciblent `@pilote/ppg`. Pour cibler une autre app, exporter `APP_PACKAGE` :

```bash
export APP_PACKAGE=@pilote/ppg  # optionnel, c'est le défaut
```

### Développement

```bash
pnpm dev                  # Serveur de dev (Next.js + pino-pretty)
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
pnpm lint                 # ESLint + TypeScript
pnpm lint:fix             # Auto-fix
pnpm format               # Prettier
```

## Déploiement (Scalingo)

| App | Type | Configuration |
|-----|------|---------------|
| **pilote-ppg** | Node.js (Next.js) | Pas de `PROJECT_DIR` — buildpack à la racine, `APP_PACKAGE=@pilote/ppg` |
| **pilote-ppg-auth** | Keycloak | `PROJECT_DIR=apps/pilote-ppg-auth` |
| **pilote-ppg-data-management** | Python/dbt | `PROJECT_DIR=apps/pilote-ppg-data-management` |

### Comment ça marche pour les apps Node.js

Le buildpack tourne à la racine du repo, détecte pnpm via `pnpm-lock.yaml`, exécute `pnpm install` puis `pnpm build` et `pnpm start`. Ces scripts dans le `package.json` racine délèguent au workspace ciblé via `pnpm -F ${APP_PACKAGE:-@pilote/ppg}`.

Le `.slugignore` à la racine exclut les fichiers non nécessaires au runtime (tests, sources, cache, etc.).

### Ajouter une nouvelle app Node.js sur Scalingo

1. Créer l'app Scalingo
2. `scalingo --app <app-name> env-set APP_PACKAGE=@pilote/<nom>`
3. Le buildpack utilisera les alias scripts racine qui délèguent au bon workspace

## Ajouter une nouvelle app au monorepo

1. Créer le dossier dans `apps/` (ex: `apps/pilote-core/`)
2. Ajouter un `package.json` avec `"name": "@pilote/core"`
3. `pnpm install` depuis la racine
4. Pour cibler la nouvelle app localement : `APP_PACKAGE=@pilote/core pnpm dev`
5. Sur Scalingo : `APP_PACKAGE=@pilote/core`

## Documentation

- Architecture et ADRs : `apps/pilote-ppg/docs/architecture/decisions/`
- Modèle de données : `apps/pilote-ppg/README_modele_de_donnees.md`
- Procédures techniques : `apps/pilote-ppg/README_procedures_tech.md`
