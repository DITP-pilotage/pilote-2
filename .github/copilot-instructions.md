# Instructions du dépôt — Pilote

Outil de pilotage territorial de la DITP pour le suivi des politiques publiques.
Monorepo pnpm 10, Node 24.20.0, TypeScript. Branche de base : `dev`.

## Langue

Le projet est francophone : messages de commit, commentaires de code, messages
d'erreur utilisateur, descriptions de PR. **Rédige tes revues en français.**

## Carte du monorepo

| Workspace                         | Package                  | Stack                                                                                                      |
| --------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `apps/pilote-ppg`                 | `@pilote/ppg`            | Next.js (Pages Router ; `src/app` réservé aux route handlers d'API), Prisma, tRPC, Awilix, DSFR + Tailwind |
| `apps/kpilote-api`                | `@pilote/kpilote-api`    | Hono, `@hono/zod-openapi`, Prisma, neverthrow                                                              |
| `apps/kpilote-webapp`             | `@pilote/kpilote-webapp` | Vite, TanStack Router/Query, Tailwind                                                                      |
| `apps/kpilote-admin`              | `@pilote/kpilote-admin`  | Vite (POC d'édition des référentiels par environnement)                                                    |
| `apps/pilote-ppg-auth`            | —                        | Keycloak                                                                                                   |
| `apps/pilote-ppg-data-management` | —                        | Python / dbt                                                                                               |
| `packages/kpilote-ui`             | `@pilote/kpilote-ui`     | Composants React plats, Tailwind + Radix                                                                   |
| `packages/kpilote-shared`         | `@pilote/kpilote-shared` | Logique pure, types partagés client/serveur                                                                |

**Frontière volontaire : `pilote-ppg` n'importe aucun package `@pilote/kpilote-*`,
et réciproquement.** Ne propose jamais de factoriser du code entre les deux mondes.

## Conventions de nommage

Verbes et termes techniques en anglais, **noms d'entités métier en français** :
`getIndicateurById`, `listerIndicateurIndividuCommentaires`,
`MesureIndicateurTemporaireRepository`, `valeurAvancement`, `habilitation`.
C'est délibéré — ne le signale pas comme une incohérence.

Les accents sont autorisés dans les identifiants (`UtilisateurÀCréerOuMettreÀJour`),
sauf dans les noms de fichiers d'assets.

## Architecture

### `pilote-ppg` — hexagonale par module métier

`src/server/<module>/` contient :

- `domain/` — entités, `ports/*.interface.ts`, `errors/`. **N'importe jamais
  `infrastructure/`, Prisma, Next, ni aucun client HTTP.**
- `usecases/` — orchestration, dépend uniquement des ports du domaine.
- `infrastructure/adapters/` — implémentations des ports (`Prisma*Repository`, …).
- `infrastructure/handlers/` — points d'entrée HTTP.
- `module.ts` — enregistrement Awilix (`defineModule`) ; toute nouvelle classe
  injectée doit y être déclarée, sinon l'app casse au démarrage et pas au build.
- `__tests__/` — miroir de l'arborescence du module.

Alias `@/…` déclarés dossier par dossier dans `tsconfig.json`.

### `kpilote-api` — module par ressource

`src/<ressource>/` avec `routes.ts`, `queries/`, `commands/`, `permissions.ts`,
tests colocalisés (`*.test.ts`). Le socle transverse est dans `src/framework/`.

Les erreurs attendues passent par **neverthrow** (`Result` / `ResultAsync` +
`AppError`), pas par des `throw`. `kpilote-api` raisonne en API pure, pas en BFF.

Les alias `@/…` sont mappés **dossier par dossier** dans `tsconfig.json` : tout
nouveau sous-système doit y ajouter son entrée.

### Front

- `kpilote-webapp` / `kpilote-admin` : Tailwind + composants de `@pilote/kpilote-ui`.
  Pas de couleurs en dur — passer par la config Tailwind ou la palette DSFR.
  Le helper `clsx` + `twMerge` s'appelle `clsxm`.
- `pilote-ppg` : mixte. Les classes DSFR `fr-*` sont l'existant historique ;
  le code neuf va vers Tailwind + composants partagés. Ne demande pas de convertir
  l'existant.
- Champs de formulaire contrôlés : brancher sur react-hook-form via `Controller`,
  jamais via un `input` caché.

## Base de données

Prisma sur PostgreSQL. Migrations versionnées ; `prisma generate --sql` est
nécessaire après un `migrate dev` quand des requêtes SQL typées existent. Sur les
`INSERT` en SQL brut, `updated_at` n'a pas de valeur par défaut et doit être fourni.

## Commits

`type(scope): description en français`, scope = ticket Jira (`PIL-1793`) ou app
(`ppg`, `deps`). Types utilisés : `feat`, `fix`, `bugfix`, `refactor`, `infra`,
`perf`, `docs`, `chore`.

## Ce qui est déjà automatisé

La CI (`.github/workflows/testAndLint.yml`) exécute, par app, le lint et les tests.
`pnpm lint` = `oxlint --type-aware` + `tsc` + `prettier --check`. Les tests tournent
sous Vitest (projets `server-unit`, `server-integration`, `client`) et Playwright
pour l'E2E.

**Ne relève pas ce que cette chaîne relève déjà** : formatage, imports inutilisés,
`any` explicite, `console.log`, variables non utilisées, erreurs de typage.
