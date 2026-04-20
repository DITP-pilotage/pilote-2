# Migration npm → pnpm

Date : 2026-04-14
Statut : Design validé, prêt pour plan d'implémentation

## Contexte

PILOTE est actuellement géré avec npm (`package-lock.json`). La cible à moyen terme est une
structure monorepo avec `pnpm workspaces` pour héberger plusieurs applications :

- `apps/pilote-ppg` — l'application actuelle (Politiques Prioritaires du Gouvernement)
- `apps/pilote` — une future application générique
- `apps/shared` — code partagé
- À plus long terme : extraction du centre d'aide et de la solution de logs

Ce ticket est la **première étape** de cette migration : passer de npm à pnpm sans toucher à
la structure du repo. La mise en place des workspaces et le déplacement du code dans
`apps/pilote-ppg` feront l'objet d'un ticket dédié et d'un PRD séparé.

## Objectif

Remplacer npm par pnpm comme gestionnaire de paquets, à périmètre fonctionnel constant :
aucun changement d'arborescence, aucun déplacement de fichier, aucun impact runtime visible.

## Hors scope

- Mise en place des workspaces pnpm (ticket suivant, PRD dédié)
- Déplacement du code vers `apps/pilote-ppg/`
- Nettoyage des Dockerfiles webapp (inutilisés en pratique, seront supprimés dans un ticket dédié)
- Rédaction d'un ADR (remplacé par le PRD workspaces à venir)

## Décisions

### Gestionnaire et version
- **pnpm 10** (dernière stable), pinnée via le champ `"packageManager": "pnpm@10.x.y"` dans
  `package.json`.
- **Pas de Corepack** : les devs installent pnpm globalement eux-mêmes. Le champ
  `packageManager` sert de source de vérité (lu automatiquement par `pnpm/action-setup@v4`
  en CI et comme documentation pour les devs), mais n'active pas Corepack.

### Stratégie de linker
- **`node-linker=isolated`** (défaut pnpm) : symlinks stricts, détection des phantom deps.
- `public-hoist-pattern[]` réservé aux cas où une lib est *réellement* cassée en isolated
  (typiquement `@prisma/client`, Next.js standalone dans certains cas). Pas utilisé pour
  masquer nos propres oublis.

### Phantom deps
- Toute erreur `Cannot find module X` révélée par le passage en `isolated` est corrigée
  **proprement** : ajout explicite de `X` dans `dependencies` / `devDependencies` de
  `package.json`. Pas de contournement via `public-hoist-pattern`.

### Docker
- Aucun changement dans ce ticket. Les Dockerfiles (`docker/Dockerfile.webapp.prod`,
  `docker/Dockerfile.webapp.dev`, `docker/entrypoint.webapp.*.sh`) gardent leurs commandes
  `npm install` / `npm run`. Ils sont considérés inutilisés en pratique et seront supprimés
  dans un ticket séparé.

## Composants impactés

### 1. Racine du repo
- **Ajouts**
  - `pnpm-lock.yaml` (généré par `pnpm install`)
  - `.npmrc` :
    ```
    node-linker=isolated
    strict-peer-dependencies=false
    auto-install-peers=true
    ```
- **Modifications**
  - `package.json` : ajout du champ `"packageManager": "pnpm@10.x.y"`
- **Suppressions**
  - `package-lock.json`

### 2. Scripts `package.json`
- `npm run X` imbriqués → `pnpm X` dans : `lint`, `lint:fix`, `test:e2e:server`,
  `test:e2e:database:init`, `test:database:init`
- `npx` → `pnpm exec` dans : `build`, `build:dev`, `lint:tsc`, `test:e2e`, `test:e2e:ui`

Exemples ciblés :
- `"lint": "prisma generate && pnpm lint:eslint && pnpm lint:tsc"`
- `"lint:tsc": "pnpm exec tsc"`
- `"test:e2e": "pnpm exec playwright test --workers=1"`
- `"test:e2e:server": "dotenv -e .env.e2e pnpm dev"`

### 3. CI GitHub Actions
Fichiers à modifier :
- `.github/workflows/testAndLint.yml`
- `.github/workflows/e2e.yml`

Pattern appliqué dans chaque job qui installait auparavant des dépendances :
```yaml
- uses: pnpm/action-setup@v4
- uses: actions/setup-node@v4
  with:
    node-version-file: 'package.json'
    cache: 'pnpm'
- run: pnpm install --frozen-lockfile
```
Tous les `npm ci` et `npm run X` restants sont remplacés par leur équivalent pnpm.

Les autres workflows (`pr-merged-dev.yml`, `pr-review-requested.yml`,
`trigger-dj-dev.yml`) sont vérifiés individuellement : touchés seulement s'ils
exécutent du npm.

### 4. Documentation
- `CLAUDE.md` : section "Development Commands" migrée de `npm run X` vers `pnpm X`
- Ajout d'une note setup : "installer `pnpm@10` globalement avant le premier `pnpm install`"

### 5. Nettoyage
- Suppression de `package-lock.json`
- Vérification de l'absence de références à `package-lock.json` dans `.dockerignore`,
  `.gitignore`, `.slugignore` et les scripts shell.

## Points d'attention techniques

1. **Next.js standalone (`.next/standalone/server.js`)** : le tracing standalone peut ne pas
   capturer correctement les deps symlinkées en mode isolated. Première tentative :
   ajuster `outputFileTracingIncludes` / `outputFileTracingRoot` dans `next.config.js`.
   Dernier recours seulement : `public-hoist-pattern`.
2. **Prisma 6** : `prisma generate`, `prisma migrate deploy`, `prisma db seed` doivent
   fonctionner. `@prisma/client` est un candidat légitime à `public-hoist-pattern` si la
   résolution pose problème en isolated.
3. **Sharp** : dep native, à surveiller lors du premier install.
4. **Playwright** : `pnpm exec playwright test` ; les navigateurs sont cachés hors
   `node_modules`, pas de souci attendu.
5. **`scripts/clone_centre_aide.sh`** : appelé dans `build`, à vérifier qu'il n'utilise pas
   npm en interne.
6. **Git submodules** (`centreaide:init`) : inchangés, indépendants du gestionnaire de
   paquets.

## Plan de validation

Exécuté localement avant ouverture de la PR :

1. `rm -rf node_modules package-lock.json && pnpm install`
2. `pnpm lint`
3. `pnpm test`
4. `E2E_VIDEO=on pnpm test:e2e`
5. `pnpm build:dev`
6. `pnpm dev` + smoke test navigateur sur 2-3 pages clés
7. Push sur la branche, validation CI verte (testAndLint + e2e)

## Livrables de la PR

- `pnpm-lock.yaml` créé
- `package-lock.json` supprimé
- `package.json` : champ `packageManager` ajouté, scripts migrés, éventuelles dépendances
  explicites ajoutées (phantom deps révélées)
- `.npmrc` créé
- `.github/workflows/testAndLint.yml` migré
- `.github/workflows/e2e.yml` migré
- `CLAUDE.md` mis à jour

## Prochaines étapes (hors scope de ce ticket)

- PRD sur la mise en place de `pnpm workspaces` et la structure `apps/pilote-ppg`,
  `apps/pilote`, `apps/shared`
- Ticket de suppression des Dockerfiles webapp inutilisés
- Ticket(s) d'extraction du centre d'aide et de la solution de logs
