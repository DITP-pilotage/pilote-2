# Campagne d'upgrade des dépendances assistée par IA — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fournir `/deps-campagne`, une commande qui produit une branche + une PR détaillant l'état complet des upgrades de dépendances kpilote, avec analyse IA des breaking changes là où `tsc` est aveugle, et verdict prouvé sur les 9 overrides.

**Architecture :** Deux objets. Un moteur déterministe Node (`scripts/deps-campagne/`) qui fait toute la mécanique — snapshot, commits atomiques, oracle, banc d'essai des overrides — et produit un `report.json` compact. Un skill Claude Code (`.claude/skills/deps-campagne/`) qui lit ce rapport, dispatche un subagent par major, et rédige la PR. Le moteur ne contient aucune IA ; le skill ne contient aucune mécanique.

**Tech Stack :** Node 24 ESM (`.mjs`), `node --test` (runner intégré, zéro config), `semver`, `pnpm 10`, `gh` CLI.

**Spec :** `docs/superpowers/specs/2026-07-17-campagne-deps-ia-design.md`

## Global Constraints

- **Périmètre des bumps : `kpilote-*` uniquement.** Filtres pnpm : `--filter '@pilote/kpilote-api' --filter '@pilote/kpilote-webapp' --filter '@pilote/kpilote-admin' --filter '@pilote/kpilote-ui'`. `pilote-ppg` n'est jamais bumpé.
- **Banc d'essai des overrides : les 9, monorepo-wide.** Ils vivent dans le `package.json` racine et s'appliquent partout.
- **Le moteur ne modifie jamais de code applicatif.** Il touche : `package.json` (deps + overrides), `pnpm-lock.yaml`, `DEPENDENCIES.md`. Rien d'autre.
- **Ne jamais retirer ou baisser un bump pour faire passer les tests.** Un commit rouge reste rouge.
- **Ne jamais toucher aux conteneurs Docker.** Vérifier, demander à l'utilisateur si la base est absente.
- **Ne jamais pousser sur `dev`, ne jamais auto-merger.** Branche `deps/campagne-YYYY-MM-DD`.
- **`pnpm outdated` sort en exit code 1** quand des deps sont périmées. Ce n'est pas une erreur.
- **Ne jamais utiliser le champ `wanted`** de `pnpm outdated` : il rapporte `current` même quand le range autorise mieux (vérifié sur `react ^19.2.5`, latest 19.2.7 mûre depuis 45 j, `wanted` annonce quand même 19.2.5).
- **`latest` respecte déjà `minimumReleaseAge`** — aucune quarantaine à réimplémenter.
- **Nommage** : verbes et termes techniques en anglais, entités métier en français (convention kpilote).
- **Pas de `Co-Authored-By`** dans les commits.

## File Structure

```
scripts/deps-campagne/
  run.mjs                 orchestration ; seul fichier qui shell-out et écrit sur le disque
  lib/outdated.mjs        parsing pnpm outdated + catégorisation + groupes couplés   [PUR]
  lib/outdated.test.mjs
  lib/overrides.mjs       lecture des overrides + verdict porteur/inerte             [PUR]
  lib/overrides.test.mjs
  lib/report.mjs          construction du report.json                                [PUR]
  lib/report.test.mjs
  lib/shell.mjs           wrappers d'exécution                                       [mince]
  lib/oracle.mjs          oracle rapide (tsc) et complet (lint+test+audit)

.claude/skills/deps-campagne/
  SKILL.md                le skill
```

Les quatre fichiers `[PUR]` ne font aucune I/O : ils prennent des données, rendent des données. C'est là que vivent les tests. `run.mjs`, `shell.mjs` et `oracle.mjs` sont l'enveloppe impure, volontairement mince.

---

### Task 1 : Fondation — `semver` et catégorisation des bumps

**Files:**
- Modify: `package.json` (racine, ajouter `devDependencies`)
- Create: `scripts/deps-campagne/lib/outdated.mjs`
- Test: `scripts/deps-campagne/lib/outdated.test.mjs`

**Interfaces:**
- Consumes: rien (première tâche)
- Produces:
  - `parseOutdated(raw: object): Dep[]` où `Dep = { name: string, current: string, latest: string, isMajor: boolean, dependents: string[] }`
  - `grouperCouples(deps: Dep[]): Groupe[]` où `Groupe = { nom: string, deps: Dep[] }`

- [ ] **Step 1 : Créer la branche de travail, puis ajouter `semver`**

On part de `dev`, qui est la branche par défaut : il faut brancher **avant** le premier commit.

```bash
cd /Users/jordantaillefer/Documents/Missions/Projets/pilote-2
git checkout -b feat/deps-campagne
pnpm add -w -D semver
```

Le `package.json` racine n'a aujourd'hui aucun bloc de dépendances — `pnpm add -w -D` en crée un.

Vérifier que le bloc apparaît bien dans le `package.json` racine et que `pnpm-lock.yaml` est mis à jour.

> Attention : ne pas confondre cette branche de développement `feat/deps-campagne` (qui porte
> l'outil) avec les branches `deps/campagne-YYYY-MM-DD` que l'outil produira une fois en service.

- [ ] **Step 2 : Écrire le test qui échoue**

Créer `scripts/deps-campagne/lib/outdated.test.mjs`. La fixture reproduit la vraie structure de `pnpm outdated --format json`, vérifiée le 2026-07-17.

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseOutdated, grouperCouples } from './outdated.mjs'

const FIXTURE = {
  react: {
    current: '19.2.5',
    latest: '19.2.7',
    wanted: '19.2.5',
    isDeprecated: false,
    dependencyType: 'dependencies',
    dependentPackages: [{ name: '@pilote/kpilote-webapp', location: '/x' }],
  },
  typescript: {
    current: '5.9.3',
    latest: '6.0.3',
    wanted: '5.9.3',
    isDeprecated: false,
    dependencyType: 'devDependencies',
    dependentPackages: [{ name: '@pilote/kpilote-api', location: '/y' }],
  },
  '@tiptap/core': {
    current: '3.22.3',
    latest: '3.27.1',
    wanted: '3.22.3',
    isDeprecated: false,
    dependencyType: 'dependencies',
    dependentPackages: [{ name: '@pilote/kpilote-webapp', location: '/x' }],
  },
  '@tiptap/react': {
    current: '3.22.3',
    latest: '3.27.1',
    wanted: '3.22.3',
    isDeprecated: false,
    dependencyType: 'dependencies',
    dependentPackages: [{ name: '@pilote/kpilote-webapp', location: '/x' }],
  },
  eslint: {
    current: '9.39.4',
    latest: '10.6.0',
    wanted: '9.39.4',
    isDeprecated: false,
    dependencyType: 'devDependencies',
    dependentPackages: [{ name: '@pilote/kpilote-api', location: '/y' }],
  },
  '@eslint/js': {
    current: '9.39.4',
    latest: '10.0.1',
    wanted: '9.39.4',
    isDeprecated: false,
    dependencyType: 'devDependencies',
    dependentPackages: [{ name: '@pilote/kpilote-api', location: '/y' }],
  },
}

