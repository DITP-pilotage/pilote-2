# Migration npm → pnpm — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer npm par pnpm 10 (sans workspaces) comme gestionnaire de paquets, à périmètre fonctionnel constant.

**Architecture:** On garde l'arborescence actuelle intacte. On ajoute `.npmrc` (linker isolated), on épingle pnpm via `packageManager`, on régénère le lockfile, on réécrit les scripts `package.json` (`npm run X` → `pnpm X`, `npx` → `pnpm exec`), et on migre la CI (`setupNodeAndPackages` composite + `testAndLint.yml` + `e2e.yml`). Les phantom deps révélées par `node-linker=isolated` sont corrigées en ajoutant la dépendance explicite au lieu d'utiliser `public-hoist-pattern`.

**Tech Stack:** pnpm 10, Node 24.9.0, Next.js 16, Prisma 6, Playwright, GitHub Actions (`pnpm/action-setup@v4`).

**Spec source :** `docs/superpowers/specs/2026-04-14-migration-npm-vers-pnpm-design.md`

**Important — exécution des tests :** la consigne projet (`CLAUDE.md`) interdit à l'agent de lancer `pnpm test` et `pnpm test:e2e`. Ces étapes de validation sont explicitement marquées **« utilisateur »** dans le plan — l'agent prépare le terrain, l'utilisateur exécute et partage le résultat. Les commandes non-test (`pnpm install`, `pnpm lint`, `pnpm build:dev`) restent à la charge de l'agent.

---

## File Structure

**Créés :**
- `.npmrc` — config pnpm (linker isolated, peers auto-install)
- `pnpm-lock.yaml` — généré par `pnpm install`
- `docs/superpowers/plans/2026-04-15-migration-npm-vers-pnpm.md` — ce plan

**Modifiés :**
- `package.json` — champ `packageManager`, scripts migrés, éventuelles deps explicites
- `.github/actions/setupNodeAndPackages/action.yml` — composite action CI migrée pnpm
- `.github/workflows/testAndLint.yml` — step `npm ci` remplacé, scripts pnpm
- `.github/workflows/e2e.yml` — setup pnpm + scripts pnpm
- `CLAUDE.md` — section "Development Commands" passée à pnpm + note install

**Supprimés :**
- `package-lock.json`

---

## Task 1 : Créer `.npmrc`

**Files:**
- Create: `.npmrc`

- [ ] **Step 1 : Écrire `.npmrc`**

Créer `.npmrc` à la racine avec :

```
node-linker=isolated
strict-peer-dependencies=false
auto-install-peers=true
```

- [ ] **Step 2 : Vérifier**

Run : `cat .npmrc`
Expected : les 3 lignes ci-dessus.

---

## Task 2 : Installer pnpm 10 et récupérer la version épinglée

**Files:** (aucun fichier modifié à cette étape, on relève juste la version pour la Task 3)

- [ ] **Step 1 : Installer pnpm 10 globalement (si absent)**

Run : `pnpm --version 2>/dev/null || npm install -g pnpm@10`

- [ ] **Step 2 : Relever la version exacte**

Run : `pnpm --version`
Expected : quelque chose comme `10.x.y` (ex. `10.15.0`). Noter cette version pour la Task 3.

---

## Task 3 : Ajouter `packageManager` dans `package.json`

**Files:**
- Modify: `package.json` (après `"private": true,`)

- [ ] **Step 1 : Ajouter le champ**

Remplacer dans `package.json` :

```json
  "private": true,
  "engines": {
    "node": "24.9.0"
  },
```

par (en injectant la version relevée à la Task 2, exemple avec `10.15.0` — à remplacer) :

```json
  "private": true,
  "packageManager": "pnpm@10.15.0",
  "engines": {
    "node": "24.9.0"
  },
```

- [ ] **Step 2 : Vérifier**

Run : `grep packageManager package.json`
Expected : `"packageManager": "pnpm@10.x.y",`

---

## Task 4 : Migrer les scripts `package.json` de npm vers pnpm

