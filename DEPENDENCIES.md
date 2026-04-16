# Gestion des dépendances

Ce document centralise les décisions prises autour des dépendances : pins, overrides, packages à surveiller, et procédure pour une campagne d'upgrade. À maintenir à chaque itération.

## Gestionnaire de paquets

Depuis avril 2026, le projet utilise **pnpm 10** (lockfile : `pnpm-lock.yaml`).

- Version pinnée via `"packageManager": "pnpm@10.x.y"` dans `package.json`.
- Config pnpm dans `.npmrc` : `node-linker=isolated` (phantom deps détectées), `auto-install-peers=true`, `strict-peer-dependencies=false`.
- Liste des build scripts approuvés explicitement via `pnpm.onlyBuiltDependencies` dans `package.json` (Prisma, sharp, esbuild, tailwind oxide, tree-sitter, unrs-resolver). pnpm 10 ignore par défaut tous les postinstall — tout ajout d'une dep avec build natif nécessite de l'ajouter à cette liste.
- Installation initiale : `npm install -g pnpm@10` puis `pnpm install`.

## Principes

- **Préférer un `^` large** (semver mineur/patch) pour laisser `pnpm update` faire son travail entre deux campagnes.
- **Pinner à la version exacte** (pas de `^`) uniquement quand une version ultérieure est connue pour être cassée ou instable. Toujours documenter pourquoi dans ce fichier.
- **Overrides au minimum** : chaque override est une dette. À re-tester à chaque campagne (voir section dédiée).
- **Ne pas mélanger** bumps mineurs/sécu et majors dans une même PR. Un lot sécu "safe" rapide, puis un major par PR pour faciliter rollback et revue.

## `engines` Node

```json
"engines": { "node": "24.9.0" }
```

Tous les environnements (dev, CI, prod) tournent sur Node 24.9.0. Pas de fallback 18/20. Cela permet notamment d'envisager ESLint 10 (qui requiert Node ≥20.19) dès que le reste de l'écosystème sera prêt (voir "Packages à surveiller").

## Pins exacts (sans `^`)

| Package | Version | Raison | Revue |
|---|---|---|---|
| `@keycloak/keycloak-admin-client` | `26.5.6` | La 26.6.0 a un `prepare` script cassé qui appelle `pnpm wireit`. À re-tester maintenant qu'on est sur pnpm (le blocage d'origine venait de `npm install`). | Check `pnpm outdated` à chaque campagne |
| `@tiptap/*` (core, extensions, react, pm, starter-kit, etc.) | `3.22.3` | Les packages `@tiptap/*` **doivent tous être à la même version** au runtime sinon l'éditeur plante (multiple `@tiptap/core` instances). On pin à l'exact pour éviter qu'un seul paquet dérive. | Bumper tout le bloc ensemble |
| `@next/env`, `next-auth`, `nextra*`, `@gouvfr/dsfr`, `convict*`, `dotenv`, `dotenv-expand`, `fast-xml-parser`, `next-router-mock`, `jest-extended`, `sanitize-html`, `sass`, `swagger-ui-react`, `ws`, `zustand`, etc. | divers | Pins historiques par prudence. Chaque ligne pourrait être remplacée par `^` lors d'une campagne si on valide que le bump mineur est safe. | À réévaluer ponctuellement |

## Overrides

**État actuel : aucun override.** ✨

Historique supprimé lors de la campagne d'avril 2026 :

| Override supprimé | Raison d'origine | Pourquoi on peut s'en passer aujourd'hui |
|---|---|---|
| `lodash-es: 4.17.23` | Forcer une version "safe" face aux CVE proto pollution / code injection dans la chaîne `nextra → mermaid → chevrotain` | Les sous-deps résolvent maintenant `4.18.1` (safe) naturellement |
| `@tiptap/core, @tiptap/pm, @tiptap/extensions: 3.22.3` | Forcer la cohérence du bloc tiptap | Tous les `@tiptap/*` en deps directes sont pinnés à `3.22.3` → dedupe naturelle sans override |
| `@asamuzakjp/css-color → @csstools/css-tokenizer: ^4.0.0` | Workaround conflit de versions dans la chaîne jsdom/cssstyle de `isomorphic-dompurify@1.x` | Pas d'impact observé sans l'override ; à disparaître complètement quand on passera `isomorphic-dompurify` en v3 |

