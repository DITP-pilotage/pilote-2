# Instructions du dépôt — Pilote

Outil de pilotage territorial de la DITP pour le suivi des politiques publiques.
Monorepo pnpm 10, Node 24.22.1, TypeScript. Branche de base : `dev`.

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

Verbes et termes techniques en anglais, **noms d'entités métier en français**.
C'est délibéré : ne le signale pas comme une incohérence.

- **kpilote** : tout ce qui est technique est en anglais, y compris les mots de liaison
  (`By`, `For`, `key`, `context`) ; seuls les termes du domaine restent en français.
  `loadModalitesContext`, `findOrCreateCombinaisons`, `idByKey` ; pas `chargerContexteModalites`
  ni `idParCle`. **Aucun accent** dans les identifiants. Signale les nouveaux identifiants qui
  dérogent ; l'existant n'est renommé que dans le périmètre de la PR.
- **pilote-ppg** : l'existant mêle verbes français et anglais (`getIndicateurById`,
  `listerIndicateurIndividuCommentaires`, `MesureIndicateurTemporaireRepository`). Les accents
  sont autorisés dans les identifiants (`UtilisateurÀCréerOuMettreÀJour`), sauf dans les noms de
  fichiers d'assets.

## Conventions de code kpilote

Elles font foi et vivent dans `.claude/rules/kpilote-*.md` (commun, api, react, webapp, admin,
shared) : appuie tes revues kpilote dessus. Les points qui reviennent le plus en revue :

- pas de ternaire imbriqué (oxlint `no-nested-ternary`), pas de `&&` et `||` mélangés dans une
  même expression, pas d'IIFE : une fonction nommée à retours anticipés ou des booléens nommés ;
- paramètres passés en objet nommé dès deux paramètres ;
- pas de tiret cadratin « — » dans les textes affichés ; une valeur absente s'affiche `-` ;
- un hook React ne fait que lire les requêtes, la dérivation va dans une fonction pure testée ;
- transformations de collection avec `es-toolkit` (`keyBy`, `groupBy`…) plutôt qu'à la main ;
- commands de l'API : une fonction `async` linéaire, `err(...)` avant toute écriture, un seul
  `ResultAsync` à la sortie (modèle : `apps/kpilote-api/src/axe/commands/deleteModalite.ts`) ;
- vocabulaire : « individu », jamais « territoire » ni « maille ».

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