**Files:**
- Modify: `package.json` (bloc `scripts`)

- [ ] **Step 1 : Réécrire le bloc `scripts`**

Remplacer le bloc `scripts` intégralement par :

```json
  "scripts": {
    "dev": "next dev | pino-pretty",
    "build": "bash scripts/clone_centre_aide.sh && next build && pnpm exec pagefind --site .next/server/app --output-path public/_pagefind && node copy-assets.js && prisma migrate deploy && prisma db seed",
    "build:dev": "next build && pnpm exec pagefind --site .next/server/app --output-path public/_pagefind && node copy-assets.js && prisma migrate deploy && prisma db seed",
    "start": "node --max-old-space-size=${MAX_OLD_SPACE_SIZE:-768} .next/standalone/server.js",
    "lint": "prisma generate && pnpm lint:eslint && pnpm lint:tsc",
    "lint:fix": "pnpm lint:eslint -- --fix",
    "format": "prettier --write 'src/**/*.{js,jsx,ts,tsx,json,css,scss,md}'",
    "format:check": "prettier --check 'src/**/*.{js,jsx,ts,tsx,json,css,scss,md}'",
    "lint:eslint": "eslint '{src,tests}/**/*.{ts,tsx}' --quiet",
    "lint:tsc": "pnpm exec tsc",
    "test": "vitest run",
    "test:client": "vitest run --project client",
    "test:client:unit": "vitest run --project client '.unit.test.'",
    "test:client:integration": "vitest run --project client '.integration.test.'",
    "test:client:coverage": "vitest run --project client --coverage",
    "test:server": "vitest run --project server-unit --project server-integration",
    "test:e2e": "pnpm exec playwright test --workers=1",
    "test:e2e:seed": "./tests/seed/seed.sh",
    "test:e2e:ui": "pnpm exec playwright test --ui",
    "test:e2e:server": "dotenv -e .env.e2e pnpm dev",
    "test:e2e:database:init": "dotenv -e .env.e2e -- pnpm database:init -- --force",
    "test:server:unit": "vitest run --project server-unit",
    "test:server:integration": "vitest run --project server-integration",
    "test:server:domain:coverage": "vitest run --project server-unit --coverage 'src/server/domain/**/*.test.*'",
    "test:server:infrastructure:coverage": "vitest run --project server-unit --coverage 'src/server/infrastructure/**/*.test.*'",
    "test:database:init": "dotenv -e .env.test -- pnpm database:init -- --force",
    "database:init": "prisma migrate reset",
    "database:init-force": "prisma migrate reset --force",
    "database:migration": "prisma migrate dev",
    "centreaide:init": "git submodule update --init --recursive",
    "centreaide:clean": "git submodule deinit -f src/content"
  },
```

Modifications par rapport à la version actuelle :
- `build` : `npx pagefind` → `pnpm exec pagefind`
- `build:dev` : idem
- `lint` : `npm run lint:eslint && npm run lint:tsc` → `pnpm lint:eslint && pnpm lint:tsc`
- `lint:fix` : `npm run lint:eslint` → `pnpm lint:eslint`
- `lint:tsc` : `npx tsc` → `pnpm exec tsc`
- `test:e2e` : `npx playwright test` → `pnpm exec playwright test`
- `test:e2e:ui` : idem
- `test:e2e:server` : `npm run dev` → `pnpm dev`
- `test:e2e:database:init` : `npm run database:init` → `pnpm database:init`
- `test:database:init` : idem

- [ ] **Step 2 : Vérifier qu'il ne reste plus aucun `npm run` ni `npx` dans les scripts**

Run : `grep -n 'npm run\|npx ' package.json`
Expected : aucun résultat.

---

## Task 5 : Supprimer `package-lock.json` et générer `pnpm-lock.yaml`

**Files:**
- Delete: `package-lock.json`
- Create: `pnpm-lock.yaml` (généré)

- [ ] **Step 1 : Nettoyer l'existant**

Run : `rm -rf node_modules package-lock.json`

