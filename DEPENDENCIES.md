# Gestion des dépendances

Ce document centralise les décisions prises autour des dépendances : pins, overrides, packages à surveiller, et procédure pour une campagne d'upgrade. À maintenir à chaque itération.

Le monorepo contient 3 apps :
- `@pilote/ppg` (`apps/pilote-ppg`) : app Next.js historique (PILOTE)
- `@pilote/kpilote-api` (`apps/kpilote-api`) : backend Hono (pilote MB)
- `@pilote/kpilote-webapp` (`apps/kpilote-webapp`) : webapp (pilote MB)

Toutes les décisions ci-dessous s'appliquent au monorepo (root `package.json` pour les overrides ; pins et deps directes dans chaque app).

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
| `fast-xml-parser` | `5.7.3` | Bumpé en mai 2026 pour CVEs. Pinné car la 5.7.1 introduit `@nodable/entities` v2.1.0 avec breaking changes sur les entités — on fige tant qu'on n'a pas vérifié l'impact. | À évaluer pour passer en `^5.7.3` |
| `@next/env`, `next-auth`, `nextra*`, `@gouvfr/dsfr`, `convict*`, `dotenv`, `dotenv-expand`, `next-router-mock`, `jest-extended`, `sanitize-html`, `sass`, `swagger-ui-react`, `ws`, `zustand`, etc. | divers | Pins historiques par prudence. Chaque ligne pourrait être remplacée par `^` lors d'une campagne si on valide que le bump mineur est safe. | À réévaluer ponctuellement |

## Overrides

Définis dans `pnpm.overrides` du `package.json` racine. Tous ajoutés lors de la campagne sécu de mai 2026 pour corriger des CVEs dans des transitives profondes que les ranges parents ne pouvaient pas mettre à jour seuls.