### Règles pour ajouter un override

1. **Documenter la raison ici** (CVE, bug upstream, conflit de résolution), avec un lien vers l'issue/CVE.
2. **Définir une condition de sortie** : quelle version upstream ou quel upgrade rend l'override inutile.
3. À **re-tester** à chaque campagne en le commentant temporairement + `pnpm install` + `pnpm audit` + lint.

## Campagne d'upgrade : procédure type

1. `pnpm outdated` + `pnpm audit` → snapshot du point de départ.
2. **Lot 1 — sécu + patches** : `pnpm update` pour tous les bumps in-range, puis `pnpm audit --fix` (sans `--force`). Vérifier `pnpm audit` → 0 vulns idéalement.
3. **Lot 2 — majors low-risk** : dev deps principalement (lint plugins, test utils, type-only). PR séparée.
4. **Lot 3+ — majors breaking** : un package (ou un groupe couplé) par PR. Toujours lancer `pnpm lint` + `pnpm test` + `pnpm test:e2e` sur chaque.
5. **Vérifier les overrides** : commenter chaque override, `pnpm install`, relancer lint/audit. Si OK → supprimer pour de bon.
6. **Mettre à jour ce document** avec les nouvelles décisions.

### Pièges connus

- **Phantom deps** : pnpm en mode `node-linker=isolated` refuse toute dépendance non déclarée. Si un `Cannot find module X` apparaît après upgrade, la solution est **toujours** d'ajouter `X` explicitement via `pnpm add` / `pnpm add -D`. Ne **pas** utiliser `public-hoist-pattern[]` pour contourner (cf. ADR / PRD migration npm→pnpm).
- **Build scripts ignorés** : pnpm 10 ignore par défaut tous les `postinstall`. Toute nouvelle dep avec build natif (Prisma, sharp, esbuild, tree-sitter…) doit être ajoutée à `pnpm.onlyBuiltDependencies` dans `package.json`, sinon binaires manquants à l'exécution.
- **`eslint-import-resolver-typescript` doit être en devDep direct** et pas seulement transitive via `eslint-config-next`. Sinon `eslint-module-utils` ne le trouve pas (il est nested) et tout le lint casse avec `Resolve error: typescript with invalid interface loaded as resolver`.
- **`@faker-js/faker` install parfois corrompu** : après plusieurs installs successifs, `node_modules/@faker-js/faker/dist/types/locale/` peut contenir seulement une partie des `.d.ts`. Symptôme : `TS7016: Could not find a declaration file for module '@faker-js/faker/locale/fr'`. Fix : `rm -rf node_modules && pnpm install`.
- **`@keycloak/keycloak-admin-client 26.6.0`** : prepare script cassé (`pnpm wireit` non disponible). Rester en `26.5.6` (à re-tester maintenant qu'on est sur pnpm).
- **Deux resolvers `eslint-import-resolver-typescript` en parallèle** peuvent rendre `import/*` rules incohérentes. Vérifier `pnpm why eslint-import-resolver-typescript` après un upgrade ESLint-related.
- **`swagger-ui-react`** pull un `react-inspector` qui a un peer dep `react ^16 || ^17 || ^18`. On est en React 19 → warnings peer tolérables (`strict-peer-dependencies=false` dans `.npmrc`), à surveiller.

## Packages à surveiller pour les prochaines itérations

### Majors breaking qui mériteraient leur propre PR

| Package | Current → Latest | Niveau | Notes |
|---|---|---|---|
| `@prisma/client` + `prisma` | `6.2.1` → `7.x` | 🔴 risqué | Nouveau query engine, drop CockroachDB preview, re-jouer toutes les migrations en E2E |
| `zod` | `3.x` → `4.x` | 🔴 risqué | Rewrite. Impact sur tout `src/validation/` + tRPC inputs |
| `eslint` + `@eslint/js` + `@eslint/compat` | `9.x` → `10.x` | 🟠 bloqué | **Attend `eslint-plugin-react` compat** (latest stable 7.37.5 ne supporte que ESLint ≤9.7). Vérifier `npm view eslint-plugin-react peerDependencies` à chaque campagne |
| `pino` + `pino-pretty` | `8 + 10` → `10 + 13` | 🟠 medium | Transport API change. À bumper ensemble |
| `superjson` | `1.x` → `2.x` | 🟠 medium | ESM-only. Risque sur Vitest/ts-node/seed |
| `isomorphic-dompurify` | `1.x` → `3.x` | 🟠 medium | ESM-only (DOMPurify 3). Supprime aussi le besoin historique d'override css-tokenizer |
| `awilix` | `12.x` → `13.x` | 🟡 medium | DI core — tester `pnpm test:server` en profondeur |
| `@faker-js/faker` | `7.x` → `10.x` | 🟠 medium | 3 majors, méthodes renommées. Impact = tests uniquement |
| `marked` | `15.x` → `18.x` | 🟡 low-medium | Renderer API modifiée |
| `dotenv` + `dotenv-cli` + `dotenv-expand` | `16 + 7 + 11` → `17 + 11 + 12` | 🟠 medium | Parser rewrite, tester tous les `.env*` |
| `pdfmake` | `0.2.x` → `0.3.x` | 🟠 medium | Pre-1.0, saut important |
| `typescript` | `5.9.x` → `6.x` | 🔴 trop récent | **Laisser décanter 2-3 mois** avant de tenter |
| `htmlparser2` | `8.x` → `12.x` | 🟡 low | 4 majors successifs |
| `mime` | `3.x` → `4.x` | 🟡 low | ESM-only |
| `chroma-js` | `2.x` → `3.x` | 🟡 low | Types officiels + renames |
| `csv-parse` | `5.x` → `6.x` | 🟡 low | Stream API stable, check usage |
| `nextra` + `nextra-theme-docs` | surveiller | - | Surveiller les majors, utilisé pour le centre d'aide |

### Stratégie recommandée pour ces majors

- **Bundle 1** : ESLint 10 + plugins associés (dès que `eslint-plugin-react` est compat)
- **Bundle 2** : pino + pino-pretty
- **Bundle 3** : dotenv family
- **Un par un** : Prisma 7, Zod 4, superjson 2, awilix 13, faker 10, isomorphic-dompurify 3 (chacun mérite sa PR + QA E2E)
- **Attendre** : TypeScript 6

## Historique des campagnes

### Avril 2026 — Migration npm → pnpm
- Bascule du gestionnaire de paquets : `package-lock.json` → `pnpm-lock.yaml`, pnpm 10 pinné via `packageManager`
- `.npmrc` avec `node-linker=isolated` (détection stricte des phantom deps)
- Phantom deps révélées et ajoutées explicitement : `@next/eslint-plugin-next`, `pagefind`
- `pnpm.onlyBuiltDependencies` configuré pour approuver les postinstall natifs (Prisma, sharp, esbuild, tailwind oxide, tree-sitter, unrs-resolver)
- CI migrée : `setupNodeAndPackages` composite action + `testAndLint.yml` + `e2e.yml` utilisent `pnpm/action-setup@v4` et `pnpm install --frozen-lockfile`
- Scripts shell Scalingo (`run_*_utilisateurs.sh`, `ddp_et_creation_utilisateurs.sh`) migrés `npm ci` → `pnpm install --frozen-lockfile`
- Dockerfiles webapp laissés en l'état (décision hors scope, cf. PRD migration)

### Avril 2026
- Corrige `axios` CVE SSRF critique (CVSS 10) + 16 autres high (lodash, next, vite...)
- Passe de 17 → 0 vulnérabilités `pnpm audit`
- Supprime les 4 overrides historiques
- Supprime `lodash.pick` (déprécié + CVE) → remplacé par `src/server/utils/pick.ts`
- Drop Node 18/20 des `engines`, ne garde que 24.9.0
- Ajoute `eslint-import-resolver-typescript` en direct devDep (fix lint)
- Tentative ESLint 10 → revert (bloqué par `eslint-plugin-react`)