- [ ] **Step 2 : Installer avec pnpm**

Run : `pnpm install`
Expected : un `pnpm-lock.yaml` à la racine, un `node_modules` avec la structure pnpm (dossier `.pnpm/`), pas d'erreur bloquante. Les warnings sur les peer deps sont normaux (auto-install actif).

- [ ] **Step 3 : Vérifier**

Run : `ls pnpm-lock.yaml && test ! -f package-lock.json && echo OK`
Expected : affichage du fichier puis `OK`.

---

## Task 6 : Vérifier qu'aucun ignore ne référence `package-lock.json`

**Files:**
- Read (verify): `.dockerignore`, `.gitignore`, `.slugignore`

- [ ] **Step 1 : Vérifier**

Run : `grep -n 'package-lock' .dockerignore .gitignore .slugignore 2>/dev/null; echo "exit $?"`
Expected : aucune ligne avant `exit 1` (grep ne trouve rien). Si un fichier d'ignore référence `package-lock.json`, le remplacer par `pnpm-lock.yaml` — mais d'après l'inspection initiale ce n'est pas le cas.

- [ ] **Step 2 : Vérifier aussi l'absence de référence dans les scripts shell**

Run : `grep -rn 'package-lock\|npm ci\|npm install' scripts/ 2>/dev/null`
Expected : aucun résultat.

---

## Task 7 : Validation locale — `pnpm lint`

**Files:** (aucun changement attendu, sauf phantom deps à corriger)

- [ ] **Step 1 : Lancer le lint**

Run : `pnpm lint`
Expected : pas d'erreur `Cannot find module ...`. Les warnings ESLint habituels sont tolérés.

- [ ] **Step 2 : Si phantom dep révélée (ex. `Cannot find module 'foo'`)**

Pour chaque dep manquante :
1. Identifier si c'est une `dependency` ou une `devDependency` (test / build / runtime ?).
2. Ajouter explicitement : `pnpm add foo` ou `pnpm add -D foo`.
3. Relancer `pnpm lint`.

**Important** : ne PAS ajouter de `public-hoist-pattern[]` dans `.npmrc` pour contourner. On ajoute toujours la dep au `package.json`.

- [ ] **Step 3 : Commit intermédiaire si des phantom deps ont été ajoutées**

Run : `git add package.json pnpm-lock.yaml && git commit -m "fix: ajouter dépendances explicites révélées par pnpm isolated (lint)"`

---

## Task 8 : Validation locale — `pnpm test` (⚠️ utilisateur)

**Files:** (aucun changement, sauf phantom deps révélées)

- [ ] **Step 1 : Demander à l'utilisateur de lancer les tests**

Message à envoyer à l'utilisateur : « Est-ce que je peux lancer les tests `pnpm test` »

Attendre le retour avant de continuer.

- [ ] **Step 2 : Si phantom dep révélée**

Même procédure qu'à la Task 7, step 2 : ajout explicite via `pnpm add` / `pnpm add -D`, puis redemander à l'utilisateur de relancer.

- [ ] **Step 3 : Commit intermédiaire si des phantom deps ont été ajoutées**

Run : `git add package.json pnpm-lock.yaml && git commit -m "fix: ajouter dépendances explicites révélées par pnpm isolated (tests unit)"`

---

## Task 9 : Validation locale — `pnpm build:dev`

**Files:** `next.config.js` potentiellement (si tracing standalone casse)

- [ ] **Step 1 : Lancer le build dev**

Run : `pnpm build:dev`
Expected : build OK, migrations OK, seed OK. Le dossier `.next/standalone/` est généré.

- [ ] **Step 2 : Si erreur Next.js standalone (tracing incomplet)**

Symptôme : `pnpm start` échoue avec `Cannot find module ...` dans `.next/standalone/`.

1. Ajuster `next.config.js` : ajouter ou étoffer `outputFileTracingIncludes` pour forcer l'inclusion des deps problématiques.
   ```js
   outputFileTracingIncludes: {
     '/**/*': ['./node_modules/.pnpm/**/<lib-problématique>/**/*'],
   },
   ```
