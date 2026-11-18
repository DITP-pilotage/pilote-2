# Pilote : monorepo pnpm

Deux familles indépendantes : **pilote-ppg** (historique, Next.js) et **kpilote** (API, webapp, back-office, packages partagés). `pilote-ppg` n'importe aucun package `@pilote/kpilote-*`, et réciproquement : ne factorise jamais de code entre les deux.

## Où sont les règles

Les conventions de code font foi pour toute tâche qui touche du code. Elles vivent dans `.claude/rules/` et se chargent automatiquement selon les fichiers lus ou modifiés :

| Fichier | Portée |
| --- | --- |
| `.claude/rules/kpilote-common.md` | tout `apps/kpilote-*` et `packages/kpilote-*` : nommage, lisibilité, textes de l'UI, formatage |
| `.claude/rules/kpilote-api.md` | `apps/kpilote-api` : routes, queries, commands, neverthrow, Prisma, tests |
| `.claude/rules/kpilote-react.md` | `apps/kpilote-webapp`, `apps/kpilote-admin`, `packages/kpilote-ui` : composants, hooks, data fetching |
| `.claude/rules/kpilote-webapp.md` | `apps/kpilote-webapp` uniquement |
| `.claude/rules/kpilote-admin.md` | `apps/kpilote-admin` uniquement |
| `.claude/rules/kpilote-shared.md` | `packages/kpilote-shared` : schémas zod et logique pure |

`apps/pilote-ppg` a son propre `CLAUDE.md`, chargé quand on travaille dans ce dossier.

Quand une règle contredit un document plus ancien (`.github/copilot-instructions.md`, un doc de `docs/architecture/`), la règle l'emporte.

## Langue

Commits, PR, commentaires, messages d'erreur et textes affichés en français. Identifiants : voir `kpilote-common.md`.

## Commandes utiles

- Lint d'un projet kpilote : `pnpm -F @pilote/kpilote-api lint` (oxlint `--type-aware` + `tsc` + `prettier --check`). Même chose avec `@pilote/kpilote-webapp`, `@pilote/kpilote-admin`, `@pilote/kpilote-shared`.
- Tests : `pnpm -F @pilote/kpilote-api test` (Vitest). Lance-les toi-même avant de rendre la main.
- Prettier : uniquement sur les fichiers modifiés (`pnpm exec prettier --write <fichiers>`), jamais sur un dossier entier.

## Commits et PR

`type(scope): description en français`, scope = ticket Jira (`PIL-1793`) ou app. Le titre de PR finit par le ou les tickets entre parenthèses : `… (PIL-1994)`. Branche de base : `dev`.
