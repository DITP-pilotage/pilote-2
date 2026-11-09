# Restitution des indicateurs à la baisse (PR3) — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** le panneau de synthèse de l'onglet « Résultats » interprète la variation, le minimum, le maximum et l'écart à la médiane selon le sens souhaité de l'indicateur ; l'API ne renvoie plus de variation pour un individu à une seule valeur.

**Architecture:** l'API corrige `computeVariation` (moins de deux valeurs → `null`), sans changer le contrat. Côté webapp, une fonction pure `interpreterSelonSens` traduit les tableaux du ticket en `favorable` / `defavorable` / `neutre`. Le panneau reçoit `sensSouhaite` depuis la page et choisit ses tons et ses libellés à partir de cette interprétation.

**Tech Stack:** Hono + `@hono/zod-openapi`, Zod 4, Vitest (intégration sur vraie base côté API, unitaire côté webapp), React + TanStack Query, Tailwind.

**Spec:** `docs/superpowers/specs/2026-11-09-restitution-baisse-pr3-design.md`

## Global Constraints

- Branche `feat/PIL-1778-restitution-baisse`, ouverte depuis `feat/PIL-1778-taux-baisse` (PR stackée sur #2663).
- Nommage : vocabulaire métier en français, technique en anglais. Le type du sens est `SensSouhaite` (`@pilote/kpilote-shared/indicateur`), ses valeurs `HAUSSE` / `BAISSE`.
- Tons : `success` = favorable, `warning` = défavorable, `info` = neutre. **Pas de rouge**, aucun ton ajouté à `Pill`.
- Classes de texte des valeurs : favorable `text-success-425`, défavorable `text-warning-425`, médiane `text-blue-425`.
- Libellés exacts : « EN HAUSSE », « EN BAISSE », « STABLE » (flèches ↑ ↓ →) ; « au-dessus de la médiane », « au-dessous de la médiane », « à la médiane ».
- Textes masqués exacts : « évolution favorable », « évolution défavorable », « position favorable », « position défavorable », « favorable », « défavorable ».
- Le sens n'est pas affiché dans l'onglet « Résultats ».
- Contrat d'API inchangé : `variation` reste `number | null`.
- Pas de test de composant. Tests : intégration API (fichiers existants) et unitaire pour `interpreterSelonSens`.
- **Ne pas commiter sans demande explicite de Triko.** Les étapes « Commit » donnent le message à utiliser une fois le feu vert reçu. Ne pas ouvrir de PR sans demande.
- Messages de commit en français, suffixés `(PIL-1778)`, terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Indicateur à la hausse** : rendu identique à avant, sauf le libellé de l'écart, la pastille « STABLE » et l'absence de pastille avec une seule valeur. → Vérification à l'écran, tâche 3 (IND-003).
2. **Valeur stable réelle** : deux valeurs égales en base donnent une variation exactement 0, donc « → STABLE », pas « ↓ EN BAISSE : 0 ». → Tâche 3, IND-001 sur DEPT-42 (66,20 puis 66,20) et IND-003 sur DEPT-42.
3. **Valeurs remarquables absentes** (`null`) : la ligne affiche « — » en gris, sans couleur d'interprétation et sans texte masqué. → Relecture du code, tâche 2.
4. **Lecteur d'écran** : les textes masqués sont présents dans le DOM pour les deux pastilles et pour le minimum et le maximum, et absents pour « STABLE », « à la médiane » et la médiane. → Tâche 3, par lecture du texte de la page.
5. **Une seule valeur** : ni pastille de variation, ni « Valeur précédente », et l'écart à la médiane reste affiché. → Tâche 3, cas créé à la main puis seed relancé.

---

### Task 1 : API — plus de variation pour un individu à une seule valeur

**Files:**
- Modify: `apps/kpilote-api/src/valeurAvancement/computeVariation.ts`
- Modify (description) : `packages/kpilote-shared/src/valeurAvancement.ts` (`syntheseIndividuApiModelSchema.variation`, l. ~264-270)
- Modify (description) : `apps/kpilote-api/src/valeurAvancement/routes.ts` (l. 295-296)
- Test: `apps/kpilote-api/src/valeurAvancement/computeVariation.test.ts`
- Test: `apps/kpilote-api/src/valeurAvancement/queries/listSyntheseIndividus.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `computeVariation(valeurs: ReadonlyArray<{ valeur: Decimal }>): number | null`, signature inchangée, qui renvoie `null` si `valeurs.length < 2`. Réponse HTTP de `GET /indicateurs/{id}/synthese-individus` : `variation: null` pour un individu à une seule valeur.

- [ ] **Step 1 : Adapter les tests**

Dans `computeVariation.test.ts`, remplacer le test « retourne la valeur seule (comparée à 0) si une seule entrée » par :

```ts
it('retourne null si une seule entrée', () => {
  expect(computeVariation([{ valeur: d(50) }])).toBeNull()
})
```

Dans `listSyntheseIndividus.test.ts` :
- renommer « retourne variation = valeur lorsqu'il n'y a qu'une seule valeur (seul dans son référentiel) » en « retourne une variation null lorsqu'il n'y a qu'une seule valeur (seul dans son référentiel) », attendu `{ individu: deptId, variation: null, ecartMediane: 0 }` (l. 76) ;
- passer à `variation: null` les autres attendus d'individus à une seule valeur, sans toucher au reste : l. 204 (dept2), l. 239, l. 265, l. 428 (deptA), l. 476 (deptA1), l. 477 (deptB1). Les attendus des l. 115, 154, 203 et 298 (deux valeurs ou plus) ne changent pas.

- [ ] **Step 2 : Vérifier l'échec**

Run: `pnpm -F @pilote/kpilote-api test src/valeurAvancement/computeVariation src/valeurAvancement/queries/listSyntheseIndividus`
Expected: FAIL — `computeVariation` renvoie 50 au lieu de `null`, et 7 attendus d'intégration reçoivent un nombre au lieu de `null`.

- [ ] **Step 3 : Implémenter**

`computeVariation` : moins de deux valeurs → `null` ; sinon la différence, comme aujourd'hui. Le repli `?? new Decimal(0)` disparaît. Remplacer dans les deux descriptions « égale à la valeur la plus récente s'il n'en a qu'une (comparée à 0) » / « égale à la valeur la plus récente si une seule (comparée à 0) » par « null si l'individu a moins de deux valeurs (aucune valeur précédente à comparer) », en gardant le reste de la phrase.

- [ ] **Step 4 : Vérifier le passage**

Run: `pnpm -F @pilote/kpilote-api test src/valeurAvancement`
Expected: PASS, aucun autre attendu modifié.

- [ ] **Step 5 : Lint**

Run: `pnpm -F @pilote/kpilote-shared lint && pnpm -F @pilote/kpilote-api lint`
Expected: aucune erreur.

- [ ] **Step 6 : Commit** (après feu vert de Triko)

```bash
git add apps/kpilote-api/src/valeurAvancement packages/kpilote-shared/src/valeurAvancement.ts
git commit -m "fix(kpilote): plus de variation pour un individu à une seule valeur, au lieu de la comparer à 0 (PIL-1778)"
```

---

### Task 2 : Webapp — interpréter le panneau de synthèse selon le sens

**Files:**
- Create: `apps/kpilote-webapp/src/components/indicateurs/interpreterSelonSens.ts`
- Test: `apps/kpilote-webapp/src/components/indicateurs/interpreterSelonSens.test.ts`
- Modify: `apps/kpilote-webapp/src/components/indicateurs/IndicateurSynthesePanel.tsx`
- Modify: `apps/kpilote-webapp/src/components/indicateurs/IndicateurResultatsTab.tsx`
- Modify: `apps/kpilote-webapp/src/routes/_authenticated/indicateurs/$id.tsx` (l. ~216-224, appel d'`IndicateurResultatsTab`)
- Modify: `packages/kpilote-ui/src/Pill.tsx` (exporter `PillTone`)

**Interfaces:**
- Consumes: `type SensSouhaite` (`@pilote/kpilote-shared/indicateur`), `indicateur.sensSouhaite` déjà chargé par la page (PR1), `variation: number | null` (tâche 1).
- Produces:
  - `export type Interpretation = 'favorable' | 'defavorable' | 'neutre'`
  - `export const interpreterSelonSens = (ecart: number, sensSouhaite: SensSouhaite): Interpretation`
  - `export type PillTone` depuis `@pilote/kpilote-ui/Pill`
  - Props : `IndicateurResultatsTab` et `IndicateurSynthesePanel` reçoivent `sensSouhaite: SensSouhaite`.

- [ ] **Step 1 : Écrire le test de la règle**

`interpreterSelonSens.test.ts`, style de `deriverEtatImport.test.ts` :

```ts
describe('interpreterSelonSens', () => {
  it.each([
    { ecart: 3, sens: 'HAUSSE', attendu: 'favorable' },
    { ecart: -3, sens: 'HAUSSE', attendu: 'defavorable' },
    { ecart: 0, sens: 'HAUSSE', attendu: 'neutre' },
    { ecart: 3, sens: 'BAISSE', attendu: 'defavorable' },
    { ecart: 8 - 10, sens: 'BAISSE', attendu: 'favorable' }, // critère du ticket : 10 → 8
    { ecart: 0, sens: 'BAISSE', attendu: 'neutre' },
  ] as const)('$sens, écart $ecart → $attendu', ({ ecart, sens, attendu }) => {
    expect(interpreterSelonSens(ecart, sens)).toBe(attendu)
  })
})
```

- [ ] **Step 2 : Vérifier l'échec**

Run: `pnpm -F @pilote/kpilote-webapp test src/components/indicateurs/interpreterSelonSens`
Expected: FAIL, module introuvable.

- [ ] **Step 3 : Implémenter `interpreterSelonSens`** dans `interpreterSelonSens.ts`

0 → `neutre` ; sinon le signe, inversé pour `BAISSE`.

- [ ] **Step 4 : Vérifier le passage**

Run: `pnpm -F @pilote/kpilote-webapp test src/components/indicateurs/interpreterSelonSens`
Expected: PASS, 6 cas.

- [ ] **Step 5 : Transmettre le sens**

`$id.tsx` passe `sensSouhaite={indicateur.sensSouhaite}` à `IndicateurResultatsTab`, qui le passe à `IndicateurSynthesePanel`. Exporter `PillTone` dans `Pill.tsx`.

- [ ] **Step 6 : Adapter le panneau** (`IndicateurSynthesePanel.tsx`)

Une correspondance locale `Interpretation → PillTone` (`favorable` → `success`, `defavorable` → `warning`, `neutre` → `info`) et une autre vers les classes de texte (`text-success-425`, `text-warning-425`).

Pastille de variation, affichée dès que `variation !== null` (le filtre `!== 0` disparaît) :

| Cas | Contenu visible | Texte masqué |
|---|---|---|
| `variation > 0` | « ↑ EN HAUSSE : {formatVariationFr(variation)} » | « évolution favorable » ou « évolution défavorable » |
| `variation < 0` | « ↓ EN BAISSE : {formatVariationFr(variation)} » | idem |
| `variation === 0` | « → STABLE » | aucun |

Ton : `interpreterSelonSens(variation, sensSouhaite)`.

Données de comparaison : le maximum prend la couleur de `interpreterSelonSens(1, sensSouhaite)` et le minimum celle de `interpreterSelonSens(-1, sensSouhaite)`, avec le texte masqué « favorable » ou « défavorable » après la valeur. La médiane garde `text-blue-425`, sans texte masqué. Une valeur `null` garde « — » en `text-text-subtle`, sans texte masqué. Ajouter pour cela à `ComparaisonRow` une prop optionnelle de texte masqué (nom libre).

Écart à la médiane : ton `interpreterSelonSens(ecartMediane, sensSouhaite)` ; libellé « au-dessus de la médiane » (> 0), « au-dessous de la médiane » (< 0), « à la médiane » (= 0), après `{formatVariationAvecUniteFr(ecartMediane, unite)} · ` comme aujourd'hui ; texte masqué « position favorable » ou « position défavorable », aucun pour « à la médiane ».

Textes masqués : classe `sr-only`, comme dans `IndicateurProgression.tsx`.

- [ ] **Step 7 : Lint**

Run: `pnpm -F @pilote/kpilote-ui lint && pnpm -F @pilote/kpilote-webapp lint`
Expected: aucune erreur.

- [ ] **Step 8 : Commit** (après feu vert de Triko)

```bash
git add packages/kpilote-ui/src/Pill.tsx apps/kpilote-webapp/src/components/indicateurs apps/kpilote-webapp/src/routes/_authenticated/indicateurs
git commit -m "feat(kpilote): le panneau de synthèse interprète variation, minimum, maximum et écart à la médiane selon le sens souhaité (PIL-1778)"
```

---

### Task 3 : Vérification complète et recette à l'écran

**Files:**
- Commit des docs : `docs/superpowers/specs/2026-11-09-restitution-baisse-pr3-design.md`, `docs/superpowers/plans/2026-11-09-restitution-baisse-pr3.md`

**Interfaces:**
- Consumes: tâches 1 et 2, base locale seedée, serveurs de dev de l'API et de la webapp (portless), session ProConnect dans le panneau Navigateur.
- Produces: rien de nouveau.

- [ ] **Step 1 : Suites complètes**

Run: `pnpm -F @pilote/kpilote-api test && pnpm -F @pilote/kpilote-webapp test && pnpm -F @pilote/kpilote-shared test`
Expected: tout vert.

- [ ] **Step 2 : Recette** sur `https://kpilote.modernisation.localhost/indicateurs/<IND>?individu=<DEPT>&referentiel=REF-DEPT`, onglet « Résultats ». Individus choisis par requête sur la base seedée :

| Indicateur, individu | Sens | Attendu |
|---|---|---|
| IND-023, DEPT-09 | baisse | pastille verte « ↓ EN BAISSE » ; minimum vert, maximum orange |
| IND-023, DEPT-01 | baisse | pastille orange « ↑ EN HAUSSE » |
| IND-001, DEPT-42 | baisse | pastille bleue « → STABLE » (66,20 puis 66,20) |
| IND-003, DEPT-01 | hausse | pastille verte « ↑ EN HAUSSE » ; maximum vert, minimum orange ; écart avec le nouveau libellé |
| IND-003, DEPT-42 | hausse | pastille bleue « → STABLE » |

Pour chaque fiche, vérifier la couleur de l'écart à la médiane avec le tableau de la spec, et lire le texte de la page (`get_page_text`) pour contrôler les textes masqués (Review Focus 4).

- [ ] **Step 3 : Cas « une seule valeur »**

En base locale, supprimer les valeurs d'IND-003 sur DEPT-01 sauf celle du `2025-12-01`. Recharger la fiche : pas de pastille de variation, pas de « Valeur précédente », écart à la médiane toujours affiché. Puis remettre la base en état :

Run: `pnpm -F @pilote/kpilote-api db:seed`
Expected: le seed réinsère les valeurs supprimées ; la fiche IND-003 / DEPT-01 retrouve sa pastille.

- [ ] **Step 4 : Commit des docs** (après feu vert de Triko)

```bash
git add docs/superpowers/specs/2026-11-09-restitution-baisse-pr3-design.md docs/superpowers/plans/2026-11-09-restitution-baisse-pr3.md
git commit -m "docs(kpilote): spec et plan de la restitution des indicateurs à la baisse, PR3 (PIL-1778)"
```

Description de PR, le moment venu : signaler que la PR ouverte #2359 (assistant kpilote) reçoit désormais `variation: null` pour un individu à une seule valeur.

---

### Task 4 : Harmoniser les zéros (ajoutée après la relecture finale, décisions 11 et 12 de la spec)

**Files:**
- Modify: `apps/kpilote-api/src/valeurAvancement/computeMediane.ts` (`computeMedianeDecimal`)
- Modify: `apps/kpilote-api/src/valeurAvancement/computeEcartMediane.ts` (médiane `Decimal | number | null`)
- Modify: `apps/kpilote-api/src/valeurAvancement/queries/listSyntheseIndividus.ts` (`computeMedianeParReferentiel` en `Decimal`)
- Modify: `apps/kpilote-webapp/src/lib/format.ts` (`zeroSiAfficheZero`)
- Modify: `apps/kpilote-webapp/src/components/indicateurs/IndicateurSynthesePanel.tsx`
- Test: `apps/kpilote-api/src/valeurAvancement/computeEcartMediane.test.ts`
- Test: `apps/kpilote-webapp/src/lib/format.test.ts`

**Interfaces:**
- Produces: `computeMedianeDecimal(values: ReadonlyArray<Decimal>): Decimal | null` ; `computeEcartMediane(derniereValeur: Decimal | undefined, mediane: Decimal | number | null): number | null` ; `zeroSiAfficheZero(value: number): number`.

- [ ] **Step 1 : Tests qui échouent**
  - API : « renvoie un écart nul pour une valeur dérivée seule dans son référentiel » — `const valeur = new Decimal(3681.313).div(3)` ; `expect(computeEcartMediane(valeur, computeMedianeDecimal([valeur]))).toBe(0)`.
  - Webapp : `zeroSiAfficheZero(0.0001)` et `zeroSiAfficheZero(-3e-13)` valent 0 ; `zeroSiAfficheZero(0.0005)` vaut 0.0005 (affiché « +0,001 ») ; `zeroSiAfficheZero(-1.3)` vaut -1.3.
- [ ] **Step 2 : Vérifier l'échec** — `pnpm -F @pilote/kpilote-api test src/valeurAvancement/computeEcartMediane` et `pnpm -F @pilote/kpilote-webapp test src/lib/format` : FAIL, fonctions absentes.
- [ ] **Step 3 : Implémenter** les trois fonctions ; le panneau applique `zeroSiAfficheZero` à `variation` et à `ecartMediane` (non nuls) avant tout usage.
- [ ] **Step 4 : Vérifier** — `pnpm -F @pilote/kpilote-api test src/valeurAvancement`, `pnpm -F @pilote/kpilote-webapp test`, lint des deux paquets : verts. À l'écran, IND-004 / NAT-FR : écart « 0 j · à la médiane » en bleu.