2. `outputFileTracingRoot` est déjà défini sur `__dirname` : OK.
3. Relancer `pnpm build:dev` puis `node .next/standalone/server.js` (rapide smoke start sans DB si config permet, sinon sauter directement à l'étape 3).
4. **Dernier recours seulement** : ajouter la lib à `public-hoist-pattern[]` dans `.npmrc`, documenter la raison en commentaire dans `.npmrc`.

- [ ] **Step 3 : Commit intermédiaire si `next.config.js` a été modifié**

Run : `git add next.config.js .npmrc && git commit -m "fix: ajuster tracing Next.js standalone pour pnpm isolated"`

---

## Task 10 : Validation locale — `pnpm dev` + smoke manuel

**Files:** (aucun)

- [ ] **Step 1 : Lancer le serveur dev**

Run : `pnpm dev` (en foreground ou arrière-plan)

- [ ] **Step 2 : Smoke test**

Demander à l'utilisateur : « J'ai `pnpm dev` en route. Peux-tu ouvrir l'app sur 2-3 pages clés (accueil, une fiche chantier, une page utilisateur) pour vérifier qu'il n'y a pas d'erreur runtime ? »

Attendre confirmation avant de continuer.

- [ ] **Step 3 : Arrêter le serveur**

Si démarré en arrière-plan : couper le process.

---

## Task 11 : Validation locale — `pnpm test:e2e` (⚠️ utilisateur)

**Files:** (aucun, sauf phantom deps)

- [ ] **Step 1 : Demander à l'utilisateur**

Message : « Peux-tu lancer `E2E_VIDEO=on pnpm test:e2e` (en filtrant la sortie, voir la note migration output) et me remonter le résultat ? »

Attendre le retour.

- [ ] **Step 2 : Si phantom dep révélée côté Playwright**

Procédure identique aux tasks 7–8.

- [ ] **Step 3 : Commit intermédiaire si corrections**

Run : `git add package.json pnpm-lock.yaml && git commit -m "fix: ajouter dépendances explicites révélées par pnpm isolated (e2e)"`

---

## Task 12 : Migrer la composite action CI `setupNodeAndPackages`

**Files:**
- Modify: `.github/actions/setupNodeAndPackages/action.yml`

- [ ] **Step 1 : Réécrire `action.yml`**

Remplacer tout le contenu de `.github/actions/setupNodeAndPackages/action.yml` par :

```yaml
name: "Setup Node and packages"
inputs:
  node-version:
    required: true
runs:
  using: "composite"
  steps:
    - name: Setup pnpm
      uses: pnpm/action-setup@v4

    - name: Use Node.js ${{ inputs.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'pnpm'

    - name: Install dependencies
      shell: bash
      run: pnpm install --frozen-lockfile
```

Changements clés :
- `pnpm/action-setup@v4` ajouté en amont (lit `packageManager` de `package.json`).
- `actions/setup-node@v3` → `@v4`, `cache: 'npm'` → `cache: 'pnpm'`.
- Cache manuel `actions/cache@v3` sur `node_modules` supprimé : `setup-node` gère le cache du store pnpm via l'option `cache`.
- Install intégré dans la composite action : plus besoin du step `npm ci` dans les workflows appelants.

- [ ] **Step 2 : Vérifier**

Run : `grep -n 'pnpm\|npm' .github/actions/setupNodeAndPackages/action.yml`
Expected : occurrences de `pnpm`, aucune occurrence de `npm ci` / `npm install`.

---

## Task 13 : Migrer `.github/workflows/testAndLint.yml`

**Files:**
- Modify: `.github/workflows/testAndLint.yml`

- [ ] **Step 1 : Réécrire le fichier**

Remplacer intégralement par :

```yaml
name: Tests and Linters

on:
  push:
    branches:
      - dev
  pull_request:

env:
  NODE_VERSION: 24.9.0

jobs:
  test:
    name: Run tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16.6-alpine
        env:
          POSTGRES_DB: postgres
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 7433:5432
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node and packages
        uses: ./.github/actions/setupNodeAndPackages
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Initialize database
        run: pnpm test:database:init

      - name: Run test command
        run: pnpm test

  lint:
    name: Run linters for code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node and packages
        uses: ./.github/actions/setupNodeAndPackages
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Run lint command
        run: pnpm lint
```

Changements :
- Job `install` supprimé : l'install est désormais dans la composite action, et GitHub Actions ne partage pas `node_modules` entre jobs de toute façon (chaque job ré-installait via la composite). Les `needs: install` deviennent inutiles.
- `actions/checkout@v3` → `@v4` (cohérence avec le job ci-dessus, évite warnings runner).
- `npm run test:database:init` → `pnpm test:database:init`.
- `npm test` → `pnpm test`.
- `npm run lint` → `pnpm lint`.

- [ ] **Step 2 : Vérifier**

Run : `grep -n 'npm ' .github/workflows/testAndLint.yml`
Expected : aucun résultat.

---

## Task 14 : Migrer `.github/workflows/e2e.yml`

**Files:**
- Modify: `.github/workflows/e2e.yml`

- [ ] **Step 1 : Remplacer le bloc setup + install**

Dans `e2e.yml`, remplacer :

```yaml
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Run E2E tests
        id: playwright-tests
        run: |
          set -e
          npx playwright test --workers=1
```

par :

```yaml
      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: 'package.json'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install chromium --with-deps

      - name: Run E2E tests
        id: playwright-tests
        run: |
          set -e
          pnpm exec playwright test --workers=1
```

Notes :
- `node-version: "20"` → `node-version-file: 'package.json'` pour lire `engines.node` (24.9.0) et rester aligné avec `testAndLint.yml`. Si ça pose problème (test ancien sur Node 20 explicitement), revert à `node-version: "24.9.0"`.
- `cache: "npm"` → `cache: "pnpm"`.
- `npm ci` → `pnpm install --frozen-lockfile`.
- `npx` → `pnpm exec`.

- [ ] **Step 2 : Vérifier**

Run : `grep -n 'npm \|npx ' .github/workflows/e2e.yml`
Expected : aucun résultat.

---

## Task 15 : Vérifier les workflows périphériques

**Files:** (lecture seule sauf si anomalie)

- [ ] **Step 1 : Grep**

Run : `grep -nE 'npm (ci|install|run)|npx ' .github/workflows/pr-merged-dev.yml .github/workflows/pr-review-requested.yml .github/workflows/trigger-dj-dev.yml`
Expected : aucun résultat (ces workflows ne touchent pas à npm — confirmé lors de la rédaction).

Si grep remonte quelque chose : ajouter un step de migration ad-hoc ici, même pattern que Task 14.

---

## Task 16 : Mettre à jour `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md` (section "Development Commands")

- [ ] **Step 1 : Réécrire la section "Development Commands"**

Remplacer le bloc sous `## Development Commands` par :

```markdown
## Development Commands

### Prérequis
Installer pnpm 10 globalement avant le premier install :
```bash
npm install -g pnpm@10
```

### Essential Commands
```bash
# Development server with pretty logging
pnpm dev

# Build for production (includes migrations and seeding)
pnpm build

# Production server
pnpm start

# Database initialization (development)
pnpm database:init

# Database migration
pnpm database:migration
```

### Testing Commands
```bash
# Run all tests
pnpm test

# Client-side tests only
pnpm test:client

# Server-side tests only
pnpm test:server

# E2E tests with Playwright
pnpm test:e2e
```

### Code Quality Commands
```bash
# Run all linters (ESLint, TypeScript, Stylelint)
pnpm lint

# Auto-fix linting issues
pnpm lint:fix

# Format code with Prettier
pnpm format
```
```

- [ ] **Step 2 : Vérifier qu'il ne reste pas de `npm run` dans le fichier**

Run : `grep -n 'npm run\|npm install' CLAUDE.md`
Expected : aucun résultat (hors la ligne `npm install -g pnpm@10` qui est volontaire).

---

## Task 17 : Dernier tour de vérification globale

**Files:** (lecture seule)

- [ ] **Step 1 : Plus aucun `package-lock.json`**

Run : `test ! -f package-lock.json && echo OK`
Expected : `OK`.

- [ ] **Step 2 : `pnpm-lock.yaml` présent et committed**

Run : `ls pnpm-lock.yaml && git ls-files pnpm-lock.yaml`
Expected : fichier listé et tracké.

- [ ] **Step 3 : `.npmrc` présent**

Run : `cat .npmrc`

- [ ] **Step 4 : Aucun reliquat `npm run` dans les sources du repo (hors node_modules / lock / docs/superpowers/specs)**

Run : `grep -rnE 'npm run|npm ci|npx ' --include='*.json' --include='*.yml' --include='*.yaml' --include='*.md' --include='*.sh' --exclude-dir=node_modules --exclude-dir=.next --exclude='pnpm-lock.yaml' .`

Expected : lignes tolérées :
- `CLAUDE.md` : la ligne `npm install -g pnpm@10` (volontaire).
- `docs/superpowers/specs/2026-04-14-migration-npm-vers-pnpm-design.md` : références historiques dans la spec.
- `docs/superpowers/plans/2026-04-15-migration-npm-vers-pnpm.md` : ce plan lui-même.
- `docker/Dockerfile.webapp.*` et `docker/entrypoint.webapp.*.sh` : **hors scope** (dockerfiles laissés tels quels par décision de la spec).

Tout autre hit est à corriger avant commit final.

- [ ] **Step 5 : Commit final**

Run :
```bash
git add .npmrc pnpm-lock.yaml package.json CLAUDE.md \
  .github/actions/setupNodeAndPackages/action.yml \
  .github/workflows/testAndLint.yml \
  .github/workflows/e2e.yml \
  docs/superpowers/plans/2026-04-15-migration-npm-vers-pnpm.md
git rm package-lock.json
git commit -m "feat: migrer de npm vers pnpm 10 (isolated, sans workspaces)"
```

(Les éventuels commits intermédiaires des tasks 7/8/9/11 sont déjà faits et n'ont pas besoin d'être refaits ici — ce commit final regroupe le reste.)

- [ ] **Step 6 : Relance finale des validations**

- `pnpm lint` (agent)
- `pnpm test` → **utilisateur**
- `E2E_VIDEO=on pnpm test:e2e` → **utilisateur**
- `pnpm build:dev` (agent)

Si tout est vert, le worktree est prêt pour PR.

---

## Self-Review checklist (faite)

1. **Couverture spec** :
   - `.npmrc` ✓ (Task 1)
   - `packageManager` ✓ (Task 3)
   - Scripts `package.json` migrés (npm run → pnpm, npx → pnpm exec) ✓ (Task 4)
   - Suppression `package-lock.json` + génération `pnpm-lock.yaml` ✓ (Task 5)
   - Vérification ignore files ✓ (Task 6)
   - Validation locale (lint / test / e2e / build / dev smoke) ✓ (Tasks 7–11)
   - CI `testAndLint.yml` ✓ (Task 13)
   - CI `e2e.yml` ✓ (Task 14)
   - Autres workflows vérifiés ✓ (Task 15)
   - `CLAUDE.md` ✓ (Task 16)
   - Dockerfiles : **hors scope** confirmé (spec §Docker).
   - ADR : **hors scope** confirmé (spec §Hors scope).

2. **Placeholders** : scannés, aucun TBD / TODO / fill-in.

3. **Cohérence** :
   - Version pnpm : pinnée une seule fois en Task 3 depuis la relève faite en Task 2.
   - `packageManager` cohérent avec `pnpm/action-setup@v4` (qui le lit automatiquement).
   - `node-linker=isolated` appliqué dès la Task 1, donc la Task 5 (`pnpm install`) bénéficie déjà du bon linker.
