# Gestion des dépendances

Ce document centralise les décisions prises autour des dépendances : pins, overrides, packages à surveiller, et procédure pour une campagne d'upgrade. À maintenir à chaque itération.

Le monorepo contient **6 apps** (le doc en annonçait 3 jusqu'au 2026-07-17 ; l'app oubliée, `pilote-ppg-auth`, est précisément celle qui portait un `hono` vulnérable non détecté) :
- `@pilote/ppg` (`apps/pilote-ppg`) : app Next.js historique (PILOTE)
- `@pilote/kpilote-api` (`apps/kpilote-api`) : backend Hono (kpilote)
- `@pilote/kpilote-webapp` (`apps/kpilote-webapp`) : webapp (kpilote)
- `@pilote/kpilote-admin` (`apps/kpilote-admin`) : back-office (kpilote) — **aucun test**
- `pilote-ppg-auth` (`apps/pilote-ppg-auth`) : proxy auth/ACME — **hors périmètre de `pnpm deps:campagne`**
- `apps/pilote-ppg-data-management` : modèles dbt (SQL, pas de deps npm)

Plus les packages partagés `packages/kpilote-shared` et `packages/kpilote-ui`.

> **`pilote-ppg-auth` n'est bumpé par personne.** Il est hors du filtre kpilote de l'outil de campagne, et personne ne le met à jour à la main. C'est ainsi qu'il s'est retrouvé sur `hono@4.12.18` (9 advisories, dont une HIGH) pendant que les apps kpilote flottaient jusqu'à 4.12.27. À traiter.

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