test('parseOutdated marque les majors en comparant current et latest', () => {
  const deps = parseOutdated(FIXTURE)
  const parNom = Object.fromEntries(deps.map((d) => [d.name, d]))

  assert.equal(parNom['typescript'].isMajor, true, '5.9.3 -> 6.0.3 est un major')
  assert.equal(parNom['eslint'].isMajor, true, '9.39.4 -> 10.6.0 est un major')
  assert.equal(parNom['react'].isMajor, false, '19.2.5 -> 19.2.7 est un patch')
  assert.equal(parNom['@tiptap/core'].isMajor, false, '3.22.3 -> 3.27.1 est un minor')
})

test('parseOutdated expose les dependents à plat', () => {
  const deps = parseOutdated(FIXTURE)
  const react = deps.find((d) => d.name === 'react')
  assert.deepEqual(react.dependents, ['@pilote/kpilote-webapp'])
})

test('parseOutdated ignore une entrée sans current exploitable', () => {
  const deps = parseOutdated({ bidon: { latest: '2.0.0', dependentPackages: [] } })
  assert.deepEqual(deps, [])
})

test('grouperCouples réunit tout le bloc @tiptap/* sous un seul groupe', () => {
  const groupes = grouperCouples(parseOutdated(FIXTURE))
  const tiptap = groupes.find((g) => g.nom === 'tiptap')

  assert.ok(tiptap, 'un groupe tiptap doit exister')
  assert.deepEqual(
    tiptap.deps.map((d) => d.name).sort(),
    ['@tiptap/core', '@tiptap/react'],
  )
})

test('grouperCouples réunit eslint et @eslint/js', () => {
  const groupes = grouperCouples(parseOutdated(FIXTURE))
  const eslint = groupes.find((g) => g.nom === 'eslint')

  assert.ok(eslint, 'un groupe eslint doit exister')
  assert.deepEqual(eslint.deps.map((d) => d.name).sort(), ['@eslint/js', 'eslint'])
})

test('grouperCouples laisse les paquets non couplés seuls dans leur groupe', () => {
  const groupes = grouperCouples(parseOutdated(FIXTURE))
  const ts = groupes.find((g) => g.nom === 'typescript')

  assert.ok(ts)
  assert.equal(ts.deps.length, 1)
})
```

- [ ] **Step 3 : Lancer le test pour vérifier qu'il échoue**

Run: `node --test scripts/deps-campagne/lib/outdated.test.mjs`
Expected: FAIL — `Cannot find module './outdated.mjs'`

- [ ] **Step 4 : Écrire l'implémentation minimale**

Créer `scripts/deps-campagne/lib/outdated.mjs`.

```js
import semver from 'semver'

/**
 * Paquets qui doivent impérativement bouger d'un seul tenant.
 * - @tiptap/* : versions désalignées => plusieurs instances de @tiptap/core au runtime => éditeur cassé.
 * - eslint / @eslint/js : le plugin suit le major du core.
 */
const GROUPES_COUPLES = [
  { nom: 'tiptap', concerne: (name) => name.startsWith('@tiptap/') },
  { nom: 'eslint', concerne: (name) => name === 'eslint' || name === '@eslint/js' },
]

/**
 * Transforme la sortie de `pnpm outdated --format json` en liste plate.
 * Ne JAMAIS lire `info.wanted` : il rapporte `current` même quand le range autorise mieux.
 */
export function parseOutdated(raw) {
  return Object.entries(raw)
    .map(([name, info]) => {
      const current = semver.coerce(info.current)
      const latest = semver.coerce(info.latest)
      if (!current || !latest) return null
      return {
        name,
        current: info.current,
        latest: info.latest,
        isMajor: semver.major(latest) !== semver.major(current),
        dependents: (info.dependentPackages ?? []).map((p) => p.name),
      }
    })
    .filter((dep) => dep !== null)
}

