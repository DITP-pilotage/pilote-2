# Migration pnpm workspaces — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Déplacer l'app Next.js dans `apps/pilote-ppg/` et configurer pnpm workspaces, sans changement fonctionnel.

**Architecture:** Monorepo pnpm workspaces avec un seul package `@pilote/ppg` dans `apps/pilote-ppg/`. La racine contient un `package.json` minimal avec des scripts d'alias `pnpm -F @pilote/ppg …`. Le `git mv` préserve l'historique. CI et Scalingo adaptés pour la nouvelle structure.

**Tech Stack:** pnpm 10 workspaces, Next.js 14 standalone, Prisma, Playwright, Vitest, GitHub Actions, Scalingo

**Spec:** `docs/superpowers/specs/2026-04-14-migration-pnpm-workspaces-design.md`

---

## Vue d'ensemble des tâches

| # | Tâche | Parallélisable |
|---|-------|----------------|
| 1 | Scaffolding workspace (racine) | non |
| 2 | `git mv` de l'app vers `apps/pilote-ppg/` | non (dépend 1) |
| 3 | Adapter `apps/pilote-ppg/package.json` | non (dépend 2) |
| 4 | Adapter `apps/pilote-ppg/tsconfig.json` | oui (dépend 2) |
| 5 | Adapter `next.config.js` + `copy-assets.js` (standalone paths) | oui (dépend 2) |
| 6 | Adapter `.gitmodules` | oui (dépend 2) |
| 7 | Adapter `.gitignore` (racine + app) | oui (dépend 2) |
| 8 | Adapter `.slugignore` | oui (dépend 2) |
| 9 | Adapter `apps/pilote-ppg/eslint.config.mjs` | oui (dépend 2) |
| 10 | Adapter les workflows CI | oui (dépend 2) |
| 11 | Validation `pnpm install` | non (dépend 1-10) |
| 12 | Validation `pnpm lint` | non (dépend 11) |
| 13 | Validation `pnpm test` | non (dépend 11) |
| 14 | Validation E2E | non (dépend 11) |
| 15 | Validation `pnpm build` + `pnpm dev` | non (dépend 11) |
| 16 | Commit final + push | non (dépend 12-15) |

---

### Task 1: Scaffolding workspace (racine)