| Override | Cible CVE | Raison / chaîne transitive | Condition de sortie |
|---|---|---|---|
| `@hono/node-server: >=1.19.13` | [GHSA-…](https://github.com/honojs/node-server) | Tiré par `prisma > @prisma/dev` qui pinne strict | Quand `@prisma/dev` bumpera sa version |
| `@xmldom/xmldom: >=0.9.10` | GHSA-2v35-w6hq-6mfw + 3 autres (XML injection / DoS) | Tiré par `nextra > better-react-mathjax > mathjax-full > speech-rule-engine` qui pinne `0.9.9`. `speech-rule-engine 5.x` (alpha/rc) embarque déjà la 0.9.10 | Mise à jour upstream de `speech-rule-engine` en stable 5.x |
| `fast-uri: >=3.1.2` | GHSA-q3j6-qgpj-74h6 + GHSA-v39h-62p7-jpjc | Tiré par `webpack > schema-utils > ajv` (build) et `prisma > @prisma/dev > @prisma/streams-local > ajv` | Bump des chaînes ajv |
| `fast-xml-builder: >=1.1.7` | GHSA-5wm8-gmm8-39j9 | Tiré par `fast-xml-parser` (bumpé 5.7.3 mais résout 1.1.6 sans override sur cette branche) | Bump effectif via `fast-xml-parser` |
| `hono: >=4.12.18` | 4 advisories (Cache leak, CSS injection, body limit bypass, JWT validation) | Override pour garantir l'alignement partout (`@ai-sdk/devtools`, `prisma > @prisma/dev`, etc.) | Une fois que tous les parents ont bumpé |
| `mermaid: >=11.15.0` | GHSA-6m6c-36f7-fhxh + 3 autres (DoS, CSS/HTML injection) | Tiré par `nextra > @theguild/remark-mermaid` qui autorise `^11.0.0` mais le lockfile résolvait toujours 11.14.0 | Refresh naturel après quelques campagnes |
| `postcss: >=8.5.10` | GHSA-qx2v-qp2m-jg93 (XSS via `</style>`) | Tiré par `next` et `@tailwindcss/postcss` | Bumpera naturellement |
| `uuid@>=11.0.0 <11.1.1: >=11.1.1` | GHSA-w5hq-g745-h8pq (buffer bounds check) | Tiré par `mermaid` (note : mermaid 11.15 loosens le range pour autoriser v14, donc l'override est précis sur la fenêtre vuln seulement) | Bump effectif de mermaid |
| `terser: <5.47.0` | **Aucune CVE** — c'est un plafond, pas un plancher | Posé le 2026-05-20 ([`77452bbb2`](https://github.com/DITP-pilotage/pilote-2/commit/77452bbb2), #2153) parce que `terser 5.47.1`, publiée 13 jours plus tôt, bloquait `pnpm deploy --prod` via `minimumReleaseAge: 20160`. C'est un **contournement temporaire de la quarantaine**, pas une décision technique sur terser. | **Échue depuis le 2026-05-21.** 5.47.1 est mûre (71 j), 5.48.0 aussi (56 j). Vérifié le 2026-07-17 : retirer l'override et forcer la re-résolution envoie terser en 5.48.0 sans rien casser. **À supprimer.** |

Historique supprimé lors de la campagne d'avril 2026 :

| Override supprimé | Raison d'origine | Pourquoi on peut s'en passer aujourd'hui |
|---|---|---|
| `lodash-es: 4.17.23` | Forcer une version "safe" face aux CVE proto pollution / code injection dans la chaîne `nextra → mermaid → chevrotain` | Les sous-deps résolvent maintenant `4.18.1` (safe) naturellement |
| `@tiptap/core, @tiptap/pm, @tiptap/extensions: 3.22.3` | Forcer la cohérence du bloc tiptap | Tous les `@tiptap/*` en deps directes sont pinnés à `3.22.3` → dedupe naturelle sans override |
| `@asamuzakjp/css-color → @csstools/css-tokenizer: ^4.0.0` | Workaround conflit de versions dans la chaîne jsdom/cssstyle de `isomorphic-dompurify@1.x` | Pas d'impact observé sans l'override ; à disparaître complètement quand on passera `isomorphic-dompurify` en v3 |

### Règles pour ajouter un override

1. **Documenter la raison ici** (CVE, bug upstream, conflit de résolution), avec un lien vers l'issue/CVE.
2. **Définir une condition de sortie** : quelle version upstream ou quel upgrade rend l'override inutile.
3. À **re-tester** à chaque campagne — voir la mise en garde ci-dessous sur le protocole.
4. **Borner les planchers.** Préférer `">=1.19.13 <2"` à `">=1.19.13"`.

### ⚠️ Un plancher non borné autorise les sauts de major

Un override `">=X"` ne dit pas « au moins X dans la branche courante » : il dit **« n'importe quoi ≥ X »**, major compris. Il **remplace** le range déclaré dans les apps, donc il les court-circuite.

Constaté le 2026-07-17 : `@hono/node-server` est passé de **1.19.14 à 2.0.8** lors d'un simple `pnpm update`, alors qu'aucune app ne déclare `^2`. C'est l'override `">=1.19.13"`, posé pour une CVE, qui a autorisé le major.

**Six des huit planchers actuels sont non bornés** et exposés au même effet : `@xmldom/xmldom`, `fast-uri`, `fast-xml-builder`, `hono`, `mermaid`, `@hono/node-server`. Seul `uuid@>=11.0.0 <11.1.1` est protégé — et c'est son *sélecteur* qui borne, pas sa valeur.

### ⚠️ `pnpm install` ne re-résout pas — les plafonds sont invisibles sans `pnpm update`

Retirer un override puis lancer `pnpm install` ne suffit pas à savoir s'il servait encore : pnpm **garde la version du lockfile** tant qu'elle satisfait les ranges des parents.

- **Planchers** (`">=X"`) : retirer l'override provoque une chute visible dès l'install. Le test naïf marche.
- **Plafonds** (`"<X"`) : la version en place satisfait toujours, **aucune montée ne se produit**, et l'override paraît inerte à tort.

Mesuré sur `terser` : retirer `"<5.47.0"` puis `pnpm install` laisse 5.46.2 (verdict « inerte », **faux**) ; ajouter `pnpm update terser -r --depth Infinity` l'envoie en 5.48.0 (verdict « porteur », **vrai**).

**Protocole correct** : retirer l'override → `pnpm install` → **`pnpm update <paquet> -r --depth Infinity`** → observer la résolution. C'est ce que fait `pnpm deps:campagne`.

## Campagne d'upgrade : procédure type

**Périmètre kpilote : la campagne est outillée.** `pnpm deps:campagne` (ou le skill `/deps-campagne`)
fait tout ce qui suit automatiquement — snapshot, branche, commits atomiques, oracle après chacun,
banc d'essai des 9 overrides, et un `report.json`. Compter ~40-60 min non surveillées. Voir
`docs/superpowers/specs/2026-07-17-campagne-deps-ia-design.md`. La procédure manuelle ci-dessous
reste la référence pour `pilote-ppg`, hors périmètre de l'outil.

1. `pnpm outdated` + `pnpm audit` → snapshot du point de départ.
2. **Lot 1 — sécu + patches** : `pnpm update` pour tous les bumps in-range, puis `pnpm audit --fix` (sans `--force`). Vérifier `pnpm audit` → 0 vulns idéalement.
3. **Lot 2 — majors low-risk** : dev deps principalement (lint plugins, test utils, type-only). PR séparée.
4. **Lot 3+ — majors breaking** : un package (ou un groupe couplé) par PR. Toujours lancer `pnpm lint` + `pnpm test` + `pnpm test:e2e` sur chaque.
5. **Vérifier les overrides** : retirer l'override → `pnpm install` → **`pnpm update <paquet> -r --depth Infinity`** → observer la résolution. **Ne pas se contenter de `pnpm install`** : il ne re-résout pas, et masque tout plafond (voir la mise en garde plus haut). Si le paquet se résout de lui-même dans le range de l'override → supprimer.
6. **Mettre à jour ce document** avec les nouvelles décisions.

### Attention : `tsc --noEmit` est le meilleur oracle, pas les tests

Sur un codebase TypeScript, c'est `tsc` qui attrape la majorité des breaking changes d'un upgrade (signature changée, export retiré, type modifié). Les tests ne couvrent que les chemins écrits. `kpilote-admin` n'a **aucun test** : pour cette app, `tsc` est le seul filet.

Illustration du 2026-07-17 : le seul lot in-range (aucun major) a produit **138 erreurs tsc sur kpilote-api et 21 sur kpilote-admin** — `.openapi()` disparu de zod, suite au bump `zod 4.3.6 → 4.4.3` et/ou `@hono/zod-openapi 1.3.0 → 1.4.0`. Un `pnpm update` mergé sans passer `tsc` aurait cassé l'API.

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

### Mai 2026 — Campagne sécu

**Bumps directs** :
- `apps/pilote-ppg` : `axios ^1.12.2 → ^1.15.2`, `fast-xml-parser 5.5.9 → 5.7.3`, `@ai-sdk/devtools ^0.0.15 → ^0.0.18`, `next ^16.2.1 → ^16.2.6`
- `apps/kpilote-api` : `hono ^4.6.14 → ^4.12.18`, `@hono/node-server ^1.13.7 → ^1.19.13`
- `apps/kpilote-webapp` : `hono ^4.6.14 → ^4.12.18`, `@hono/node-server ^1.13.7 → ^1.19.13`

**Ajout d'overrides** au `package.json` racine pour les transitives profondes que `pnpm update` ne pouvait pas bumper (parents qui pinnent strict ou lockfile bloqué) : `@hono/node-server`, `@xmldom/xmldom`, `fast-uri`, `fast-xml-builder`, `hono`, `mermaid`, `postcss`, `uuid` (sur la fenêtre vuln uniquement). Voir la section "Overrides" pour le détail et les conditions de sortie.

**Résiduel** : 1 advisory non corrigeable côté lockfile (pas de version patchée disponible upstream à ce jour). Suivi hors-doc (cf. canal sécurité interne).

**Vérifications** : `pnpm lint` ✅ sur `pilote-ppg`, `kpilote-api` et `kpilote-webapp`.

**Autre** : déplacement de `DEPENDENCIES.md` vers la racine du monorepo (auparavant dans `apps/pilote-ppg/`).

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