/** Regroupe les paquets couplés ; les autres forment un groupe d'un seul élément. */
export function grouperCouples(deps) {
  const groupes = new Map()

  for (const dep of deps) {
    const couple = GROUPES_COUPLES.find((g) => g.concerne(dep.name))
    const nom = couple ? couple.nom : dep.name
    if (!groupes.has(nom)) groupes.set(nom, { nom, deps: [] })
    groupes.get(nom).deps.push(dep)
  }

  return [...groupes.values()]
}
```

- [ ] **Step 5 : Lancer le test pour vérifier qu'il passe**

Run: `node --test scripts/deps-campagne/lib/outdated.test.mjs`
Expected: PASS — 6 tests

- [ ] **Step 6 : Commit**

```bash
git add package.json pnpm-lock.yaml scripts/deps-campagne/lib/outdated.mjs scripts/deps-campagne/lib/outdated.test.mjs
git commit -m "feat(deps-campagne): parsing et catégorisation des bumps depuis pnpm outdated"
```

---

### Task 2 : Verdict des overrides

**Files:**
- Create: `scripts/deps-campagne/lib/overrides.mjs`
- Test: `scripts/deps-campagne/lib/overrides.test.mjs`

**Interfaces:**
- Consumes: `semver` (Task 1)
- Produces:
  - `nomPaquetDepuisCle(cle: string): string` — extrait le nom du paquet d'une clé d'override pnpm
  - `verdictOverride({ cle, range, versionsResolues }): Verdict` où `Verdict = { cle, nom, range, versionsResolues, porteur: boolean, preuve: string }`

Le cœur du banc d'essai. `porteur: true` = l'override retient activement quelque chose, on ne peut pas le supprimer. `porteur: false` = inerte, supprimable avec preuve.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `scripts/deps-campagne/lib/overrides.test.mjs`. Les cas viennent des 9 overrides réels du `package.json` racine.

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nomPaquetDepuisCle, verdictOverride } from './overrides.mjs'

test('nomPaquetDepuisCle gère un nom simple', () => {
  assert.equal(nomPaquetDepuisCle('hono'), 'hono')
})

test('nomPaquetDepuisCle gère un paquet scopé', () => {
  assert.equal(nomPaquetDepuisCle('@hono/node-server'), '@hono/node-server')
})

test('nomPaquetDepuisCle gère un sélecteur versionné', () => {
  assert.equal(nomPaquetDepuisCle('uuid@>=11.0.0 <11.1.1'), 'uuid')
})

test('nomPaquetDepuisCle gère un sélecteur versionné sur un paquet scopé', () => {
  assert.equal(nomPaquetDepuisCle('@types/node@>=20'), '@types/node')
})

test('un plancher déjà satisfait naturellement est inerte', () => {
  // hono: ">=4.12.18" — sans override, pnpm résout 4.12.27 tout seul.
  const v = verdictOverride({
    cle: 'hono',
    range: '>=4.12.18',
    versionsResolues: ['4.12.27'],
  })

  assert.equal(v.porteur, false)
  assert.match(v.preuve, /déjà conforme/)
})

test('un plancher non satisfait est porteur', () => {
  // @xmldom/xmldom: ">=0.9.10" — la chaîne speech-rule-engine pinne 0.9.9.
  const v = verdictOverride({
    cle: '@xmldom/xmldom',
    range: '>=0.9.10',
    versionsResolues: ['0.9.9'],
  })

  assert.equal(v.porteur, true)
  assert.match(v.preuve, /0\.9\.9/)
})

test('un PLAFOND dépassé est porteur — cas terser', () => {
  // terser: "<5.47.0" — le seul plafond des 9, et le seul non documenté.
  const v = verdictOverride({
    cle: 'terser',
    range: '<5.47.0',
    versionsResolues: ['5.47.1'],
  })

  assert.equal(v.porteur, true, 'un plafond franchi retient activement quelque chose')
})

test('un plafond non atteint est inerte', () => {
  const v = verdictOverride({
    cle: 'terser',
    range: '<5.47.0',
    versionsResolues: ['5.46.2'],
  })

  assert.equal(v.porteur, false)
})

test('une seule version hors range parmi plusieurs suffit à rendre porteur', () => {
  const v = verdictOverride({
    cle: 'postcss',
    range: '>=8.5.10',
    versionsResolues: ['8.5.11', '8.4.2', '8.5.10'],
  })

  assert.equal(v.porteur, true)
  assert.match(v.preuve, /8\.4\.2/)
})

test('aucune version résolue = paquet disparu de l arbre, donc inerte', () => {
  const v = verdictOverride({
    cle: 'mermaid',
    range: '>=11.15.0',
    versionsResolues: [],
  })

  assert.equal(v.porteur, false)
  assert.match(v.preuve, /absent de l'arbre/)
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `node --test scripts/deps-campagne/lib/overrides.test.mjs`
Expected: FAIL — `Cannot find module './overrides.mjs'`

- [ ] **Step 3 : Écrire l'implémentation minimale**

Créer `scripts/deps-campagne/lib/overrides.mjs`.

```js
import semver from 'semver'

/**
 * Extrait le nom du paquet d'une clé d'override pnpm.
 * Les clés peuvent embarquer un sélecteur de version : "uuid@>=11.0.0 <11.1.1" -> "uuid".
 * Le @ initial d'un scope ne compte pas comme séparateur.
 */
export function nomPaquetDepuisCle(cle) {
  const scope = cle.startsWith('@')
  const reste = scope ? cle.slice(1) : cle
  const separateur = reste.indexOf('@')
  if (separateur === -1) return cle
  return (scope ? '@' : '') + reste.slice(0, separateur)
}

/**
 * Un override est PORTEUR si, sans lui, au moins une version résolue tombe hors de son range.
 * Il est INERTE si tout se résout déjà dans le range — il ne sert alors plus à rien.
 *
 * Marche pour les planchers (">=X", le cas des 8 overrides CVE) comme pour les plafonds
 * ("<X", le cas de terser), parce que semver.satisfies ne présume pas du sens du range.
 */
export function verdictOverride({ cle, range, versionsResolues }) {
  const nom = nomPaquetDepuisCle(cle)

  if (versionsResolues.length === 0) {
    return {
      cle,
      nom,
      range,
      versionsResolues,
      porteur: false,
      preuve: `${nom} est absent de l'arbre de dépendances sans l'override — plus rien ne le tire`,
    }
  }

  const horsRange = versionsResolues.filter((version) => !semver.satisfies(version, range))

  return {
    cle,
    nom,
    range,
    versionsResolues,
    porteur: horsRange.length > 0,
    preuve:
      horsRange.length > 0
        ? `sans l'override, ${nom} se résout en ${horsRange.join(', ')} — hors de "${range}"`
        : `sans l'override, ${nom} se résout en ${versionsResolues.join(', ')} — déjà conforme à "${range}"`,
  }
}
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

Run: `node --test scripts/deps-campagne/lib/overrides.test.mjs`
Expected: PASS — 10 tests

- [ ] **Step 5 : Commit**

```bash
git add scripts/deps-campagne/lib/overrides.mjs scripts/deps-campagne/lib/overrides.test.mjs
git commit -m "feat(deps-campagne): verdict porteur/inerte des overrides pnpm"
```

---

### Task 3 : Le rapport

**Files:**
- Create: `scripts/deps-campagne/lib/report.mjs`
- Test: `scripts/deps-campagne/lib/report.test.mjs`

**Interfaces:**
- Consumes: rien
- Produces:
  - `creerReport({ date, snapshot }): Report`
  - `ajouterCommit(report, { sha, libelle, categorie, deps, oracle }): Report`
  - `ajouterVerdictOverride(report, verdict): Report`
  - `serialiser(report): string`

`categorie` vaut `'in-range' | 'pin-minor' | 'major'`. `oracle` est la forme produite par Task 4.

Le rapport est **le seul contrat entre le moteur et le skill**. Il doit rester compact — quelques Ko, pas des logs bruts. C'est ce qui tient le coût de l'analyse.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `scripts/deps-campagne/lib/report.test.mjs`.

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { creerReport, ajouterCommit, ajouterVerdictOverride, serialiser } from './report.mjs'

const SNAPSHOT = { outdated: 47, majors: 7, vulnerabilites: 0 }