Créer la structure workspace à la racine : `pnpm-workspace.yaml` et le `package.json` minimal.

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `apps/` (dossier vide, existera après `git mv` en task 2)
- Modify: `package.json` (sera remplacé par la version minimale racine — l'actuel sera déplacé en task 2)

- [ ] **Step 1: Créer `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
```

- [ ] **Step 2: Créer le dossier `apps/`**

```bash
mkdir -p apps
```

- [ ] **Step 3: Préparer le `package.json` racine minimal**

Ne pas écrire ce fichier maintenant — il sera créé en task 3 après le `git mv` (sinon conflit avec le `package.json` actuel qui doit être déplacé).

Contenu prévu (à écrire en task 3) :
```json
{
  "name": "pilote-monorepo",
  "private": true,
  "packageManager": "pnpm@10.28.2",
  "engines": {
    "node": "24.9.0"
  },
  "scripts": {
    "dev": "pnpm -F @pilote/ppg dev",
    "build": "pnpm -F @pilote/ppg build",
    "build:dev": "pnpm -F @pilote/ppg build:dev",
    "start": "pnpm -F @pilote/ppg start",
    "lint": "pnpm -F @pilote/ppg lint",
    "lint:fix": "pnpm -F @pilote/ppg lint:fix",
    "format": "pnpm -F @pilote/ppg format",
    "format:check": "pnpm -F @pilote/ppg format:check",
    "test": "pnpm -F @pilote/ppg test",
    "test:client": "pnpm -F @pilote/ppg test:client",
    "test:server": "pnpm -F @pilote/ppg test:server",
    "test:e2e": "pnpm -F @pilote/ppg test:e2e",
    "test:e2e:seed": "pnpm -F @pilote/ppg test:e2e:seed",
    "test:e2e:ui": "pnpm -F @pilote/ppg test:e2e:ui",
    "test:database:init": "pnpm -F @pilote/ppg test:database:init",
    "database:init": "pnpm -F @pilote/ppg database:init",
    "database:init-force": "pnpm -F @pilote/ppg database:init-force",
    "database:migration": "pnpm -F @pilote/ppg database:migration"
  }
}
```

---

### Task 2: `git mv` de l'app vers `apps/pilote-ppg/`

Déplacer TOUS les fichiers et dossiers de l'app dans `apps/pilote-ppg/` via `git mv` pour préserver l'historique. Seuls restent à la racine les fichiers strictement monorepo.

**Files:**
- Move: tout sauf `.github/`, `.claude/`, `.idea/`, `.git/`, `.gitignore`, `.gitmodules`, `.editorconfig`, `.slugignore`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `apps/`, `node_modules/`

**Principe** : tout ce qui fait partie de l'app descend. Ce qui est outillage repo/IDE reste.

- [ ] **Step 1: Déplacer les fichiers et dossiers de l'app**

Exécuter ce script depuis la racine du repo. L'ordre est important : d'abord créer le dossier cible, puis déplacer.

```bash
mkdir -p apps/pilote-ppg

# Dossiers de l'app
git mv auth apps/pilote-ppg/
git mv data_management apps/pilote-ppg/
git mv doc apps/pilote-ppg/
git mv docs apps/pilote-ppg/
git mv docker apps/pilote-ppg/
git mv prd apps/pilote-ppg/
git mv public apps/pilote-ppg/
git mv scripts apps/pilote-ppg/
git mv src apps/pilote-ppg/
git mv tests apps/pilote-ppg/
git mv uploads apps/pilote-ppg/
git mv vitest.projects apps/pilote-ppg/

# Fichiers de config de l'app
git mv package.json apps/pilote-ppg/
git mv tsconfig.json apps/pilote-ppg/
git mv next.config.js apps/pilote-ppg/
git mv next-env.d.ts apps/pilote-ppg/
git mv postcss.config.mjs apps/pilote-ppg/
git mv playwright.config.ts apps/pilote-ppg/
git mv eslint.config.mjs apps/pilote-ppg/
git mv tailwind.config.js apps/pilote-ppg/
git mv vitest.config.ts apps/pilote-ppg/
git mv vitest.setup.ts apps/pilote-ppg/
git mv vitest.setup.server.ts apps/pilote-ppg/
git mv vitest.d.ts apps/pilote-ppg/
git mv jest-extended.d.ts apps/pilote-ppg/
git mv copy-assets.js apps/pilote-ppg/
git mv cron.json apps/pilote-ppg/
git mv yml.d.ts apps/pilote-ppg/

# Fichiers doc/metadata de l'app
git mv CLAUDE.md apps/pilote-ppg/
git mv DEPENDENCIES.md apps/pilote-ppg/
git mv README.md apps/pilote-ppg/
git mv README_procedures_tech.md apps/pilote-ppg/
git mv README_modele_de_donnees.md apps/pilote-ppg/
git mv comparaison-territoires.md apps/pilote-ppg/

# Docker
git mv docker-compose.yml apps/pilote-ppg/
git mv docker-compose.prod.yml apps/pilote-ppg/
git mv .dockerignore apps/pilote-ppg/

# Dotfiles de l'app (trackés par git)
git mv .env.example apps/pilote-ppg/
git mv .env.e2e apps/pilote-ppg/
git mv .env.test apps/pilote-ppg/
git mv .adr-dir apps/pilote-ppg/
git mv .eslintrc.json.backup apps/pilote-ppg/
```

**Note :** le fichier `.env` (secrets locaux) est dans `.gitignore` donc pas
tracké. Les devs devront le déplacer manuellement :
```bash
mv .env apps/pilote-ppg/.env
```

Le fichier `tsconfig.tsbuildinfo` n'est pas tracké (généré). S'il existe, il sera
recréé automatiquement au prochain build.

- [ ] **Step 2: Vérifier que `git status` est propre (que des renames)**

```bash
git status
```

Attendu : que des `renamed:` (pas de `deleted:` ni `new file:` non voulus).

- [ ] **Step 3: Ne PAS committer encore** — on ajuste les fichiers d'abord dans les tasks suivantes.

---

### Task 3: Adapter `apps/pilote-ppg/package.json` + créer root `package.json`

**Files:**
- Modify: `apps/pilote-ppg/package.json`
- Create: `package.json` (racine)

- [ ] **Step 1: Modifier `apps/pilote-ppg/package.json`**

Changer le champ `name` :

```diff
- "name": "ditp-pilote",
+ "name": "@pilote/ppg",
```

Supprimer `engines` et `packageManager` (les deux vont au root uniquement) :

```diff
- "packageManager": "pnpm@10.28.2",
- "engines": {
-   "node": "24.9.0"
- },
```

**Corriger le script `start`** — avec `outputFileTracingRoot` pointant vers la
racine monorepo (task 5), Next.js standalone reproduit l'arborescence relative.
Le `server.js` sera à `.next/standalone/apps/pilote-ppg/server.js` :

```diff
- "start": "node --max-old-space-size=${MAX_OLD_SPACE_SIZE:-768} .next/standalone/server.js",
+ "start": "node --max-old-space-size=${MAX_OLD_SPACE_SIZE:-768} .next/standalone/apps/pilote-ppg/server.js",
```

Tout le reste (autres scripts, deps, prisma, etc.) reste inchangé.

- [ ] **Step 2: Créer le `package.json` racine**

```json
{
  "name": "pilote-monorepo",
  "private": true,
  "packageManager": "pnpm@10.28.2",
  "engines": {
    "node": "24.9.0"
  },
  "scripts": {
    "dev": "pnpm -F @pilote/ppg dev",
    "build": "pnpm -F @pilote/ppg build",
    "build:dev": "pnpm -F @pilote/ppg build:dev",
    "start": "pnpm -F @pilote/ppg start",
    "lint": "pnpm -F @pilote/ppg lint",
    "lint:fix": "pnpm -F @pilote/ppg lint:fix",
    "format": "pnpm -F @pilote/ppg format",
    "format:check": "pnpm -F @pilote/ppg format:check",
    "test": "pnpm -F @pilote/ppg test",
    "test:client": "pnpm -F @pilote/ppg test:client",
    "test:server": "pnpm -F @pilote/ppg test:server",
    "test:e2e": "pnpm -F @pilote/ppg test:e2e",
    "test:e2e:seed": "pnpm -F @pilote/ppg test:e2e:seed",
    "test:e2e:ui": "pnpm -F @pilote/ppg test:e2e:ui",
    "test:database:init": "pnpm -F @pilote/ppg test:database:init",
    "database:init": "pnpm -F @pilote/ppg database:init",
    "database:init-force": "pnpm -F @pilote/ppg database:init-force",
    "database:migration": "pnpm -F @pilote/ppg database:migration"
  }
}
```

---

### Task 4: Adapter `apps/pilote-ppg/tsconfig.json`

**Files:**
- Modify: `apps/pilote-ppg/tsconfig.json`

Le `baseUrl` est `./src` (relatif au package, OK). Mais deux entrées utilisent des chemins absolus filesystem qui pointaient vers `/data_management/...` — ils doivent devenir relatifs.

- [ ] **Step 1: Corriger le path alias `@/ppg_metadata/*`**

```diff
      "@/ppg_metadata/*": [
-       "/data_management/models/raw/ppg_metadata/"
+       "../data_management/models/raw/ppg_metadata/"
      ],
```

Explication : `baseUrl` = `./src` donc `../data_management/` remonte de `src/` vers `apps/pilote-ppg/` puis descend dans `data_management/`.

- [ ] **Step 2: Corriger l'entrée `include`**

```diff
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
-   "/data_management/models/raw/ppg_metadata/schema.yml",
+   "data_management/models/raw/ppg_metadata/schema.yml",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
```

L'`include` est résolu depuis le dossier du tsconfig (= `apps/pilote-ppg/`), donc `data_management/...` sans `/` initial est correct.

---

### Task 5: Adapter `apps/pilote-ppg/next.config.js` + `copy-assets.js`

**Files:**
- Modify: `apps/pilote-ppg/next.config.js`
- Modify: `apps/pilote-ppg/copy-assets.js`

Le `outputFileTracingRoot` doit pointer vers la racine du monorepo pour que le
build standalone capture les deps hoistées par pnpm. **Conséquence** : Next.js
standalone reproduit l'arborescence depuis cette racine, donc `server.js` et les
assets seront à `.next/standalone/apps/pilote-ppg/` au lieu de `.next/standalone/`.

- [ ] **Step 1: Changer `outputFileTracingRoot` dans `next.config.js`**

Ligne 23 actuelle :
```js
outputFileTracingRoot: __dirname,
```

Remplacer par :
```js
outputFileTracingRoot: path.join(__dirname, '../..'),
```

Tout le reste (`src/content` submodule path, rewrites, webpack) utilise `__dirname` et reste valide.

- [ ] **Step 2: Adapter `copy-assets.js` pour le nouveau chemin standalone**

Le script copie `static/` et `public/` dans le dossier standalone. Avec le nouveau
`outputFileTracingRoot`, la structure interne du standalone change.

Fichier actuel :
```js
const staticSrcPath = path.join(__dirname, '.next/static');
const staticDestPath = path.join(__dirname, '.next/standalone/.next/static');

const publicSrcPath = path.join(__dirname, 'public');
const publicDestPath = path.join(__dirname, '.next/standalone/public');
```

Remplacer par :
```js
const staticSrcPath = path.join(__dirname, '.next/static');
const staticDestPath = path.join(__dirname, '.next/standalone/apps/pilote-ppg/.next/static');

const publicSrcPath = path.join(__dirname, 'public');
const publicDestPath = path.join(__dirname, '.next/standalone/apps/pilote-ppg/public');
```

Le `__dirname` vaut `apps/pilote-ppg/` (car le fichier y vit), donc les sources
restent correctes. Seules les destinations changent pour correspondre à la
structure standalone.

---

### Task 6: Adapter `.gitmodules`

**Files:**
- Modify: `.gitmodules` (à la racine du repo)

- [ ] **Step 1: Mettre à jour le chemin du submodule**

```diff
 [submodule "src/content"]
-	path = src/content
+	path = apps/pilote-ppg/src/content
 	url = git@github.com:DITP-pilotage/centre-aide-pilote-2.git
```

- [ ] **Step 2: Synchroniser le submodule**

```bash
git submodule sync
```

---

### Task 7: Adapter `.gitignore`

**Files:**
- Modify: `.gitignore` (racine) — garder uniquement les patterns globaux
- Create: `apps/pilote-ppg/.gitignore` — patterns spécifiques à l'app

- [ ] **Step 1: Réécrire le `.gitignore` racine**

Garder uniquement les patterns globaux du monorepo :

```gitignore
# dependencies
node_modules/
.pnp
.pnp.js

# misc
.DS_Store
*.pem
*.crt
*.der

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# local env files
.env
.env*.local
.env.prod

# IDE
.idea/
.vscode/
.cursor/
.claude/
!.claude/skills/feature/SKILL.md

# misc
qodana.yaml
*.pgsql
.devtools
```

- [ ] **Step 2: Créer `apps/pilote-ppg/.gitignore`**

Patterns spécifiques à l'app Next.js :

```gitignore
# next.js
/.next/
/out/

# production
/build

# testing
/coverage
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/

# uploads
/uploads

# typescript
*.tsbuildinfo

# generated
public/centreaide/
public/_pagefind/

# submodule (cloné au build)
src/content/

# local env
.env
.env.e2e
.env.test
```

---

### Task 8: Adapter `.slugignore`

**Files:**
- Modify: `.slugignore` (racine)

Le `.slugignore` est lu par Scalingo depuis la racine du repo. Tous les chemins doivent être préfixés par `apps/pilote-ppg/`.

- [ ] **Step 1: Réécrire `.slugignore`**

```
.cache
apps/pilote-ppg/CLAUDE.md
apps/pilote-ppg/copy-assets.js
apps/pilote-ppg/cron.json
apps/pilote-ppg/doc
apps/pilote-ppg/docker
apps/pilote-ppg/docker-compose.prod.yml
apps/pilote-ppg/docker-compose.yml
.editorconfig
apps/pilote-ppg/.env.ci
apps/pilote-ppg/.env.example
apps/pilote-ppg/.env.test.example
apps/pilote-ppg/.eslintrc.json
.github
.gitmodules
.gitignore
apps/pilote-ppg/jest*
apps/pilote-ppg/README*
node_modules
apps/pilote-ppg/data_management
apps/pilote-ppg/auth
apps/pilote-ppg/tests
apps/pilote-ppg/.next/cache
apps/pilote-ppg/public/
.dockerignore
apps/pilote-ppg/middleware.ts
apps/pilote-ppg/next.config.js
apps/pilote-ppg/next-env.d.ts
apps/pilote-ppg/playwright.config.ts
apps/pilote-ppg/postcss.config.mjs
apps/pilote-ppg/scalingo
apps/pilote-ppg/tailwind.config.js
apps/pilote-ppg/yml.d.ts
pnpm-workspace.yaml
```

**Note :** ne PAS exclure `apps/pilote-ppg/src/content/` (le submodule centre d'aide doit rester dans le slug).

---

### Task 9: Adapter `apps/pilote-ppg/eslint.config.mjs`

**Files:**
- Modify: `apps/pilote-ppg/eslint.config.mjs`

Les ignores globaux utilisent des chemins relatifs qui restent valides car ESLint sera lancé depuis le dossier du package (pnpm `-F` exécute dans le CWD du package). Pas de modification nécessaire.

- [ ] **Step 1: Vérifier — aucune modification attendue**

Les patterns `".next/**"`, `"node_modules/**"`, `"auth/**"`, `"data_management/**"`, etc. sont tous relatifs au CWD d'exécution = `apps/pilote-ppg/`. OK.

---

### Task 10: Adapter les workflows CI

**Files:**
- Modify: `.github/workflows/testAndLint.yml`
- Modify: `.github/workflows/e2e.yml`
- Modify: `.github/workflows/pr-merged-dev.yml`

- [ ] **Step 1: Adapter `testAndLint.yml`**

Seul le job `lint-sql` a un `working-directory` à changer. Les jobs `test` et `lint` utilisent les alias racine (`pnpm test`, `pnpm lint`) qui sont inchangés.

```diff
   lint-sql:
     name: Run SQL linter on dbt models
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: actions/setup-python@v2
         with:
           python-version: "3.10"
       - name: Install SQLFluff
         run: "pip install sqlfluff~=4.1.0 sqlfluff-templater-dbt~=4.1.0 dbt-core~=1.10.20 dbt-duckdb~=1.9.0"
       - name: Install dbt deps
-        working-directory: data_management
+        working-directory: apps/pilote-ppg/data_management
         run: "dbt deps"
       - name: Lint models
-        working-directory: data_management
+        working-directory: apps/pilote-ppg/data_management
         env:
           DBT_TARGET: local
         run: "sqlfluff lint models/ -v"
```

- [ ] **Step 2: Adapter `e2e.yml`**

Les artifacts Playwright seront générés dans `apps/pilote-ppg/` car pnpm exécute le test depuis le CWD du package. Adapter les chemins d'upload et de parsing :

```diff
       - name: Parse test results
         id: test-results
         if: failure()
         run: |
-          if [ -f test-results/results.json ]; then
-            TOTAL_TESTS=$(jq '.stats.expected + .stats.unexpected + .stats.flaky + .stats.skipped' test-results/results.json 2>/dev/null || echo "0")
-            PASSED_TESTS=$(jq '.stats.expected' test-results/results.json 2>/dev/null || echo "0")
-            FAILED_TESTS=$(jq '.stats.unexpected' test-results/results.json 2>/dev/null || echo "0")
-            FLAKY_TESTS=$(jq '.stats.flaky' test-results/results.json 2>/dev/null || echo "0")
-            SKIPPED_TESTS=$(jq '.stats.skipped' test-results/results.json 2>/dev/null || echo "0")
-            DURATION=$(jq '.stats.duration' test-results/results.json 2>/dev/null || echo "0")
-            FAILED_TEST_NAMES=$(jq -r '.suites[]?.specs[]? | select(.tests[]?.results[]?.status == "failed") | .title' test-results/results.json 2>/dev/null | head -5 | sed 's/^/• /' | tr '\n' '|' | sed 's/|$//')
+          RESULTS_FILE="apps/pilote-ppg/test-results/results.json"
+          if [ -f "$RESULTS_FILE" ]; then
+            TOTAL_TESTS=$(jq '.stats.expected + .stats.unexpected + .stats.flaky + .stats.skipped' "$RESULTS_FILE" 2>/dev/null || echo "0")
+            PASSED_TESTS=$(jq '.stats.expected' "$RESULTS_FILE" 2>/dev/null || echo "0")
+            FAILED_TESTS=$(jq '.stats.unexpected' "$RESULTS_FILE" 2>/dev/null || echo "0")
+            FLAKY_TESTS=$(jq '.stats.flaky' "$RESULTS_FILE" 2>/dev/null || echo "0")
+            SKIPPED_TESTS=$(jq '.stats.skipped' "$RESULTS_FILE" 2>/dev/null || echo "0")
+            DURATION=$(jq '.stats.duration' "$RESULTS_FILE" 2>/dev/null || echo "0")
+            FAILED_TEST_NAMES=$(jq -r '.suites[]?.specs[]? | select(.tests[]?.results[]?.status == "failed") | .title' "$RESULTS_FILE" 2>/dev/null | head -5 | sed 's/^/• /' | tr '\n' '|' | sed 's/|$//')
```

La commande Playwright — `pnpm exec playwright` depuis la racine ne trouvera
pas le binaire (c'est une dep du package, pas du root). Utiliser le filtre ou
l'alias racine :

```diff
       - name: Install Playwright browsers
-        run: pnpm exec playwright install chromium --with-deps
+        run: pnpm -F @pilote/ppg exec playwright install chromium --with-deps

       - name: Run E2E tests
         id: playwright-tests
         run: |
           set -e
-          pnpm exec playwright test --workers=1
+          pnpm -F @pilote/ppg exec playwright test --workers=1
```

Et les artifacts :

```diff
       - name: Upload test results
         id: upload-results
         uses: actions/upload-artifact@v4
         if: failure()
         with:
           name: playwright-report-${{ github.run_number }}
           path: |
-            playwright-report/
-            test-results/
+            apps/pilote-ppg/playwright-report/
+            apps/pilote-ppg/test-results/
           retention-days: 2
```

- [ ] **Step 3: Adapter `pr-merged-dev.yml`**

```diff
       - name: "Vérifier changements data_management/"
         id: datamgmt_changes
         run: |
           BASE_SHA="${{ github.event.pull_request.base.sha }}"
           MERGE_COMMIT_SHA="${{ github.event.pull_request.merge_commit_sha }}"
-          if git diff --name-only "$BASE_SHA" "$MERGE_COMMIT_SHA" | grep '^data_management/'; then
+          if git diff --name-only "$BASE_SHA" "$MERGE_COMMIT_SHA" | grep '^apps/pilote-ppg/data_management/'; then
             echo "changed=true" >> $GITHUB_OUTPUT
           else
             echo "changed=false" >> $GITHUB_OUTPUT
           fi
```

```diff
       - id: cache-pipfile
         name: Cache Pipfile
         uses: actions/cache@v4
         with:
           path: ~/.local/share/virtualenvs
-          key: ${{ runner.os }}-python-${{ steps.setup-python.outputs.python-version }}-pipenv-${{ hashFiles('data_management/Pipfile.lock') }}
+          key: ${{ runner.os }}-python-${{ steps.setup-python.outputs.python-version }}-pipenv-${{ hashFiles('apps/pilote-ppg/data_management/Pipfile.lock') }}
```

```diff
       - name: "install dependencies"
         if: steps.datamgmt_changes.outputs.changed == 'true'
-        run: cd data_management && pipenv sync && pipenv run dbt deps
+        run: cd apps/pilote-ppg/data_management && pipenv sync && pipenv run dbt deps
```

```diff
       - name: "Create Tunnel and Generate DBT Doc"
         # ... (env vars inchangés)
         run: |
           set -e
           scalingo db-tunnel SCALINGO_POSTGRESQL_URL_READONLY &
           # ... (tunnel setup inchangé)

-          cd data_management
+          cd apps/pilote-ppg/data_management
           pipenv run dbt docs generate --static
```

```diff
       - name: "Deploy dbt docs to GitHub Pages"
         # ...
         run: |
           set -e
-          mv data_management/target tmp
+          mv apps/pilote-ppg/data_management/target tmp
           # ... (reste inchangé)
```

- [ ] **Step 4: Vérifier `trigger-dj-dev.yml`**

Ce workflow exécute `scalingo run /bin/bash scripts/run_datajobs.sh` sur le container Scalingo data_management. Avec `PROJECT_DIR=apps/pilote-ppg/data_management`, Scalingo `cd` dans ce dossier et le script `scripts/run_datajobs.sh` fait référence à `data_management/scripts/`, pas au root. Pas de modification nécessaire dans le workflow.

- [ ] **Step 5: Vérifier `pr-review-requested.yml`**

Aucun chemin en dur. Pas de modification.

---

### Task 11: Validation `pnpm install`

**Files:** aucune modification

- [ ] **Step 1: Supprimer le node_modules existant et réinstaller**

```bash
rm -rf node_modules apps/pilote-ppg/node_modules
pnpm install
```

Attendu : installation réussie, le `pnpm-lock.yaml` est mis à jour (le package a changé de nom), les deps sont installées dans `node_modules/` à la racine (hoisting pnpm workspaces).

- [ ] **Step 2: Vérifier que le workspace est bien détecté**

```bash
pnpm list --filter @pilote/ppg --depth 0
```

Attendu : affiche `@pilote/ppg` avec ses dépendances directes.

- [ ] **Step 3: Vérifier que les alias racine fonctionnent**

```bash
pnpm run --silent env -- echo "OK"
```

Si cette commande échoue, vérifier que le `package.json` racine est correct.

---

### Task 12: Validation `pnpm lint`

- [ ] **Step 1: Lancer le lint**

L'utilisateur lance :
```bash
pnpm lint
```

Attendu : passe sans erreurs. Si des erreurs de résolution de modules apparaissent, c'est probablement un problème de `tsconfig.json` paths ou de `baseUrl`.

Problèmes possibles :
- `@/ppg_metadata/*` non résolu → vérifier task 4
- Prisma types non trouvés → peut nécessiter un `.npmrc` avec `public-hoist-pattern[]=*prisma*` à la racine
- `Cannot find module` → vérifier que `pnpm install` a bien hoisted les deps

---

### Task 13: Validation `pnpm test`

- [ ] **Step 1: Lancer les tests unitaires et d'intégration**

L'utilisateur lance :
```bash
pnpm test
```

Attendu : vitest se lance depuis `apps/pilote-ppg/`, résout les paths via `vitest.config.ts` local et les sous-projets `vitest.projects/`. Tous les tests passent.

Problèmes possibles :
- `vitest.config.ts` paths → les chemins `./vitest.projects/...` sont relatifs au package, OK
- `tsconfig-paths` dans vitest → vérifie les aliases depuis le `tsconfig.json` local, OK
- Intégration tests DB → la connection string dans `.env.test` doit être dans `apps/pilote-ppg/.env.test`

---

### Task 14: Validation E2E

- [ ] **Step 1: Lancer les tests E2E**

L'utilisateur lance :
```bash
E2E_VIDEO=on pnpm test:e2e
```

Attendu : Playwright se lance depuis `apps/pilote-ppg/`, trouve `playwright.config.ts`,
lance le webServer (`pnpm test:e2e:server` = `dotenv -e .env.e2e pnpm dev`),
exécute les tests. Les artifacts (`test-results/`, `playwright-report/`) sont
générés dans `apps/pilote-ppg/`.

Problèmes possibles :
- `.env.e2e` introuvable → doit être dans `apps/pilote-ppg/.env.e2e`
- `tests/seed/seed.sh` non trouvé → vérifier les chemins dans `global-setup.ts` (relatifs, OK)
- WebServer timeout → le `pnpm dev` filtré peut être plus lent au premier lancement

---

### Task 15: Validation `pnpm build` + `pnpm dev`

- [ ] **Step 1: Lancer le build**

L'utilisateur lance :
```bash
pnpm build
```

Attendu : le build Next.js standalone se complète. Les points à risque :
- `outputFileTracingRoot` doit pointer vers la racine monorepo (task 5)
- `prisma generate` doit fonctionner depuis le CWD du package
- `scripts/clone_centre_aide.sh` s'exécute avec CWD = `apps/pilote-ppg/`, les chemins relatifs `src/content` restent valides
- `copy-assets.js` chemins dest adaptés en task 5 pour `.next/standalone/apps/pilote-ppg/`
- `pagefind` paths (`--site .next/server/app --output-path public/_pagefind`) sont relatifs, OK

- [ ] **Step 2: Lancer le dev server**

L'utilisateur lance :
```bash
pnpm dev
```

Attendu : le serveur démarre, navigateur sur `http://localhost:3000`, smoke test sur 2-3 pages.

---

### Task 16: Commit final + push

- [ ] **Step 1: Vérifier l'état git**

```bash
git status
git diff --stat
```

Attendu : des renames massifs (le `git mv`) + modifications des fichiers de config.

- [ ] **Step 2: Vérifier la préservation de l'historique**

```bash
git log --follow --oneline -5 apps/pilote-ppg/src/pages/index.tsx
```

Attendu : montre l'historique pré-migration (pas uniquement le commit de migration).

- [ ] **Step 3: Committer**

```bash
git add -A
git commit -m "refactor: migrate to pnpm workspaces — move app to apps/pilote-ppg/"
```

- [ ] **Step 4: Pousser la branche et ouvrir la PR**

```bash
git push -u origin <branch-name>
```

Description PR à inclure :

```markdown
## Migration pnpm workspaces

Déplace l'application dans `apps/pilote-ppg/` et configure pnpm workspaces.

### Changements
- `pnpm-workspace.yaml` créé
- `package.json` racine minimal avec scripts d'alias `pnpm -F @pilote/ppg`
- App déplacée via `git mv` (historique préservé)
- `next.config.js` : `outputFileTracingRoot` pointe vers la racine monorepo
- `tsconfig.json` : chemins `@/ppg_metadata/*` corrigés (relatifs)
- `.gitmodules` : chemin submodule mis à jour
- `.gitignore` : split root (global) / app (spécifique)
- `.slugignore` : chemins préfixés `apps/pilote-ppg/`
- CI workflows : chemins artifacts et data_management mis à jour

### Checklist pré-merge
- [ ] `PROJECT_DIR=apps/pilote-ppg/auth` défini sur l'app Scalingo auth (dev + prod)
- [ ] `PROJECT_DIR=apps/pilote-ppg/data_management` défini sur l'app Scalingo data_management (dev + prod)
- [ ] Déploiement dev validé sur les 3 apps Scalingo
- [ ] Communiquer aux devs : déplacer vos `.env*` locaux dans `apps/pilote-ppg/`

### Pour les développeurs
Après le pull :
\```bash
mv .env apps/pilote-ppg/.env
mv .env.e2e apps/pilote-ppg/.env.e2e
mv .env.test apps/pilote-ppg/.env.test
rm -rf node_modules
pnpm install
\```
```

---

## Résumé des fichiers impactés

| Action | Fichier |
|--------|---------|
| **Create** | `pnpm-workspace.yaml` |
| **Create** | `package.json` (racine) |
| **Create** | `apps/pilote-ppg/.gitignore` |
| **Move** | Tous les fichiers app → `apps/pilote-ppg/` |
| **Modify** | `apps/pilote-ppg/package.json` (name → `@pilote/ppg`, start script path) |
| **Modify** | `apps/pilote-ppg/tsconfig.json` (paths ppg_metadata + include) |
| **Modify** | `apps/pilote-ppg/next.config.js` (outputFileTracingRoot) |
| **Modify** | `apps/pilote-ppg/copy-assets.js` (standalone dest paths) |
| **Modify** | `.gitmodules` (chemin submodule) |
| **Modify** | `.gitignore` (nettoyé, patterns globaux uniquement) |
| **Modify** | `.slugignore` (chemins préfixés) |
| **Modify** | `.github/workflows/testAndLint.yml` (working-directory) |
| **Modify** | `.github/workflows/e2e.yml` (artifacts paths) |
| **Modify** | `.github/workflows/pr-merged-dev.yml` (data_management paths) |
| **Inchangé** | `apps/pilote-ppg/eslint.config.mjs` |
| **Inchangé** | `apps/pilote-ppg/playwright.config.ts` |
| **Inchangé** | `apps/pilote-ppg/vitest.config.ts` |
| **Inchangé** | `apps/pilote-ppg/scripts/clone_centre_aide.sh` |
| **Inchangé** | `.github/workflows/trigger-dj-dev.yml` |
| **Inchangé** | `.github/workflows/pr-review-requested.yml` |