**Verdicts du 2026-07-17**, établis mécaniquement par `pnpm deps:campagne` (retrait de l'override → install → **re-résolution forcée** → observation) puis croisés avec les conditions de sortie. *Porteur* = le retirer change la résolution. *Inerte* = il ne retient plus rien.

| Override | Verdict | Cible CVE | Condition de sortie (corrigée) | Action |
|---|---|---|---|---|
| `@hono/node-server: >=1.19.13` | **PORTEUR** — se résout en 1.19.11 sans lui | GHSA-92pp-h63x-v22m (bypass middleware, `<1.19.13`) — **réelle** | ~~« Quand `@prisma/dev` bumpera »~~ **visait le mauvais paquet.** `@prisma/dev@0.24.14` a *supprimé* la dep — mais `prisma@7.8.0` le pinne à `0.24.3` exact. Vraie condition : **quand `prisma` relèvera son pin `@prisma/dev`** (probablement 7.9.0). | **CIBLER** `"@prisma/dev>@hono/node-server": ">=1.19.13 <2"`. Ne **jamais** poser `<2` en global : les 3 apps kpilote sont en `^2.0.8` depuis `8c1d0b548`. |
| `@xmldom/xmldom: >=0.9.10` | **PORTEUR** — 0.9.9 sans lui | 4× **HIGH** (GHSA-2v35-w6hq-6mfw, -f6ww-3ggp-fr8h, -x6wf-f3px-wcqx, -j759-j44w-7fr8) — **réelles** | ~~« stable 5.x de `speech-rule-engine` »~~ **incomplète.** `mathjax-full@3.2.2` déclare `^4.0.6` : même une 5.0.0 stable ne serait pas prise. Vraie condition : **stable 5.x de speech-rule-engine ET bump de `mathjax-full`.** (`latest` = `5.0.0-rc.4`) | **GARDER**, borner `">=0.9.10 <0.10"` |
| `postcss: >=8.5.10` | **PORTEUR** — 8.4.31 sans lui | GHSA-qx2v-qp2m-jg93 — **réelle** | ~~« Bumpera naturellement »~~ **structurellement impossible** : `next@16.2.6` **pinne** `postcss: 8.4.31` (exact, pas un caret). Vraie condition : **quand `next` relèvera son pin** — à retester par `npm view next@<v> dependencies.postcss`. | **GARDER**, borner `">=8.5.10 <9"` |
| `terser: <5.47.0` | **PORTEUR** — 5.48.0 sans lui | **Aucune CVE**, sur aucune version — c'est un **plafond**, pas un plancher | **Échue depuis le 2026-05-21.** Contournement de quarantaine posé le 2026-05-20 ([`77452bbb2`](https://github.com/DITP-pilotage/pilote-2/commit/77452bbb2), #2153) : terser 5.47.1 avait 13 j et bloquait `pnpm deploy --prod` via `minimumReleaseAge`. Sa condition de sortie était « demain ». | **SUPPRIMER.** 5.48.0 a 57 j (quarantaine passée), `vite` peer `^5.16.0` satisfait, devDeps only. |
| `hono: >=4.12.18` | inerte — 4.12.27 sans lui | **9 advisories** dont une **HIGH** (GHSA-88fw-hqm2-52qc, CORS wildcard + credentials). Le doc annonçait « 4 ». Correctifs en 4.12.21 et **4.12.25**. | ~~« quand tous les parents auront bumpé »~~ **non remplie** — et le plancher est **sous** le plancher réel des advisories. | **RELEVER** `">=4.12.25 <5"`. `pilote-ppg-auth` tourne **aujourd'hui** en 4.12.18. |
| `fast-uri: >=3.1.2` | inerte — 3.1.3 sans lui | Aucune advisory sur 3.1.3 **ni** 4.1.0 | ~~« bump des chaînes ajv »~~ **jamais remplie** (ajv n'a pas bougé, `^3.0.1` en `latest`). Le correctif est venu du **backport 3.x de fast-uri**, pas d'ajv. | **SUPPRIMER** — il force 4.1.0 hors du range d'ajv, sans bénéfice. Voir « un override inerte n'est pas inoffensif ». |
| `fast-xml-builder: >=1.1.7` | inerte — 1.2.1 sans lui | GHSA-5wm8-gmm8-39j9 | **Remplie.** `fast-xml-parser@5.7.3` (pinné exact) déclare déjà `^1.1.7` → l'override est redondant tant que le pin tient. | **SUPPRIMER** |
| `mermaid: >=11.15.0` | inerte — 11.16.0 sans lui | GHSA-6m6c-36f7-fhxh + 3 autres | **Remplie** (refresh naturel). | **SUPPRIMER** (ou borner `"<12"`) |
| `uuid@>=11.0.0 <11.1.1: >=11.1.1` | inerte — se résout en **14.0.1** et 8.3.2, aucune version dans le sélecteur | GHSA-w5hq-g745-h8pq | **Remplie.** Le doc anticipait « mermaid loosens le range pour autoriser v14 » — **c'est arrivé**. Plus rien ne traverse la fenêtre `[11.0.0, 11.1.1)`. | **SUPPRIMER** |

> ⚠️ **`pnpm audit` remonte `uuid@8.3.2`** (via `@hookform/devtools`, devDep) sur GHSA-w5hq-g745-h8pq, dont le range est `<11.1.1` — donc 8.3.2 matche. Le sélecteur `uuid@>=11.0.0 <11.1.1` ne le couvre pas. Dev-only, mais une affirmation « 0 vuln » serait fausse.

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

### 🔴 Un plancher non borné fabrique des majors — et les blanchit dans les manifestes

Un override `">=X"` ne dit pas « au moins X dans la branche courante » : il dit **« n'importe quoi ≥ X »**, major compris. Il **remplace** le range déclaré dans les apps, donc il les court-circuite.

Constaté le 2026-07-17, et le mécanisme est vicieux :

1. L'override `"@hono/node-server": ">=1.19.13"` (posé pour une CVE) autorise n'importe quel `>=1.19.13`.
2. `pnpm update` résout donc **2.0.8** — un major — alors qu'aucune app ne déclarait `^2`.
3. L'outillage de campagne réécrit ensuite la version résolue comme nouveau caret : **`"^2.0.8"` est écrit dans trois `package.json`**, par un commit étiqueté « bumps in-range ».

**L'override a fabriqué le major, et la campagne l'a blanchi dans les manifestes.** C'est le commit `8c1d0b548`. Une version antérieure de cette mise en garde affirmait « aucune app ne déclare `^2` » — c'était vrai à l'écriture, faux une heure plus tard, à cause du commit qui l'avait inspirée.

**Conséquence : on ne peut plus poser `<2` en global** — ça downgraderait les trois apps kpilote qui sont maintenant en `^2.0.8`. Il faut un **override ciblé sur le parent fautif** :

```json
"@prisma/dev>@hono/node-server": ">=1.19.13 <2"
```

**Six des huit planchers sont non bornés** : `@xmldom/xmldom`, `fast-uri`, `fast-xml-builder`, `hono`, `mermaid`, `@hono/node-server`. Seul `uuid@>=11.0.0 <11.1.1` est protégé — et c'est son *sélecteur* qui borne, pas sa valeur.

### 🔴 Un override inerte n'est pas forcément inoffensif

`fast-uri: ">=3.1.2"` est **inerte** au sens du banc d'essai (sans lui, la résolution reste conforme). Mais il n'est pas neutre pour autant : il force **4.1.0** là où `ajv@8.20.0` — le `latest` — déclare `"fast-uri": "^3.0.1"`. L'override injecte donc un **major hors du range validé par ajv**, sans aucun bénéfice sécurité (aucune advisory sur 3.1.3 ni sur 4.1.0). `fast-uri` maintient d'ailleurs une ligne 3.x exprès (dist-tag `three: 3.1.3`).

La leçon : « inerte » répond à *« puis-je le retirer sans risque ? »*, pas à *« fait-il quelque chose de nuisible ? »*. Les deux questions méritent d'être posées.

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

### 🔴 `pnpm outdated` ne voit pas les `peerDependencies` — et zod estampille sa version dans ses types

**Le mode d'échec le plus coûteux trouvé le 2026-07-17**, et il se reproduira à chaque campagne tant qu'il n'est pas outillé.

`packages/kpilote-shared` déclare `zod` en **`peerDependencies`**. `pnpm outdated` ne remonte **pas** les peers, donc la campagne ne l'a jamais vu : elle a bumpé zod en `^4.4.3` dans les 3 apps et laissé shared en `^4.3.6`.

Deux zod physiques coexistent alors dans le même programme `tsc` — et `kpilote-shared` exporte du **TS source brut** (`"types": "./src/*.ts"`), donc le `tsc` des apps compile ses sources, dont l'`import { z } from 'zod'` résout en 4.3.6.

**Or zod estampille ses schémas avec sa propre version, en type littéral :**

```ts
interface _$ZodTypeInternals { version: typeof version }
// 4.3.6 -> { major: 4; minor: 3; patch: number }
// 4.4.3 -> { major: 4; minor: 4; patch: number }
```

`minor` est un **littéral** : tout schéma 4.3.6 devient structurellement non-assignable aux types 4.4.3. `patch` est un `number`, donc les patches passent — **les minors, non**. Résultat : **138 erreurs sur `kpilote-api`, 21 sur `kpilote-admin`**, dont le fameux `Property 'openapi' does not exist`. `.openapi()` fonctionne très bien : ce sont les schémas importés de shared qui ne l'ont pas.

**Invariant à tenir : un seul minor de zod par programme `tsc`.** Concrètement, toute dep en `peerDependencies` d'un package workspace qui exporte du TS source doit être bumpée **en même temps** que les apps qui la consomment.

**Ne pas** poser d'override zod global : `apps/pilote-ppg` est en zod `^3.21.4`, un override racine le casserait. Si override il faut, le scoper : `"@pilote/kpilote-shared>zod"`.

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

> **Ce tableau a dérivé.** Trois de ses lignes ont été démenties par la campagne du 2026-07-17, qui les a mesurées au lieu de les estimer. Une ligne « à surveiller » que personne ne réévalue devient une superstition — c'est exactement ce que `pnpm deps:campagne` sert à éviter. Les verdicts mesurés sont notés en regard.

| Package | Verdict mesuré le 2026-07-17 |
|---|---|
| `eslint` 9 → 10 | ✅ **Passe.** Coût réel : **1 erreur, 1 ligne** (`no-useless-assignment` sur `kpilote-webapp/src/auth.ts:90`, un vrai positif). Baseline vs ESLint 9 : 287 fichiers lintés, 0 message nouveau ailleurs. Tous les plugins autorisent `^10` (`react-hooks@7.1.1` explicitement). Le blocage `eslint-plugin-react` **ne concerne que ppg**, qui reste en 9 — les deux majors cohabitent sans conflit. |
| `typescript` 5.9 → 6 | ✅ **Ne casse aucun code.** Avec `--ignoreDeprecations 6.0`, les compteurs d'erreurs sont *identiques* (24 / 4 / 138). Seul coût : `baseUrl` est déprécié (TS5101) sur admin et webapp → le retirer et préfixer les paths en `./src/*`. **`kpilote-api` fait déjà ça** — le pattern est validé dans le repo. |
| `dotenv` 16 → 17 | ✅ **Parsing identique**, vérifié en exécutant les deux versions sur les 5 `.env` réels. Un seul BC : `quiet` passe à `false` → log `◇ injected env (N)` sur **stdout** à chaque boot, y compris sans `.env`, y compris en prod. Pollue le flux JSON de pino. Fix : `quiet: true` / `DOTENV_CONFIG_QUIET=true`. |
| `prisma` 6 → 7 | ⚠️ La ligne dit « à faire ». **`kpilote-api` est déjà en 7.8.0.** Seul `ppg` reste en 6.2.1. |
| `zod` 3 → 4 | ⚠️ La ligne vise ppg. Les apps kpilote sont en zod 4 depuis longtemps. |

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

### Juillet 2026 (2026-07-27) — Campagne sécu

Menée **commit par commit** sur `deps/campagne-2026-07-27`, ciblée vulnérabilités (`pnpm audit`).
**73 → 14 advisories** : **4 → 0 critical**, **33 → 6 high**.

Contrainte structurante : `minimumReleaseAge: 20160` (14 j). Toute version patchée publiée
**après le 2026-07-13** est refusée à l'install (sauf `next`/`@next/*`, exclus). Chaque patch a
donc été vérifié contre cette fenêtre avant bump.

**Bumps directs `pilote-ppg`** :
- `axios ^1.15.2 → ^1.18.0`, `form-data ^4.0.0 → ^4.0.6`, `next ^16.2.6 → ^16.2.11` (résolu 16.2.12) — couverts par caret
- `sharp ^0.34.5 → ^0.35.0` (+ override, voir ci-dessous)
- `ws 8.18.0 → 8.21.0`
- `next-auth 5.0.0-beta.30 → 5.0.0-beta.32` — **one-shot quarantaine** (voir encadré)

**Bump direct `kpilote-webapp`** : `dompurify ^3.4.11 → ^3.4.12`.

**Overrides ajoutés / relevés** (root, bornés par ligne majeure pour ne pas collapser les consommateurs) :

| Override | Cible CVE |
|---|---|
| `sharp: >=0.35.0 <0.36` | force aussi la sharp transitive de `next` (CVE libvips) |
| `postcss: >=8.5.10 → >=8.5.18 <9` | path traversal source-map (relevé) |
| `brace-expansion@<2: >=1.1.16`, `@>=2 <3: >=2.1.2`, `@>=5 <6: >=5.0.7` | DoS expansion exponentielle |
| `undici@>=7 <8: >=7.28.0` | TLS bypass, DoS websocket, SOCKS5 routing |
| `linkify-it@>=5 <6: >=5.0.2` | ReDoS quadratique |
| `immutable@>=4 <5: >=4.3.9` | trie overflow + hash-collision DoS (ligne 4.x) |
| `js-yaml@<4: >=3.15.0`, `@>=4 <5: >=4.3.0` | merge-key CPU quadratique |
| `tar@>=7 <8: >=7.5.19` | **critical** : negative-size infinite loop + decompression DoS |
| `fast-uri@>=3 <4: >=3.1.3` | host confusion IDN (borné `<4` = range ajv, cf. mise en garde) |

**Résiduels assumés** (6 high + 6 moderate + 2 low) :
- `xlsx` (2 high, webapp) — **aucun patch npm** (SheetJS hors registre). Décision séparée : pin CDN ou remplacement.
- `immutable 3.8.3` (2 high, ppg) — ligne 3.x **sans patch**, tirée par `swagger-ui-react` via `react-immutable-proptypes@2.2.0` (peer immutable 3.x). Forcer 4.x casse swagger-ui-react. **Sortie** : swagger-ui-react lâche immutable 3.x.
- `fast-uri 3.1.4` (1 high, admin) — **bloqué quarantaine** (publié 2026-07-19). Relever `fast-uri@>=3 <4` à `>=3.1.4` après le ~2026-08-02.
- `brace-expansion 5.0.8` (1 high, **dev-only** via eslint→minimatch) — **bloqué quarantaine** (2026-07-23). Relever `@>=5 <6` à `>=5.0.8` après le ~2026-08-06.

> 🔴 **One-shot quarantaine `next-auth`.** beta.32 (+ `@auth/core@0.41.3`, épinglé par beta.32) ferme
> **3 critical + 2 high** Auth.js mais a `<14 j` (publié 2026-07-20). Installé en ajoutant
> temporairement `next-auth` + `@auth/core` à `minimumReleaseAgeExclude`, puis en **retirant**
> l'exclusion (`pnpm-workspace.yaml` net-inchangé). Le lock épingle beta.32 ; `pnpm install` et
> `--frozen-lockfile` (CI) le réutilisent **sans re-résoudre**. **Fenêtre fragile ~7 j** : ne pas
> lancer `pnpm update next-auth` ni supprimer le lock avant le ~**2026-08-03** — le pin exact
> beta.32 est non résoluble sous quarantaine et sans fallback. Après cette date, beta.32 franchit
> elle-même les 14 j et la fenêtre se referme.

**Vérifications** : `tsc --noEmit` **vert (0 erreur) sur ppg, kpilote-api, kpilote-webapp, kpilote-admin**.
E2E non lancés (cron). Lockfile partagé avec ppg → la CI ppg tourne aussi sur la PR.

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