test('creerReport pose la date et le snapshot', () => {
  const report = creerReport({ date: '2026-07-17', snapshot: SNAPSHOT })

  assert.equal(report.date, '2026-07-17')
  assert.deepEqual(report.snapshot, SNAPSHOT)
  assert.deepEqual(report.commits, [])
  assert.deepEqual(report.overrides, [])
})

test('ajouterCommit empile dans l ordre', () => {
  let report = creerReport({ date: '2026-07-17', snapshot: SNAPSHOT })
  report = ajouterCommit(report, {
    sha: 'aaa111',
    libelle: 'in-range',
    categorie: 'in-range',
    deps: [{ name: 'react', de: '19.2.5', vers: '19.2.7' }],
    oracle: { rapide: true, complet: true, echecs: [] },
  })
  report = ajouterCommit(report, {
    sha: 'bbb222',
    libelle: 'typescript 6',
    categorie: 'major',
    deps: [{ name: 'typescript', de: '5.9.3', vers: '6.0.3' }],
    oracle: { rapide: false, complet: null, echecs: ['kpilote-api: tsc — 14 erreurs'] },
  })

  assert.equal(report.commits.length, 2)
  assert.equal(report.commits[0].sha, 'aaa111')
  assert.equal(report.commits[1].categorie, 'major')
})

test('ajouterCommit ne mute pas le rapport d origine', () => {
  const report = creerReport({ date: '2026-07-17', snapshot: SNAPSHOT })
  ajouterCommit(report, {
    sha: 'aaa111',
    libelle: 'in-range',
    categorie: 'in-range',
    deps: [],
    oracle: { rapide: true, complet: true, echecs: [] },
  })

  assert.equal(report.commits.length, 0, 'creerReport doit rester intact')
})

test('ajouterVerdictOverride empile les verdicts', () => {
  let report = creerReport({ date: '2026-07-17', snapshot: SNAPSHOT })
  report = ajouterVerdictOverride(report, {
    cle: 'terser',
    nom: 'terser',
    range: '<5.47.0',
    versionsResolues: ['5.47.1'],
    porteur: true,
    preuve: 'sans l override, terser se résout en 5.47.1 — hors de "<5.47.0"',
  })

  assert.equal(report.overrides.length, 1)
  assert.equal(report.overrides[0].porteur, true)
})

