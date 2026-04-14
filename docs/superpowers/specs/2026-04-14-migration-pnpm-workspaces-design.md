# Migration vers pnpm workspaces

Date : 2026-04-14
Statut : Design validé, prêt pour plan d'implémentation
Dépend de : PIL-1461 (migration npm → pnpm)

## Contexte

Seconde étape de la préparation du repo vers une structure monorepo `pnpm workspaces`.
L'objectif à moyen terme est d'accueillir plusieurs applications dans le même repo :

- `apps/pilote-ppg` — l'application actuelle (Politiques Prioritaires du Gouvernement)
- `apps/pilote` — une future application générique (ticket ultérieur)
- `apps/shared` — code partagé entre apps (ticket ultérieur)

Ce ticket s'exécute **après** PIL-1461. Son contenu peut être légèrement ajusté selon
l'état final de PIL-1461 (dépendances explicites ajoutées pour les phantom deps,
contenu exact de `.npmrc`, version pnpm figée, etc.). Le design est précis sur la
structure cible et reste générique sur les détails qui dépendent de PIL-1461.

## Objectif

Mettre en place `pnpm-workspace.yaml` à la racine, déplacer l'ensemble du code
applicatif dans `apps/pilote-ppg/`, adapter la CI et les 3 déploiements Scalingo
(webapp, auth, data_management). Aucun changement fonctionnel, aucun changement
d'arborescence interne à l'app.

## Hors scope