test('serialiser produit du JSON relisible', () => {
  let report = creerReport({ date: '2026-07-17', snapshot: SNAPSHOT })
  report = ajouterCommit(report, {
    sha: 'aaa111',
    libelle: 'in-range',
    categorie: 'in-range',
    deps: [],
    oracle: { rapide: true, complet: true, echecs: [] },
  })

  const relu = JSON.parse(serialiser(report))
  assert.equal(relu.commits[0].sha, 'aaa111')
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `node --test scripts/deps-campagne/lib/report.test.mjs`
Expected: FAIL — `Cannot find module './report.mjs'`

- [ ] **Step 3 : Écrire l'implémentation minimale**

Créer `scripts/deps-campagne/lib/report.mjs`.

```js
/**
 * Le report.json est le seul contrat entre le moteur déterministe et le skill.
 * Il reste volontairement compact : le skill lit des verdicts, jamais des logs bruts.
 * Toutes les fonctions sont pures — elles rendent un nouveau rapport, sans muter l'entrée.
 */

export function creerReport({ date, snapshot }) {
  return { date, snapshot, commits: [], overrides: [] }
}

export function ajouterCommit(report, commit) {
  return { ...report, commits: [...report.commits, commit] }
}

export function ajouterVerdictOverride(report, verdict) {
  return { ...report, overrides: [...report.overrides, verdict] }
}

export function serialiser(report) {
  return JSON.stringify(report, null, 2)
}
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

Run: `node --test scripts/deps-campagne/lib/report.test.mjs`
Expected: PASS — 5 tests

- [ ] **Step 5 : Lancer toute la suite**

Run: `node --test "scripts/deps-campagne/lib/**/*.test.mjs"`
Expected: PASS — 21 tests au total (6 + 10 + 5)

> Le glob est obligatoire : `node --test <dossier>` tente de charger le dossier comme un
> module et échoue en `MODULE_NOT_FOUND`. Garder les guillemets pour que ce soit node qui
> résolve le glob, et pas le shell.

- [ ] **Step 6 : Commit**

```bash
git add scripts/deps-campagne/lib/report.mjs scripts/deps-campagne/lib/report.test.mjs
git commit -m "feat(deps-campagne): contrat report.json entre le moteur et le skill"
```

---

### Task 4 : Exécution shell et oracle

**Files:**
- Create: `scripts/deps-campagne/lib/shell.mjs`
- Create: `scripts/deps-campagne/lib/oracle.mjs`

**Interfaces:**
- Consumes: rien
- Produces:
  - `run(argv: string[], options?: { env?: object, input?: string }): { code, stdout, stderr }` — **argv en tableau, jamais une chaîne**, et ne lève jamais
  - `installer(): { code, stdout, stderr }`
  - `verifierBaseAccessible(): boolean`
  - `oracleRapide(): { ok: boolean, echecs: string[] }` — install + tsc sur les 3 apps typées
  - `oracleComplet(): { ok: boolean, echecs: string[], audit: string }` — lint + tests + audit
  - `FILTRES_KPILOTE: string[]`

> **Sécurité — non négociable.** `run` prend un **tableau d'arguments** et passe par
> `execFileSync`, jamais `execSync` avec une chaîne. Cet outil interpole des noms de paquets
> et des versions **venus du registre npm** : les faire traverser un shell rouvrirait
> exactement la surface d'attaque que `minimumReleaseAge: 20160` cherche à réduire. Un test
> (`shell.test.mjs`) verrouille la propriété pour que personne ne régresse vers `execSync`.

Enveloppe impure et volontairement mince : pas de logique métier ici, donc pas de tests unitaires. La vérification se fait au Step 4 par une exécution réelle.

**Contexte indispensable pour l'implémenteur :**

- Le script `lint` de chaque app est un `&&` de plusieurs outils. Pour l'oracle **rapide**, on ne peut donc pas passer par `pnpm lint` — il faut appeler `tsc` directement via `pnpm -F <pkg> exec`.
- `kpilote-webapp` et `kpilote-admin` exigent `tsr generate` (codegen TanStack Router) **avant** `tsc`, sinon les types de routes n'existent pas.
- `kpilote-api` exige `prisma generate --sql` avant `tsc` : la commande introspecte les tables réelles pour typer les requêtes TypedSQL. **Une base vivante est obligatoire, même pour du lint.** C'est déjà pourquoi `testAndLint.yml` monte un postgres pour son job de lint.
- `kpilote-shared` et `kpilote-ui` n'ont que `prettier` — aucun `tsc`, aucun test. Ils ne participent pas à l'oracle.
- `kpilote-admin` n'a **aucun test**. L'oracle complet ne lance donc `vitest` que sur `kpilote-api` et `kpilote-webapp`.

- [ ] **Step 1 : Écrire `shell.mjs`**

```js
import { execSync } from 'node:child_process'

const RACINE = new URL('../../..', import.meta.url).pathname

/**
 * Exécute une commande à la racine du monorepo. Ne lève jamais : rend toujours
 * { code, stdout, stderr }. C'est à l'appelant de juger si un code non nul est une erreur —
 * `pnpm outdated` et `pnpm audit` sortent en non-zéro dans leur cas nominal.
 */
export function run(commande, { env = {}, input = undefined } = {}) {
  try {
    const stdout = execSync(commande, {
      cwd: RACINE,
      env: { ...process.env, ...env },
      encoding: 'utf8',
      input,
      stdio: input === undefined ? ['ignore', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    })
    return { code: 0, stdout, stderr: '' }
  } catch (erreur) {
    return {
      code: erreur.status ?? 1,
      stdout: erreur.stdout?.toString() ?? '',
      stderr: erreur.stderr?.toString() ?? '',
    }
  }
}
```

`run` ne lève jamais : elle rend toujours `{ code, stdout, stderr }`. C'est à l'appelant de
décider si un code non nul est une erreur — `pnpm outdated` sort en 1 dès qu'une dep est
périmée, ce qui est le cas nominal ici.

- [ ] **Step 2 : Écrire `oracle.mjs`**

```js
import { run } from './shell.mjs'

const FILTRES_KPILOTE = [
  '--filter @pilote/kpilote-api',
  '--filter @pilote/kpilote-webapp',
  '--filter @pilote/kpilote-admin',
  '--filter @pilote/kpilote-ui',
].join(' ')

/** Apps qui portent réellement un tsc. kpilote-shared et kpilote-ui n'ont que prettier. */
const APPS_TYPEES = [
  { pkg: '@pilote/kpilote-api', prepare: 'prisma generate --sql', besoinBase: true },
  { pkg: '@pilote/kpilote-webapp', prepare: 'tsr generate', besoinBase: false },
  { pkg: '@pilote/kpilote-admin', prepare: 'tsr generate', besoinBase: false },
]

/** Apps qui portent des tests. kpilote-admin n'en a AUCUN — ne pas l'ajouter ici. */
const APPS_TESTEES = ['@pilote/kpilote-api', '@pilote/kpilote-webapp']

export { FILTRES_KPILOTE }

export function installer() {
  return run('pnpm install --no-frozen-lockfile')
}

/**
 * Depuis Prisma 7, `db execute` lit la datasource depuis `prisma.config.ts` et REFUSE
 * --schema comme --url (« unknown or unexpected option »). Ne surtout pas les rajouter :
 * les habitudes d'avant Prisma 7 induisent en erreur ici. Cible la base de dev (5434).
 */
export function verifierBaseAccessible() {
  const { code } = run(
    ['pnpm', '-F', '@pilote/kpilote-api', 'exec', 'prisma', 'db', 'execute', '--stdin'],
    { input: 'SELECT 1;' },
  )
  return code === 0
}

/**
 * Oracle rapide : install + tsc sur les 3 apps typées. ~30 s.
 * C'est le signal discriminant sur un codebase TS : signature changée, export retiré,
 * type modifié. Inutile de payer 3 min de tests pour un commit qui ne compile pas.
 */
export function oracleRapide() {
  const echecs = []

  const install = installer()
  if (install.code !== 0) {
    return { ok: false, echecs: [`install: ${derniereLigne(install.stderr)}`] }
  }

  for (const app of APPS_TYPEES) {
    const prepare = run(`pnpm -F ${app.pkg} exec ${app.prepare}`)
    if (prepare.code !== 0) {
      echecs.push(`${app.pkg}: ${app.prepare} — ${derniereLigne(prepare.stderr)}`)
      continue
    }
    const tsc = run(`pnpm -F ${app.pkg} exec tsc --noEmit`)
    if (tsc.code !== 0) {
      echecs.push(`${app.pkg}: tsc — ${compterErreursTsc(tsc.stdout)} erreurs\n${extrait(tsc.stdout)}`)
    }
  }

  return { ok: echecs.length === 0, echecs }
}

/** Oracle complet : lint + tests + audit. Ne le lancer que si l'oracle rapide passe. */
export function oracleComplet() {
  const echecs = []

  for (const app of APPS_TYPEES) {
    const lint = run('pnpm lint', { env: { APP_PACKAGE: app.pkg } })
    if (lint.code !== 0) echecs.push(`${app.pkg}: lint — ${extrait(lint.stdout || lint.stderr)}`)
  }

  for (const pkg of APPS_TESTEES) {
    const test = run('pnpm test', {
      env: {
        APP_PACKAGE: pkg,
        VITE_API_URL: 'http://localhost:3000',
        OIDC_ISSUER_URL: 'https://example.test/realms/test',
        OIDC_JWKS_URI: 'https://example.test/realms/test/protocol/openid-connect/certs',
        OIDC_AUDIENCE: 'test-client',
        OIDC_AUTHORIZED_PARTY: 'test-client',
      },
    })
    if (test.code !== 0) echecs.push(`${pkg}: tests — ${extrait(test.stdout || test.stderr)}`)
  }

  // `pnpm audit` sort en non-zéro dès qu'il trouve une vulnérabilité : c'est une donnée, pas une erreur.
  const audit = run('pnpm audit --json')
  return { ok: echecs.length === 0, echecs, audit: audit.stdout }
}

function derniereLigne(texte) {
  const lignes = (texte ?? '').trim().split('\n').filter(Boolean)
  return lignes[lignes.length - 1] ?? '(pas de sortie)'
}

function compterErreursTsc(sortie) {
  return (sortie.match(/error TS\d+/g) ?? []).length
}

/** Le rapport doit rester compact : on ne garde que les 20 premières lignes utiles. */
function extrait(sortie) {
  return (sortie ?? '').trim().split('\n').slice(0, 20).join('\n')
}
```

- [ ] **Step 3 : Vérifier que Docker et la base répondent**

Avant toute exécution réelle : demander à l'utilisateur de confirmer que Docker tourne et que la base de dev est levée. **Ne jamais démarrer ou arrêter un conteneur soi-même.**

- [ ] **Step 4 : Vérifier l'oracle rapide sur l'arbre propre**

Sur une working tree propre (aucun bump appliqué), l'oracle rapide doit passer intégralement — sinon le repo est déjà cassé et rien de ce qui suit n'a de sens.

```bash
node -e "import('./scripts/deps-campagne/lib/oracle.mjs').then(async (m) => { const r = m.oracleRapide(); console.log(JSON.stringify(r, null, 2)); process.exit(r.ok ? 0 : 1) })"
```

Expected: `{ "ok": true, "echecs": [] }`

Si `kpilote-api` échoue sur `prisma generate --sql`, c'est la base : vérifier avec l'utilisateur, ne pas contourner.

- [ ] **Step 5 : Commit**

```bash
git add scripts/deps-campagne/lib/shell.mjs scripts/deps-campagne/lib/oracle.mjs
git commit -m "feat(deps-campagne): oracle rapide (tsc) et complet (lint+tests+audit)"
```

---

### Task 5 : Orchestration

**Files:**
- Create: `scripts/deps-campagne/run.mjs`
- Modify: `package.json` (racine, ajouter le script `deps:campagne`)

**Interfaces:**
- Consumes: tout `lib/`
- Produces: une branche `deps/campagne-YYYY-MM-DD` avec ses commits atomiques, et `.deps-campagne/report.json`

**Séquence, dans l'ordre :**

1. Garde-fous : working tree propre, base accessible.
2. Snapshot : `pnpm outdated` + `pnpm audit`.
3. Branche `deps/campagne-YYYY-MM-DD` depuis `dev`.
4. Commit in-range : `pnpm update` filtré → **on observe le diff** (on ne prédit pas via `wanted`).
5. `pnpm outdated` de nouveau → ce qui reste est pin ou major. Grouper les couplés.
6. Un commit par groupe restant, oracle rapide après chacun, oracle complet si le rapide passe.
7. Banc d'essai des 9 overrides.
8. Écrire `report.json`.

- [ ] **Step 1 : Écrire `run.mjs`**

```js
#!/usr/bin/env node
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { run } from './lib/shell.mjs'
import { parseOutdated, grouperCouples } from './lib/outdated.mjs'
import { verdictOverride, nomPaquetDepuisCle } from './lib/overrides.mjs'
import { creerReport, ajouterCommit, ajouterVerdictOverride, serialiser } from './lib/report.mjs'
import {
  oracleRapide,
  oracleComplet,
  installer,
  verifierBaseAccessible,
  FILTRES_KPILOTE,
} from './lib/oracle.mjs'

const CMD_OUTDATED = `pnpm outdated -r ${FILTRES_KPILOTE} --format json`
const DOSSIER_SORTIE = '.deps-campagne'

function aujourdhui() {
  return new Date().toISOString().slice(0, 10)
}

function lireOutdated() {
  // exit 1 = « il y a des deps périmées », ce n'est pas une erreur.
  const { stdout } = run(CMD_OUTDATED)
  if (!stdout.trim()) return []
  return parseOutdated(JSON.parse(stdout))
}

function verifierPrealables() {
  const { stdout } = run('git status --porcelain')
  if (stdout.trim()) {
    throw new Error('working tree sale — commite ou stash avant de lancer la campagne')
  }
  if (!verifierBaseAccessible()) {
    throw new Error(
      'base de dev injoignable — kpilote-api en a besoin même pour son lint (prisma generate --sql). ' +
        'Vérifie que Docker tourne et que la base est levée, puis relance. ' +
        'Le script ne touche jamais aux conteneurs lui-même.',
    )
  }
}

function commiter(message) {
  run('git add package.json pnpm-lock.yaml apps packages')
  run(`git commit -m ${JSON.stringify(message)} --no-verify`)
  return run('git rev-parse --short HEAD').stdout.trim()
}

/** Oracle complet seulement si le rapide passe : inutile de tester ce qui ne compile pas. */
function evaluer() {
  const rapide = oracleRapide()
  if (!rapide.ok) return { rapide: false, complet: null, echecs: rapide.echecs }
  const complet = oracleComplet()
  return { rapide: true, complet: complet.ok, echecs: complet.echecs }
}

function bancEssaiOverrides() {
  const pkgRacine = JSON.parse(readFileSync('package.json', 'utf8'))
  const overrides = pkgRacine.pnpm.overrides
  const verdicts = []

  for (const [cle, range] of Object.entries(overrides)) {
    const sansCelui = { ...overrides }
    delete sansCelui[cle]

    const modifie = {
      ...pkgRacine,
      pnpm: { ...pkgRacine.pnpm, overrides: sansCelui },
    }
    writeFileSync('package.json', JSON.stringify(modifie, null, 2) + '\n')
    installer()

    const verdict = verdictOverride({
      cle,
      range,
      versionsResolues: versionsResoluesDe(cle),
    })
    verdicts.push(verdict)

    // Toujours restaurer : le banc d'essai observe, il ne décide pas.
    run('git checkout -- package.json pnpm-lock.yaml')
  }

  installer()
  return verdicts
}

function versionsResoluesDe(cle) {
  const nom = nomPaquetDepuisCle(cle)
  const { stdout } = run(`pnpm why ${nom} -r --json --depth Infinity`)
  if (!stdout.trim()) return []
  const versions = new Set()
  for (const match of stdout.matchAll(new RegExp(`"${nom.replace(/[/@]/g, '\\$&')}@([0-9][^"]*)"`, 'g'))) {
    versions.add(match[1])
  }
  return [...versions]
}

function main() {
  verifierPrealables()

  const date = aujourdhui()
  const depart = lireOutdated()
  const audit = run('pnpm audit --json')

  let report = creerReport({
    date,
    snapshot: {
      outdated: depart.length,
      majors: depart.filter((d) => d.isMajor).length,
      audit: audit.stdout.slice(0, 2000),
    },
  })

  run(`git checkout -b deps/campagne-${date}`)

  // --- Commit in-range : on fait, puis on observe ce qui a bougé.
  const avant = lireOutdated()
  run(`pnpm update -r ${FILTRES_KPILOTE}`)
  const apres = lireOutdated()
  const bouges = avant.filter((a) => {
    const encore = apres.find((b) => b.name === a.name)
    return !encore || encore.current !== a.current
  })

  if (bouges.length > 0) {
    const sha = commiter(`chore(deps): bumps in-range (${bouges.length} paquets)`)
    report = ajouterCommit(report, {
      sha,
      libelle: 'bumps in-range',
      categorie: 'in-range',
      deps: bouges.map((d) => ({ name: d.name, de: d.current, vers: d.latest })),
      oracle: evaluer(),
    })
  }

  // --- Ce qui reste : pins et majors, groupés par couplage.
  for (const groupe of grouperCouples(apres)) {
    const categorie = groupe.deps.some((d) => d.isMajor) ? 'major' : 'pin-minor'
    const cibles = groupe.deps.map((d) => `${d.name}@${d.latest}`).join(' ')

    for (const dep of groupe.deps) {
      for (const dependent of dep.dependents) {
        run(`pnpm -F ${dependent} add ${dep.name}@${dep.latest}`)
      }
    }

    const sha = commiter(`chore(deps): ${groupe.nom} -> ${groupe.deps[0].latest} [${categorie}]`)
    report = ajouterCommit(report, {
      sha,
      libelle: `${groupe.nom} (${cibles})`,
      categorie,
      deps: groupe.deps.map((d) => ({ name: d.name, de: d.current, vers: d.latest })),
      oracle: evaluer(),
    })
  }

  // --- Banc d'essai des overrides, monorepo-wide.
  for (const verdict of bancEssaiOverrides()) {
    report = ajouterVerdictOverride(report, verdict)
  }

  mkdirSync(DOSSIER_SORTIE, { recursive: true })
  writeFileSync(`${DOSSIER_SORTIE}/report.json`, serialiser(report))
  console.log(`report écrit dans ${DOSSIER_SORTIE}/report.json`)
}

main()
```

- [ ] **Step 2 : Ajouter le script racine et ignorer la sortie**

Dans le `package.json` racine, ajouter à `scripts` :

```json
"deps:campagne": "node scripts/deps-campagne/run.mjs"
```

Ajouter à `.gitignore` :

```
# sortie de la campagne de deps (rapport de travail, jamais commité)
.deps-campagne/
```

- [ ] **Step 3 : Vérifier sur une working tree propre**

Run: `pnpm deps:campagne`
Expected: la commande crée `deps/campagne-<date>`, empile les commits, et écrit `.deps-campagne/report.json`.

Vérifications à faire à la main après coup :
- `git log --oneline dev..HEAD` → un commit in-range + un commit par groupe
- `cat .deps-campagne/report.json | head -40` → snapshot + commits renseignés
- `git status` → **propre** (le banc d'essai doit avoir restauré `package.json`)
- Le verdict `terser` est présent dans `report.overrides`

- [ ] **Step 4 : Revenir sur `dev` et nettoyer**

```bash
git checkout dev
git branch -D deps/campagne-$(date +%F)
```

- [ ] **Step 5 : Commit**

```bash
git add scripts/deps-campagne/run.mjs package.json .gitignore
git commit -m "feat(deps-campagne): orchestration de la campagne (branche, commits atomiques, banc d'essai)"
```

---

### Task 6 : Le skill

**Files:**
- Create: `.claude/skills/deps-campagne/SKILL.md`

**Interfaces:**
- Consumes: `.deps-campagne/report.json` (Task 5), `DEPENDENCIES.md`
- Produces: une PR ouverte, `DEPENDENCIES.md` mis à jour

- [ ] **Step 1 : Écrire le skill**

Créer `.claude/skills/deps-campagne/SKILL.md` :

````markdown
---
name: deps-campagne
description: Lance une campagne d'upgrade des dépendances kpilote — bumps, oracle, banc d'essai des overrides, analyse IA des breaking changes, et ouverture d'une PR détaillée. À utiliser environ toutes les deux semaines, ou quand l'utilisateur demande une campagne de deps.
---

# Campagne d'upgrade des dépendances

Produit une branche + une PR qui sert de **plan de travail** : la PR a le droit d'être rouge,
l'objectif est du **rouge lisible**, pas du vert.

Design : `docs/superpowers/specs/2026-07-17-campagne-deps-ia-design.md`

## 1. Préalables

Demander à l'utilisateur de confirmer que **Docker tourne et que la base de dev est levée**
(`kpilote-api` en a besoin même pour son lint : `prisma generate --sql` introspecte les tables).
**Ne jamais démarrer, arrêter ou modifier un conteneur.**

Vérifier que la working tree est propre.

## 2. Lancer le moteur

```bash
pnpm deps:campagne
```

Compter ~40-60 min. Le moteur crée la branche, empile les commits atomiques, joue l'oracle
après chacun, passe les 9 overrides au banc d'essai, et écrit `.deps-campagne/report.json`.

Ne pas commenter la sortie brute — tout est dans le rapport.

## 3. Analyser les majors — un subagent par major, en parallèle

Lire `.deps-campagne/report.json`. Pour **chaque** commit de catégorie `major`,
dispatcher **un subagent** avec un contexte propre. Les lancer **en parallèle**
(un seul message, plusieurs appels).

La ressource finie n'est pas le coût, c'est le **contexte** : un agent qui avale 7 changelogs
travaille moins bien que 7 agents qui en lisent un chacun.

Prompt de chaque subagent :

> Le paquet `<nom>` passe de `<de>` à `<vers>` dans le monorepo kpilote.
> Résultat de l'oracle sur ce commit : `<oracle du rapport>`.
>
> 1. Récupère le changelog / les release notes entre ces deux versions.
> 2. Pour **chaque** breaking change annoncé, tranche d'abord : **est-ce que `tsc --noEmit`
>    l'aurait attrapé ?** (signature changée, export retiré, type modifié → oui).
>    - Si oui : la réponse est déjà dans l'oracle. Ne cherche pas dans le code, dis-le.
>    - Si non (comportement runtime à signature identique, changement de défaut, format de
>      config) : **c'est là que tu as de la valeur**. Cherche dans `apps/kpilote-*` et
>      `packages/kpilote-*` si le projet est concerné, et rapporte les fichiers et lignes.
> 3. Rends un verdict structuré, en séparant STRICTEMENT :
>    - **PROUVÉ** : l'oracle a tourné, voici le résultat. C'est un fait.
>    - **HYPOTHÈSE** : le changelog annonce X, j'ai cherché Y, voici ce que j'en déduis.
>      C'est un avis, avec ses preuves.
>
> Ne modifie aucun fichier. Tu analyses, tu ne répares pas.

Points d'attention à transmettre au subagent concerné :

- **`typescript 5 → 6` casse l'oracle lui-même.** Si `tsc` échoue sur ce commit, la question
  est : le code est-il cassé, ou TS 6 est-il plus strict ? À trancher, pas à esquiver.
- **`kpilote-admin` n'a aucun test.** Aucun filet runtime. C'est l'app où l'analyse a le plus
  de valeur et où elle est la moins vérifiable — le dire.
- **`@hono/node-server 1 → 2`** croise l'override `>=1.19.13`, dont `DEPENDENCIES.md` dit que
  la condition de sortie est « quand `@prisma/dev` bumpera ». Croiser avec le verdict du banc d'essai.

## 4. Croiser les overrides avec leur WHY

Pour chaque verdict de `report.overrides`, il y a **deux questions distinctes** :

1. **Est-il porteur ?** — déjà répondu, mécaniquement, par le banc d'essai (`porteur` + `preuve`).
2. **Sa raison tient-elle encore ?** — c'est la colonne « Condition de sortie » de
   `DEPENDENCIES.md`, écrite en français. Aller vérifier.

**Les deux peuvent diverger, et c'est le cas intéressant** : un override inerte aujourd'hui
dont la condition de sortie n'est pas remplie redeviendrait nécessaire au prochain refresh du
lockfile. **Signaler la divergence, ne pas la trancher.**

`terser: "<5.47.0"` est un cas à part : **non documenté**, et le seul **plafond** des neuf.
Si le banc d'essai le dit porteur, il retient activement quelque chose sans qu'on sache quoi.
Chercher pourquoi (`git log -S '"terser"' -- package.json`) et le documenter.

## 5. Mettre à jour `DEPENDENCIES.md`

- Overrides inertes **et** condition de sortie remplie → proposer la suppression, preuve à l'appui.
- Overrides porteurs → laisser, mettre à jour la raison si l'arbre a changé.
- Pins dont la raison est tombée → le signaler.
- « Packages à surveiller » dont la condition est levée → le dire (exemple connu : ESLint 10
  attend Node ≥ 20.19, le projet est sur 24.9.0 depuis longtemps).
- Si un override n'est pas documenté, l'ajouter au tableau avec ce qu'on a trouvé.

## 6. Ouvrir la PR

```bash
git push -u origin deps/campagne-<date>
gh pr create --base dev --title "chore(deps): campagne du <date>" --body-file <corps>
```

Structure du corps :

1. **Résumé** — n deps montées, n majors testés, n overrides tombés
2. **Lot in-range** — ce qui a bougé, résultat de l'oracle
3. **Un bloc par major** — verdict, breaking changes classés PROUVÉ / HYPOTHÈSE, ce qui casse et où
4. **Overrides** — porteur ou inerte (avec la preuve de résolution), condition de sortie remplie ou non, divergences
5. **Reste à faire** — la liste de courses, par commit

Rappeler dans le corps que **les E2E n'ont pas tourné** (`e2e.yml` est en cron, 30 min, stack
complète) et qu'ils sont à déclencher à la main sur la branche via `workflow_dispatch`.

## Interdits

1. **Ne jamais modifier le code applicatif.** Le skill bump des deps et écrit `DEPENDENCIES.md`. Point.
2. **Ne jamais retirer ou baisser un bump pour faire passer les tests.** Un commit rouge reste
   rouge : c'est une information, pas un échec.
3. **Ne jamais toucher aux conteneurs Docker.**
4. **Ne pas prétendre à une couverture qui n'existe pas.** « kpilote-admin : vert » est un
   mensonge par omission — la vérité est « tsc vert, aucun test à faire tourner ».
5. **Ne jamais pousser sur `dev`, ne jamais auto-merger.**
6. **Ne jamais poser un ✅ sur une hypothèse non vérifiée.** La valeur de toute l'analyse tient
   à la séparation PROUVÉ / HYPOTHÈSE.
````

- [ ] **Step 2 : Vérifier que le skill est découvert**

Lancer `/deps-campagne` dans une session Claude Code et vérifier que le skill se charge.
Ne pas dérouler la campagne complète à ce stade — on vérifie seulement le chargement.

- [ ] **Step 3 : Commit**

```bash
git add .claude/skills/deps-campagne/SKILL.md
git commit -m "feat(deps-campagne): skill Claude Code d'analyse et d'ouverture de PR"
```

---

### Task 7 : Validation de bout en bout — le cas `terser`

**Files:** aucun (validation)

Le critère d'acceptation posé par la spec : **si le skill sort le bon verdict sur `terser`, il fonctionne.** C'est une vraie inconnue, avec une réponse vérifiable, et elle exerce toute la chaîne.

- [ ] **Step 1 : Dérouler la campagne complète**

Lancer `/deps-campagne` et aller au bout.

- [ ] **Step 2 : Vérifier le verdict `terser`**

Dans `.deps-campagne/report.json`, l'entrée `terser` doit porter :
- `porteur: true` ou `false`, **avec une preuve de résolution qui cite des versions réelles**
- une preuve cohérente avec le range `<5.47.0`

Recouper à la main :

```bash
node -e 'const p=require("./package.json");delete p.pnpm.overrides.terser;require("fs").writeFileSync("/tmp/pkg-sans-terser.json",JSON.stringify(p,null,2))'
```

Puis vérifier que la version que le rapport annonce est bien celle que pnpm résout sans l'override.

- [ ] **Step 3 : Vérifier que l'archéologie a été faite**

La PR doit dire **pourquoi** le plafond `terser` existe, ou dire explicitement qu'elle n'a pas trouvé — pas rester muette.

```bash
git log -S '"terser"' --oneline -- package.json
```

- [ ] **Step 4 : Vérifier la séparation PROUVÉ / HYPOTHÈSE**

Relire le corps de la PR. **Aucun ✅ ne doit couvrir une affirmation non vérifiée.** C'est le
critère qui décide si l'analyse est digne de confiance ou non.

- [ ] **Step 5 : Vérifier que les interdits ont tenu**

```bash
git diff dev..HEAD --stat
```

Aucun fichier sous `apps/*/src/` ou `packages/*/src/` ne doit apparaître. Uniquement
`package.json`, `pnpm-lock.yaml`, `DEPENDENCIES.md`.

- [ ] **Step 6 : Consigner ce que le premier run a appris**

Mettre à jour la section « Ce qui reste ouvert » de la spec avec les vrais chiffres : temps de
run réel, verdict `terser`, divergence `ky` tranchée ou non.