- Création de `apps/pilote` (ticket futur quand un besoin concret apparaît)
- Création de `apps/shared` (ticket futur, potentiellement accompagné d'un PRD)
- Extraction de morceaux de code vers un package partagé
- Ré-écriture des imports `@/*` dans le code de l'app
- Suppression des Dockerfiles webapp (ticket séparé déjà prévu)

## Décisions

### Structure minimale
Un seul package workspace dans ce ticket : `apps/pilote-ppg/`. Rien d'autre n'est
créé. Les packages futurs viendront dans leurs propres tickets quand ils auront
un besoin concret.

### Nom du package
`@pilote/ppg` (scope `@pilote/*`). Pose la convention pour tous les futurs packages
du monorepo (`@pilote/shared`, `@pilote/pilote`, etc.).

### Principe "tout dans l'app, on remontera"
Racine minimale. Uniquement ce qui est strictement obligatoire au niveau monorepo
reste à la racine. Tout le reste descend dans `apps/pilote-ppg/`, quitte à remonter
plus tard au fur et à mesure que les besoins de partage apparaîtront.

### Path aliases TypeScript
Les alias `@/client/*`, `@/server/*`, `@/components/*`, `@/validation/*`, `@/config`
restent internes à `@pilote/ppg` (redéfinis dans
`apps/pilote-ppg/tsconfig.json` comme `./src/*`). Pas de ré-écriture d'imports
dans le code applicatif. Les futurs packages partagés utiliseront leur propre
scope (`@pilote/shared/*`).

### Orchestration des commandes
Scripts d'alias dans le `package.json` racine qui filtrent vers
`@pilote/ppg` (`pnpm dev`, `pnpm test`, `pnpm lint`, etc.). DX inchangée pour
les devs : toutes les commandes usuelles continuent de fonctionner depuis la
racine, comme aujourd'hui.

### Historique Git
Déplacement via `git mv` pour préserver `git blame` et `git log --follow`.

## Structure cible

```
pilote/
├── apps/
│   └── pilote-ppg/
│       ├── package.json          ("name": "@pilote/ppg", deps + scripts de l'app)
│       ├── tsconfig.json         (alias @/* → ./src/*)
│       ├── next.config.js        (outputFileTracingRoot vers la racine monorepo)
│       ├── next-env.d.ts
│       ├── postcss.config.mjs
│       ├── playwright.config.ts
│       ├── eslint.config.mjs
│       ├── jest-extended.d.ts
│       ├── copy-assets.js
│       ├── cron.json
│       ├── README.md
│       ├── CLAUDE.md
│       ├── DEPENDENCIES.md
│       ├── comparaison-territoires.md
│       ├── .env, .env.example, .env.e2e, .env.test
│       ├── public/
│       ├── auth/                 (Procfile Keycloak + scripts)
│       ├── src/
│       │   ├── client/
│       │   ├── server/
│       │   ├── database/prisma/
│       │   ├── content/          (submodule centre d'aide)
│       │   └── …
│       ├── tests/
│       ├── scripts/              (clone_centre_aide.sh, etc.)
│       ├── docker/               (intouché, supprimé dans un ticket séparé)
│       ├── docs/, doc/
│       └── data_management/      (service Python/dbt, Procfile, Pipfile)
├── .github/
│   └── workflows/                (adaptés, cf. section CI)
├── .claude/                       (resté à la racine, détection IDE/outils)
├── .idea/                         (resté à la racine)
├── package.json                   (racine, minimal + scripts d'alias)
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── .npmrc                         (hérite de PIL-1461, enrichi si besoin)
├── .slugignore                    (chemins mis à jour)
├── .gitignore
├── .gitmodules                    (chemin submodule mis à jour)
└── .editorconfig
```

## Fichiers à créer

### `pnpm-workspace.yaml` (racine)
```yaml
packages:
  - "apps/*"
```

### `package.json` (racine, minimal)
```json
{
  "name": "pilote-monorepo",
  "private": true,
  "packageManager": "pnpm@10.x.y",
  "scripts": {
    "dev": "pnpm -F @pilote/ppg dev",
    "build": "pnpm -F @pilote/ppg build",
    "start": "pnpm -F @pilote/ppg start",
    "lint": "pnpm -F @pilote/ppg lint",
    "format": "pnpm -F @pilote/ppg format",
    "test": "pnpm -F @pilote/ppg test",
    "test:client": "pnpm -F @pilote/ppg test:client",
    "test:server": "pnpm -F @pilote/ppg test:server",
    "test:e2e": "pnpm -F @pilote/ppg test:e2e",
    "database:init": "pnpm -F @pilote/ppg database:init",
    "database:migration": "pnpm -F @pilote/ppg database:migration"
  }
}
```

### `apps/pilote-ppg/package.json`
Le `package.json` actuel, renommé en `"name": "@pilote/ppg"`, avec toutes les
deps et tous les scripts inchangés.

## Ajustements de chemins dans `apps/pilote-ppg/`

Tout ce qui référence un chemin relatif/absolu doit être vérifié :

1. **`package.json`**
   - `prisma.schema` : reste `src/database/prisma/schema.prisma` (relatif OK)
   - `prisma.seed` : reste `ts-node src/database/prisma/seed.ts` (relatif OK)
   - Script `build` : `bash scripts/clone_centre_aide.sh` (relatif OK)
2. **`next.config.js`**
   - Ajouter `outputFileTracingRoot: path.join(__dirname, '../..')` pour que
     le build standalone capture correctement les deps hoistées au niveau
     racine du monorepo
   - Vérifier le reste des chemins (assets, middlewares, etc.)
3. **`playwright.config.ts`** : `testDir`, `webServer.cwd` si présent
4. **`tsconfig.json`** : `baseUrl` = `.`, paths `@/*` → `./src/*`
5. **`eslint.config.mjs`** : patterns de fichiers scannés
6. **`copy-assets.js`** : chemins source/destination
7. **`scripts/clone_centre_aide.sh`** : vérifier l'absence de chemins en dur
   ou de `cd` racine
8. **`src/config.ts`** : vérifier qu'il ne référence pas de chemin hors du package

## CI (`.github/workflows/`)

Stratégie retenue : garder les jobs à la racine et utiliser les commandes
`pnpm -F @pilote/ppg …` (ou les scripts d'alias racine `pnpm lint`, `pnpm test`,
etc.). Pas de `working-directory` implicite.

Fichiers à adapter :
- `testAndLint.yml` : commandes déjà en `pnpm` après PIL-1461, vérifier qu'elles
  pointent vers les alias racine
- `e2e.yml` : idem
- `pr-merged-dev.yml` : adaptation des chemins `data_management/` (cf. section
  Scalingo)
- `trigger-dj-dev.yml` : vérifier d'éventuels chemins `data_management/` en dur
- `pr-review-requested.yml` : vérifier

## Déploiement Scalingo

### État actuel

Trois applications Scalingo déployées depuis le même repo Git :

1. **webapp principale** (ex. `dev-pilote-ditp`) : buildpack Node, détecte
   `package.json` à la racine, lance `pnpm install` puis `pnpm start`. Le script
   `build` joue `prisma migrate deploy && prisma db seed` comme rôle postdeploy.
2. **auth** : lit `auth/Procfile`, Keycloak.
3. **data_management** : buildpack Python, lit `data_management/Procfile` et
   `data_management/Pipfile`.

### Stratégie

- **Webapp principale** : **pas de `PROJECT_DIR`**. Le buildpack Node reste à la
  racine, voit le `package.json` minimal et ses scripts d'alias
  (`"build": "pnpm -F @pilote/ppg build"`, `"start": "pnpm -F @pilote/ppg start"`).
  `pnpm install` à la racine installe correctement l'ensemble du workspace via
  `pnpm-workspace.yaml`. Cette approche est cohérente avec le reste de notre
  orchestration.
- **auth** : `PROJECT_DIR=apps/pilote-ppg/auth` → le buildpack `cd` dans ce
  dossier et lit le Procfile.
- **data_management** : `PROJECT_DIR=apps/pilote-ppg/data_management` → idem,
  le buildpack Python détecte le Pipfile.

### Actions à faire

1. **Variables d'environnement Scalingo** (manuel, AVANT merge, sur dev ET prod) :
   ```
   scalingo --app <auth-app>         env-set PROJECT_DIR=apps/pilote-ppg/auth
   scalingo --app <data-mgmt-app>    env-set PROJECT_DIR=apps/pilote-ppg/data_management
   ```
   (Idempotent, sans effet sur le déploiement en cours.)

2. **`.slugignore`** : mise à jour des chemins racine → `apps/pilote-ppg/...`.
   Vérifier qu'on n'exclut pas `apps/pilote-ppg/src/content/` (submodule centre
   d'aide, doit être dans le slug).

3. **`.github/workflows/pr-merged-dev.yml`** :
   - `git diff --name-only … | grep '^data_management/'` → `grep '^apps/pilote-ppg/data_management/'`
   - `cd data_management && pipenv sync …` → `cd apps/pilote-ppg/data_management && pipenv sync …`
   - `hashFiles('data_management/Pipfile.lock')` → `hashFiles('apps/pilote-ppg/data_management/Pipfile.lock')`
   - `mv data_management/target tmp` → `mv apps/pilote-ppg/data_management/target tmp`

4. **`.github/workflows/trigger-dj-dev.yml`** : vérifier et adapter les chemins
   `data_management/` éventuels.

5. **`next.config.js`** : définir `outputFileTracingRoot` explicitement.

### Ordre d'exécution (coordination pré-merge)

1. Sur **dev** Scalingo : set `PROJECT_DIR` sur les apps auth et data_management
2. Déployer la branche feature sur un environnement review si possible, valider
   que les 3 apps se déploient et tournent correctement
3. Si tout OK : set `PROJECT_DIR` sur les apps **prod** Scalingo
4. Merger la PR → auto-deploy des 3 apps prod en même temps
5. Monitoring post-merge : vérifier que les 3 apps sont UP

### Risques résiduels Scalingo

- **Buildpack Node + pnpm workspaces** : risque faible mais non nul que le
  buildpack pnpm de Scalingo ait un comportement surprenant avec
  `pnpm-workspace.yaml`. À valider en premier sur dev.
- **App auth (Keycloak)** : si le buildpack n'est pas le Node standard, vérifier
  qu'il respecte bien `PROJECT_DIR`. Fallback : `.buildpacks` file ou custom
  start command.
- **Cache buildpack** : le changement de structure peut invalider le cache pnpm
  et allonger le premier déploiement. Normal.

## Points d'attention techniques

1. **Submodule `src/content/`** : `.gitmodules` référence aujourd'hui
   `src/content` → devient `apps/pilote-ppg/src/content`. À corriger.
2. **Scripts d'app** : `scripts/clone_centre_aide.sh` doit être vérifié pour
   l'absence de chemins en dur.
3. **`.env` en local** : Next lit `.env` depuis son cwd (qui sera
   `apps/pilote-ppg/`). Les devs doivent rapatrier leurs `.env*` locaux lors du
   pull. Documenter dans la PR description.
4. **Prisma + pnpm isolated** : si PIL-1461 a posé un
   `public-hoist-pattern[]=*prisma*`, le `.npmrc` racine du monorepo doit le
   contenir (pnpm lit `.npmrc` depuis la racine du workspace).
5. **Data management (`apps/pilote-ppg/data_management/`)** : son Docker et
   ses scripts Python ont leurs propres chemins relatifs. Vérifier que le
   déplacement ne casse rien côté CI et côté déploiement Scalingo.
6. **Commit strategy** : un seul gros commit `refactor: move code to apps/pilote-ppg`
   ou plusieurs (move pur puis adjustments) — à décider au moment de
   l'implémentation. Le `git mv` doit être préservé pour l'historique.

## Plan de validation

Exécuté depuis la racine du monorepo :

1. `pnpm install`
2. `pnpm lint`
3. `pnpm test`
4. `E2E_VIDEO=on pnpm test:e2e`
5. `pnpm build` (Next standalone + Pagefind + Prisma migrate/seed) — le plus à risque
6. `pnpm dev` + smoke test navigateur sur 2-3 pages clés
7. CI verte sur la PR (testAndLint + e2e)
8. Déploiement dev Scalingo validé pour les 3 apps après push de la branche
9. Déploiement prod Scalingo validé après merge

## Livrables de la PR

- `pnpm-workspace.yaml` créé
- `package.json` racine minimal créé avec scripts d'alias
- `apps/pilote-ppg/` contenant l'intégralité de l'app (via `git mv`)
- `apps/pilote-ppg/package.json` renommé en `@pilote/ppg`
- `apps/pilote-ppg/tsconfig.json`, `next.config.js` (avec
  `outputFileTracingRoot`), `playwright.config.ts`, `eslint.config.mjs`
  ajustés
- `.gitmodules` mis à jour (chemin submodule)
- `.slugignore` mis à jour
- `.github/workflows/testAndLint.yml` adapté
- `.github/workflows/e2e.yml` adapté
- `.github/workflows/pr-merged-dev.yml` adapté (chemins data_management)
- `.github/workflows/trigger-dj-dev.yml` vérifié/adapté
- `scripts/clone_centre_aide.sh` vérifié (chemins)

**Actions manuelles à documenter dans la PR (checklist pré-merge)** :
- [ ] `PROJECT_DIR` défini sur l'app Scalingo auth (dev + prod)
- [ ] `PROJECT_DIR` défini sur l'app Scalingo data_management (dev + prod)
- [ ] Déploiement dev validé sur les 3 apps
- [ ] Rapatriement des `.env*` locaux communiqué à l'équipe

## Critères d'acceptation

- [ ] `pnpm install` fonctionne depuis un `node_modules` vide à la racine
- [ ] `pnpm lint` passe
- [ ] `pnpm test` passe
- [ ] `E2E_VIDEO=on pnpm test:e2e` passe
- [ ] `pnpm build` passe (Next + Prisma + Pagefind)
- [ ] `pnpm dev` démarre et smoke test navigateur OK
- [ ] CI verte (testAndLint + e2e)
- [ ] Submodule `src/content/` accessible au nouveau chemin
- [ ] Webapp Scalingo dev déployée et UP
- [ ] Auth Scalingo dev déployée et UP
- [ ] Data_management Scalingo dev déployée et reachable
- [ ] Les 3 apps prod déployées et UP après merge
- [ ] `git log --follow apps/pilote-ppg/src/<fichier>` montre bien l'historique pré-migration

## Ce qui reste volontairement flou

- Version exacte de pnpm (reprise de PIL-1461)
- Contenu exact de `.npmrc` racine (dépend des `public-hoist-pattern` posés
  dans PIL-1461)
- Stratégie finale de commit (un gros commit vs plusieurs)
- Noms exacts des apps Scalingo dev/prod (à récupérer au moment de
  l'implémentation)

## Prochaines étapes (hors scope)

- Suppression des Dockerfiles webapp inutilisés (ticket dédié)
- PRD pour la création de `apps/shared` et l'extraction de code partagé
- Création de `apps/pilote` quand le besoin concret se présentera
- Extraction du centre d'aide et de la solution de logs (tickets dédiés)
