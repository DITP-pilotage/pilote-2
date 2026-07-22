# Détection & filtrage du type de valeur (VI/VA/VC) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Détecter la colonne « type de valeur » des fichiers Pilote PPG, résoudre sémantiquement (via Albert) quels tokens correspondent aux valeurs d'avancement (VA), et ne conserver que ces lignes à l'import.

**Architecture:** On insère une 3ᵉ passe Albert (`resoudreTypeValeur`) dans le pipeline de normalisation, entre la découverte de structure et la résolution des individus. La passe 1 détecte le *header* de la colonne type ; la passe 1b reçoit le *set des valeurs distinctes* de cette colonne et renvoie le sous-ensemble « valeur d'avancement ». `appliquerPlan` filtre alors les lignes au niveau ligne (commun aux layouts long et pivot), en amont de la production des triplets. Le modèle final `{ individu, date, valeur }` reste inchangé — le type est un critère de filtrage, pas une donnée métier kpilote.

**Tech Stack:** TypeScript, Zod, `ai` (`generateObject`), neverthrow (`ResultAsync`), Hono/zod-openapi, Vitest, React.

## Global Constraints

- Named exports/imports uniquement — pas de default export.
- Paramètres de fonction sous forme d'objet nommé (pas de positionnels).
- Erreurs des use cases via neverthrow `ResultAsync` ; wrapper les promesses externes avec `ResultAsync.fromPromise`.
- Fichiers **sans** colonne type → comportement strictement inchangé (non-régression).
- Nomenclature VI/VA/VC **jamais hardcodée** en TS : la résolution des tokens VA passe par Albert.
- Le modèle `ItemNormaliseApiModel` reste `{ individu, date, valeur }` — aucun champ `typeValeur`.
- Naming acté : `typesValeurRetenus` (retenus) et `typesValeurDistincts` (set source).
- Tests kpilote-api : `describe/it/expect` de Vitest, imports via alias `@/`, valeurs hardcodées (pas de random).
- **Note sur les tests des passes Albert :** aucun call Albert existant (`decouvrirStructure`, `resoudreIndividus`) n'est testé unitairement et il n'existe pas de pattern de mock de `generateObject`. On suit ce choix : `resoudreTypeValeur` n'a pas de test unitaire (introduire un mock serait un nouveau pattern framework à discuter séparément). Le TDD porte sur les fonctions pures (`collecterValeursDistinctes`, `appliquerPlan`) et sur les schémas Zod (`safeParse`).

**Commande de test kpilote-api :** `pnpm -F @pilote/kpilote-api exec vitest run <chemin-fichier>`

---

## File Structure

| Fichier | Rôle |
|---------|------|
| `apps/kpilote-api/src/valeurImport/helpers/collecterValeursDistinctes.ts` | **Créé.** Extrait le set des valeurs distinctes non vides d'une colonne (pur). |
| `apps/kpilote-api/src/valeurImport/calls/decouvrirStructure.ts` | **Modifié.** Détection optionnelle du header `colonneTypeValeur` (schéma + prompt). |
| `apps/kpilote-api/src/valeurImport/calls/resoudreTypeValeur.ts` | **Créé.** Passe Albert 1b : set distinct → `typesValeurRetenus`. |
| `apps/kpilote-api/src/valeurImport/appliquerPlan.ts` | **Modifié.** Pré-filtrage ligne + warning `LIGNE_IGNOREE` + warning global si aucun type retenu. |
| `apps/kpilote-api/src/valeurImport/commands/normaliserValeursImport.ts` | **Modifié.** Branchement conditionnel de la passe 1b, exposition de `resolutionTypeValeur`. |
| `packages/kpilote-shared/src/valeurImport.ts` | **Modifié.** `colonneTypeValeur` optionnel (plans), `LIGNE_IGNOREE`, `resolutionTypeValeur` (réponse). |
| `apps/kpilote-webapp/src/components/import-valeurs/NormalisationReviewView.tsx` | **Modifié.** Bloc « Type de valeur ». |

---

## Task 1 : Helper `collecterValeursDistinctes`

**Files:**
- Create: `apps/kpilote-api/src/valeurImport/helpers/collecterValeursDistinctes.ts`
- Test: `apps/kpilote-api/src/valeurImport/helpers/collecterValeursDistinctes.test.ts`

**Interfaces:**
- Consumes: `safeStringify` depuis `@/valeurImport/helpers/safeStringify`.
- Produces: `collecterValeursDistinctes({ rows, colonne }: { rows: ReadonlyArray<Record<string, unknown>>; colonne: string }): string[]` — valeurs distinctes non vides, `trim` appliqué, casse préservée, ordre de première apparition.

- [ ] **Step 1: Écrire le test qui échoue**

```typescript
// apps/kpilote-api/src/valeurImport/helpers/collecterValeursDistinctes.test.ts
import { describe, expect, it } from 'vitest'

import { collecterValeursDistinctes } from '@/valeurImport/helpers/collecterValeursDistinctes'

describe('collecterValeursDistinctes', () => {
  it('retourne les valeurs distinctes non vides en préservant la casse et l’ordre', () => {
    const rows = [{ type: 'va' }, { type: 'vc' }, { type: 'va' }, { type: 'vi' }]
    expect(collecterValeursDistinctes({ rows, colonne: 'type' })).toEqual(['va', 'vc', 'vi'])
  })

  it('applique trim, ignore null/undefined/cellules vides', () => {
    const rows = [
      { type: '  VA  ' },
      { type: '' },
      { type: null },
      { type: undefined },
      { autre: 'x' },
    ]
    expect(collecterValeursDistinctes({ rows, colonne: 'type' })).toEqual(['VA'])
  })

  it('retourne un tableau vide si la colonne est absente partout', () => {
    expect(collecterValeursDistinctes({ rows: [{ a: 1 }], colonne: 'type' })).toEqual([])
  })
})
```

- [ ] **Step 2: Lancer le test et vérifier l'échec**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/valeurImport/helpers/collecterValeursDistinctes.test.ts`
Expected: FAIL — `collecterValeursDistinctes` introuvable.

- [ ] **Step 3: Implémenter le helper**

```typescript
// apps/kpilote-api/src/valeurImport/helpers/collecterValeursDistinctes.ts
import { safeStringify } from '@/valeurImport/helpers/safeStringify'

export const collecterValeursDistinctes = ({
  rows,
  colonne,
}: {
  rows: ReadonlyArray<Record<string, unknown>>
  colonne: string
}): string[] => {
  const set = new Set<string>()
  const ordered: string[] = []
  for (const row of rows) {
    const brut = row[colonne]
    if (brut === null || brut === undefined) continue
    const valeur = safeStringify(brut).trim()
    if (valeur && !set.has(valeur)) {
      set.add(valeur)
      ordered.push(valeur)
    }
  }
  return ordered
}
```

- [ ] **Step 4: Lancer le test et vérifier le succès**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/valeurImport/helpers/collecterValeursDistinctes.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/kpilote-api/src/valeurImport/helpers/collecterValeursDistinctes.ts apps/kpilote-api/src/valeurImport/helpers/collecterValeursDistinctes.test.ts
git commit -m "feat(import): helper collecterValeursDistinctes"
```

---

## Task 2 : Détection du header `colonneTypeValeur` (`decouvrirStructure`)

**Files:**
- Modify: `apps/kpilote-api/src/valeurImport/calls/decouvrirStructure.ts`
- Test: `apps/kpilote-api/src/valeurImport/calls/decouvrirStructure.schema.test.ts`

**Interfaces:**
- Produces: le type `PlanLong` et `PlanPivot` gagnent un champ optionnel `colonneTypeValeur?: { nom: string }`. `decouverteOutputSchema` accepte ce champ (Task 5 et 6 en dépendent).

- [ ] **Step 1: Écrire le test qui échoue**

```typescript
// apps/kpilote-api/src/valeurImport/calls/decouvrirStructure.schema.test.ts
import { describe, expect, it } from 'vitest'

import { decouverteOutputSchema } from '@/valeurImport/calls/decouvrirStructure'

describe('decouverteOutputSchema — colonneTypeValeur', () => {
  it('accepte un plan long AVEC colonneTypeValeur', () => {
    const parsed = decouverteOutputSchema.safeParse({
      statut: 'reconnu',
      plan: {
        layout: 'long',
        colonneIndividu: 'zone_nom',
        colonneDate: { nom: 'date_valeur', format: 'iso' },
        colonneValeur: 'valeur',
        colonneTypeValeur: { nom: 'type_valeur' },
      },
    })
    expect(parsed.success).toBe(true)
  })

  it('accepte un plan long SANS colonneTypeValeur (optionnel)', () => {
    const parsed = decouverteOutputSchema.safeParse({
      statut: 'reconnu',
      plan: {
        layout: 'long',
        colonneIndividu: 'zone_nom',
        colonneDate: { nom: 'date_valeur', format: 'iso' },
        colonneValeur: 'valeur',
      },
    })
    expect(parsed.success).toBe(true)
  })

  it('accepte un plan pivot AVEC colonneTypeValeur', () => {
    const parsed = decouverteOutputSchema.safeParse({
      statut: 'reconnu',
      plan: {
        layout: 'pivot',
        colonneIndividu: 'zone_nom',
        colonnesPivot: [{ nom: '2022', dateIso: '2022-01-01' }],
        colonneTypeValeur: { nom: 'type_valeur' },
      },
    })
    expect(parsed.success).toBe(true)
  })
})
```

- [ ] **Step 2: Lancer le test et vérifier l'échec**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/valeurImport/calls/decouvrirStructure.schema.test.ts`
Expected: FAIL — le 1er/3ᵉ test échoue (champ `colonneTypeValeur` inconnu → `safeParse` réussit mais le champ est *stripé* ; le test vérifie `success: true` donc pourrait passer). **Pour rendre l'échec net**, ajouter dans le 1er test l'assertion sur la présence du champ :

```typescript
    expect(parsed.success).toBe(true)
    if (parsed.success && parsed.data.statut === 'reconnu') {
      expect(parsed.data.plan.colonneTypeValeur).toEqual({ nom: 'type_valeur' })
    }
```

Avec cette assertion, Expected: FAIL — `colonneTypeValeur` est `undefined` (stripé) tant que le schéma ne le déclare pas. Ajouter la même assertion au 3ᵉ test (pivot).

- [ ] **Step 3: Étendre le schéma et le prompt**

Dans `apps/kpilote-api/src/valeurImport/calls/decouvrirStructure.ts`, ajouter avant `planLongSchema` :

```typescript
const colonneTypeValeurSchema = z.object({
  nom: z
    .string()
    .describe('Header exact de la colonne indiquant le type de valeur (recopie exacte).'),
})
```

Ajouter le champ à `planLongSchema` (après `colonneValeur`) ET à `planPivotSchema` (après `colonnesPivot`) :

```typescript
  colonneTypeValeur: colonneTypeValeurSchema
    .optional()
    .describe(
      'Colonne OPTIONNELLE distinguant plusieurs types de valeur : valeur initiale, ' +
        "valeur cible, valeur d'avancement / valeur actuelle (typique des exports Pilote PPG). " +
        'Ne renseigne ce champ QUE si une telle colonne existe réellement dans les headers.',
    ),
```

Compléter le `SYSTEM_PROMPT` en ajoutant, juste avant la dernière ligne (`'Ne renvoie jamais un plan…'`) :

```typescript
  'DÉTECTION OPTIONNELLE — TYPE DE VALEUR :\n' +
  'Certains fichiers (exports Pilote PPG) contiennent une colonne distinguant plusieurs ' +
  "types de valeur : valeur initiale, valeur cible, valeur d'avancement (aussi « valeur " +
  'actuelle »). Si une telle colonne existe, renseigne `colonneTypeValeur.nom` avec son ' +
  'header exact. Sinon, laisse ce champ absent.\n' +
  '\n' +
```

- [ ] **Step 4: Lancer le test et vérifier le succès**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/valeurImport/calls/decouvrirStructure.schema.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/kpilote-api/src/valeurImport/calls/decouvrirStructure.ts apps/kpilote-api/src/valeurImport/calls/decouvrirStructure.schema.test.ts
git commit -m "feat(import): détection du header colonneTypeValeur (Albert pass 1)"
```

---

## Task 3 : Passe Albert 1b `resoudreTypeValeur`

**Files:**
- Create: `apps/kpilote-api/src/valeurImport/calls/resoudreTypeValeur.ts`

**Interfaces:**
- Consumes: `createAlbertModel`, `ALBERT_TEMPERATURE` (`@/valeurImport/helpers/albert`), `logger`, `generateObject`, `ResultAsync`/`errAsync`.
- Produces:
  - `type ResoudreTypeValeurError = { type: 'ALBERT_NON_CONFIGURE' } | { type: 'ALBERT_UNAVAILABLE'; cause: unknown }`
  - `resoudreTypeValeur({ colonne, typesValeurDistincts }: { colonne: string; typesValeurDistincts: ReadonlyArray<string> }): ResultAsync<{ typesValeurRetenus: string[] }, ResoudreTypeValeurError>` — `typesValeurRetenus` est un sous-ensemble filtré défensivement de `typesValeurDistincts`.

Pas de test unitaire (voir Global Constraints — aligné sur les autres passes Albert).

- [ ] **Step 1: Créer le fichier de la passe**

```typescript
// apps/kpilote-api/src/valeurImport/calls/resoudreTypeValeur.ts
import { generateObject } from 'ai'
import { errAsync, ResultAsync } from 'neverthrow'
import { z } from 'zod'

import { logger } from '@/framework/logger/logger'
import { ALBERT_TEMPERATURE, createAlbertModel } from '@/valeurImport/helpers/albert'

const outputSchema = z.object({
  typesValeurRetenus: z
    .array(z.string())
    .describe(
      'Sous-ensemble des valeurs fournies correspondant au concept de valeur ' +
        "d'avancement / valeur actuelle. Recopie EXACTE des valeurs reçues. " +
        'Liste vide si aucune ne correspond.',
    ),
})

export type ResoudreTypeValeurError =
  | { type: 'ALBERT_NON_CONFIGURE' }
  | { type: 'ALBERT_UNAVAILABLE'; cause: unknown }

const SYSTEM_PROMPT =
  "Tu reçois l'ensemble des valeurs distinctes d'une colonne qui indique le TYPE DE VALEUR " +
  "dans un fichier de données territorial (souvent issu de Pilote PPG).\n" +
  'Trois concepts coexistent :\n' +
  '- valeur initiale (VI) — état de départ ;\n' +
  '- valeur cible (VC) — objectif visé ;\n' +
  "- valeur d'avancement / valeur actuelle (VA) — mesure constatée courante.\n" +
  '\n' +
  "kpilote n'importe QUE les valeurs d'avancement (VA). Ta tâche : parmi les valeurs " +
  'fournies, renvoie EXACTEMENT celles (recopiées à l\'identique) qui correspondent au ' +
  "concept de valeur d'avancement / valeur actuelle.\n" +
  '\n' +
  'La nomenclature varie : `va`, `VA`, `Valeur Actuelle`, `Valeur Avancement`, ' +
  '`VALEUR_AVANCEMENT`, etc. Ne conserve JAMAIS les valeurs correspondant à VI (valeur ' +
  'initiale) ou VC (valeur cible). Si aucune valeur ne correspond clairement à une valeur ' +
  "d'avancement, renvoie une liste vide."

export const resoudreTypeValeur = ({
  colonne,
  typesValeurDistincts,
}: {
  colonne: string
  typesValeurDistincts: ReadonlyArray<string>
}): ResultAsync<{ typesValeurRetenus: string[] }, ResoudreTypeValeurError> => {
  const model = createAlbertModel()
  if (!model) return errAsync({ type: 'ALBERT_NON_CONFIGURE' })

  const prompt = [
    `Colonne « ${colonne} ».`,
    `Valeurs distinctes rencontrées : ${JSON.stringify([...typesValeurDistincts])}`,
  ].join('\n')

  const startedAt = performance.now()
  logger.info(
    {
      event: 'importPoc.resoudreTypeValeur.start',
      colonne,
      nbValeursDistinctes: typesValeurDistincts.length,
    },
    'Albert call 1b (type de valeur) — début',
  )

  const distinctsSet = new Set(typesValeurDistincts)

  return ResultAsync.fromPromise(
    generateObject({
      model,
      schema: outputSchema,
      system: SYSTEM_PROMPT,
      prompt,
      temperature: ALBERT_TEMPERATURE,
    }).then((result) => {
      // Filtre défensif : ne garder que les valeurs réellement présentes en entrée
      // (protection contre une éventuelle hallucination d'Albert).
      const typesValeurRetenus = result.object.typesValeurRetenus.filter((valeur) =>
        distinctsSet.has(valeur),
      )
      logger.info(
        {
          event: 'importPoc.resoudreTypeValeur.done',
          durationMs: Math.round(performance.now() - startedAt),
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          typesValeurRetenus,
        },
        'Albert call 1b (type de valeur) — fin',
      )
      return { typesValeurRetenus }
    }),
    (cause): ResoudreTypeValeurError => {
      logger.error(
        {
          event: 'importPoc.resoudreTypeValeur.error',
          durationMs: Math.round(performance.now() - startedAt),
          cause: cause instanceof Error ? cause.message : String(cause),
        },
        'Albert call 1b (type de valeur) — échec',
      )
      return { type: 'ALBERT_UNAVAILABLE', cause }
    },
  )
}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `pnpm -F @pilote/kpilote-api exec tsc --noEmit`
Expected: aucune erreur liée à `resoudreTypeValeur.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/kpilote-api/src/valeurImport/calls/resoudreTypeValeur.ts
git commit -m "feat(import): passe Albert 1b resoudreTypeValeur (set distinct -> VA)"
```

---

## Task 4 : Filtrage dans `appliquerPlan`

**Files:**
- Modify: `apps/kpilote-api/src/valeurImport/appliquerPlan.ts`
- Test: `apps/kpilote-api/src/valeurImport/appliquerPlan.test.ts`

**Interfaces:**
- Consumes: `Plan` (avec `colonneTypeValeur?` de Task 2), `ResolutionResult`, `safeStringify`, `parseDate`, `parseNombre`.
- Produces: `appliquerPlan` gagne un paramètre optionnel `typeValeur?: { colonne: string; typesValeurRetenus: ReadonlyArray<string> }`. Le type `WarningApplication['code']` gagne `'LIGNE_IGNOREE'`.

- [ ] **Step 1: Écrire les tests qui échouent**

```typescript
// apps/kpilote-api/src/valeurImport/appliquerPlan.test.ts
import { describe, expect, it } from 'vitest'

import { appliquerPlan } from '@/valeurImport/appliquerPlan'
import { type Plan } from '@/valeurImport/calls/decouvrirStructure'
import { type ResolutionResult } from '@/valeurImport/calls/resoudreIndividus'

const individusValides = [{ publicId: 'D01' }, { publicId: 'D02' }]

const resolution: ResolutionResult = {
  mapping: [
    { libelleSource: 'Ain', individuPublicId: 'D01' },
    { libelleSource: 'Aisne', individuPublicId: 'D02' },
  ],
  nonResolus: [],
}

const planLong: Plan = {
  layout: 'long',
  colonneIndividu: 'zone_nom',
  colonneDate: { nom: 'date_valeur', format: 'iso' },
  colonneValeur: 'valeur',
  colonneTypeValeur: { nom: 'type_valeur' },
}

describe('appliquerPlan — filtrage par type de valeur', () => {
  it('layout long : ne garde que les lignes dont le type est retenu (VA)', () => {
    const rows = [
      { zone_nom: 'Ain', date_valeur: '2022-10-01', type_valeur: 'vi', valeur: '2693,44' },
      { zone_nom: 'Ain', date_valeur: '2023-12-31', type_valeur: 'va', valeur: '3037,53' },
      { zone_nom: 'Ain', date_valeur: '2024-12-31', type_valeur: 'vc', valeur: '2626,11' },
    ]
    const { items, warnings } = appliquerPlan({
      plan: planLong,
      rows,
      resolution,
      individusValides,
      typeValeur: { colonne: 'type_valeur', typesValeurRetenus: ['va'] },
    })
    expect(items).toEqual([{ individu: 'D01', date: '2023-12-31', valeur: 3037.53 }])
    expect(warnings.filter((w) => w.code === 'LIGNE_IGNOREE')).toHaveLength(2)
  })

  it('compare le type sans tenir compte de la casse ni des espaces', () => {
    const rows = [{ zone_nom: 'Ain', date_valeur: '2023-12-31', type_valeur: '  VA ', valeur: '10' }]
    const { items } = appliquerPlan({
      plan: planLong,
      rows,
      resolution,
      individusValides,
      typeValeur: { colonne: 'type_valeur', typesValeurRetenus: ['va'] },
    })
    expect(items).toEqual([{ individu: 'D01', date: '2023-12-31', valeur: 10 }])
  })

  it('aucun type retenu : aucun item et un unique warning global', () => {
    const rows = [
      { zone_nom: 'Ain', date_valeur: '2023-12-31', type_valeur: 'vi', valeur: '10' },
      { zone_nom: 'Aisne', date_valeur: '2023-12-31', type_valeur: 'vc', valeur: '20' },
    ]
    const { items, warnings } = appliquerPlan({
      plan: planLong,
      rows,
      resolution,
      individusValides,
      typeValeur: { colonne: 'type_valeur', typesValeurRetenus: [] },
    })
    expect(items).toEqual([])
    expect(warnings).toHaveLength(1)
    expect(warnings[0].code).toBe('LIGNE_IGNOREE')
  })

  it('sans typeValeur : comportement inchangé (toutes les lignes valides produisent un item)', () => {
    const planSansType: Plan = {
      layout: 'long',
      colonneIndividu: 'zone_nom',
      colonneDate: { nom: 'date_valeur', format: 'iso' },
      colonneValeur: 'valeur',
    }
    const rows = [
      { zone_nom: 'Ain', date_valeur: '2023-12-31', valeur: '10' },
      { zone_nom: 'Aisne', date_valeur: '2023-12-31', valeur: '20' },
    ]
    const { items, warnings } = appliquerPlan({
      plan: planSansType,
      rows,
      resolution,
      individusValides,
    })
    expect(items).toHaveLength(2)
    expect(warnings.filter((w) => w.code === 'LIGNE_IGNOREE')).toHaveLength(0)
  })

  it('layout pivot : filtre par ligne avant expansion des colonnes-dates', () => {
    const planPivot: Plan = {
      layout: 'pivot',
      colonneIndividu: 'zone_nom',
      colonnesPivot: [
        { nom: '2022', dateIso: '2022-01-01' },
        { nom: '2023', dateIso: '2023-01-01' },
      ],
      colonneTypeValeur: { nom: 'type_valeur' },
    }
    const rows = [
      { zone_nom: 'Ain', type_valeur: 'va', '2022': '10', '2023': '20' },
      { zone_nom: 'Ain', type_valeur: 'vc', '2022': '11', '2023': '21' },
    ]
    const { items } = appliquerPlan({
      plan: planPivot,
      rows,
      resolution,
      individusValides,
      typeValeur: { colonne: 'type_valeur', typesValeurRetenus: ['va'] },
    })
    expect(items).toEqual([
      { individu: 'D01', date: '2022-01-01', valeur: 10 },
      { individu: 'D01', date: '2023-01-01', valeur: 20 },
    ])
  })
})
```

- [ ] **Step 2: Lancer les tests et vérifier l'échec**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/valeurImport/appliquerPlan.test.ts`
Expected: FAIL — `appliquerPlan` n'accepte pas encore `typeValeur` / le filtrage n'existe pas.

- [ ] **Step 3: Ajouter `LIGNE_IGNOREE` au type de warning**

Dans `apps/kpilote-api/src/valeurImport/appliquerPlan.ts`, étendre l'union `WarningApplication['code']` :

```typescript
export type WarningApplication = {
  code:
    | 'INDIVIDU_NON_RESOLU'
    | 'INDIVIDU_HALLUCINE'
    | 'DATE_INVALIDE'
    | 'VALEUR_INVALIDE'
    | 'CELLULE_VIDE'
    | 'LIGNE_IGNOREE'
  message: string
  ligneSource?: number
  libelleSource?: string
  colonneSource?: string
}
```

- [ ] **Step 4: Ajouter le paramètre `typeValeur` et le pré-filtrage**

Modifier la signature de `appliquerPlan` pour ajouter `typeValeur` :

```typescript
export const appliquerPlan = ({
  plan,
  rows,
  resolution,
  individusValides,
  typeValeur,
}: {
  plan: Plan
  rows: ReadonlyArray<Record<string, unknown>>
  resolution: ResolutionResult
  individusValides: ReadonlyArray<{ publicId: string }>
  typeValeur?: { colonne: string; typesValeurRetenus: ReadonlyArray<string> }
}): ResultatApplication => {
  const items: ItemNormalise[] = []
  const warnings: WarningApplication[] = []
```

Juste après la déclaration de `warnings` (et avant l'index mapping libellé→publicId), insérer la préparation du filtre + le court-circuit « aucun type retenu » :

```typescript
  const normaliserType = (valeur: unknown): string => safeStringify(valeur).trim().toLowerCase()

  // Filtrage optionnel par type de valeur (fichiers PPG : VI/VA/VC).
  let typesRetenusSet: Set<string> | null = null
  if (typeValeur) {
    if (typeValeur.typesValeurRetenus.length === 0) {
      // Aucune valeur d'avancement identifiée : on écarte tout, un seul warning global.
      warnings.push({
        code: 'LIGNE_IGNOREE',
        message:
          `Aucune valeur d'avancement n'a pu être identifiée dans la colonne « ${typeValeur.colonne} ». ` +
          `Aucune valeur n'a été importée.`,
        colonneSource: typeValeur.colonne,
      })
      return { items, warnings }
    }
    typesRetenusSet = new Set(typeValeur.typesValeurRetenus.map(normaliserType))
  }

  // Prédicat de rejet d'une ligne selon son type de valeur (émet un warning si rejetée).
  const ligneRejeteeParType = (row: Record<string, unknown>, index: number): boolean => {
    if (!typeValeur || !typesRetenusSet) return false
    if (typesRetenusSet.has(normaliserType(row[typeValeur.colonne]))) return false
    warnings.push({
      code: 'LIGNE_IGNOREE',
      message:
        `Ligne ${index} : valeur « ${safeStringify(row[typeValeur.colonne]).trim()} » écartée ` +
        `(colonne « ${typeValeur.colonne} ») — seules les valeurs d'avancement sont importées.`,
      ligneSource: index,
      colonneSource: typeValeur.colonne,
    })
    return true
  }
```

Dans la boucle `if (plan.layout === 'long')`, ajouter le filtre en tout premier de l'itération (avant le check libellé vide) :

```typescript
    for (const [index, row] of rows.entries()) {
      if (ligneRejeteeParType(row, index)) continue
      const libelle = safeStringify(row[plan.colonneIndividu]).trim()
```

Dans la boucle `// layout === 'pivot'`, ajouter de même le filtre en tout premier de l'itération :

```typescript
  for (const [index, row] of rows.entries()) {
    if (ligneRejeteeParType(row, index)) continue
    const libelle = safeStringify(row[plan.colonneIndividu]).trim()
```

- [ ] **Step 5: Lancer les tests et vérifier le succès**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/valeurImport/appliquerPlan.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/kpilote-api/src/valeurImport/appliquerPlan.ts apps/kpilote-api/src/valeurImport/appliquerPlan.test.ts
git commit -m "feat(import): filtrage des lignes non-VA dans appliquerPlan"
```

---

## Task 5 : Schéma partagé (`kpilote-shared`)

**Files:**
- Modify: `packages/kpilote-shared/src/valeurImport.ts`
- Test: `apps/kpilote-api/src/valeurImport/schemaPartage.test.ts` (colocalisé côté API car c'est là que tourne Vitest ; le package `kpilote-shared` n'a pas de runner)

**Interfaces:**
- Produces:
  - `normaliserPlanSchema` : `colonneTypeValeur?: { nom: string }` sur les deux layouts.
  - `normaliserWarningSchema` : code `'LIGNE_IGNOREE'` ajouté.
  - `normaliserValeursImportResponseApiModelSchema` : champ optionnel `resolutionTypeValeur: { colonne: string; typesValeurDistincts: string[]; typesValeurRetenus: string[] }`.

- [ ] **Step 1: Écrire le test qui échoue**

```typescript
// apps/kpilote-api/src/valeurImport/schemaPartage.test.ts
import {
  normaliserPlanSchema,
  normaliserValeursImportResponseApiModelSchema,
  normaliserWarningSchema,
} from '@pilote/kpilote-shared/valeurImport'
import { describe, expect, it } from 'vitest'

describe('schéma partagé — type de valeur', () => {
  it('le plan long accepte colonneTypeValeur', () => {
    const parsed = normaliserPlanSchema.safeParse({
      layout: 'long',
      colonneIndividu: 'zone_nom',
      colonneDate: { nom: 'date_valeur', format: 'iso' },
      colonneValeur: 'valeur',
      colonneTypeValeur: { nom: 'type_valeur' },
    })
    expect(parsed.success).toBe(true)
  })

  it('le warning accepte le code LIGNE_IGNOREE', () => {
    const parsed = normaliserWarningSchema.safeParse({
      code: 'LIGNE_IGNOREE',
      message: 'Ligne 2 : valeur « vc » écartée.',
    })
    expect(parsed.success).toBe(true)
  })

  it('la réponse accepte resolutionTypeValeur', () => {
    const parsed = normaliserValeursImportResponseApiModelSchema.safeParse({
      plan: {
        layout: 'long',
        colonneIndividu: 'zone_nom',
        colonneDate: { nom: 'date_valeur', format: 'iso' },
        colonneValeur: 'valeur',
        colonneTypeValeur: { nom: 'type_valeur' },
      },
      resolution: { mapping: [], nonResolus: [] },
      items: [],
      warnings: [],
      rapport: {
        totalLignes: 0,
        totalItemsProduits: 0,
        totalLibellesSources: 0,
        totalLibellesMappes: 0,
        totalLibellesNonResolus: 0,
      },
      resolutionTypeValeur: {
        colonne: 'type_valeur',
        typesValeurDistincts: ['vi', 'va', 'vc'],
        typesValeurRetenus: ['va'],
      },
    })
    expect(parsed.success).toBe(true)
  })
})
```

- [ ] **Step 2: Lancer le test et vérifier l'échec**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/valeurImport/schemaPartage.test.ts`
Expected: FAIL — le code `LIGNE_IGNOREE` est rejeté par l'enum actuel.

- [ ] **Step 3: Étendre le schéma partagé**

Dans `packages/kpilote-shared/src/valeurImport.ts`, ajouter le sous-schéma et le champ optionnel sur les deux plans :

```typescript
const colonneTypeValeurSchema = z.object({ nom: z.string() })

const planLongSchema = z.object({
  layout: z.literal('long'),
  colonneIndividu: z.string(),
  colonneDate: colonneDateSchema,
  colonneValeur: z.string(),
  colonneTypeValeur: colonneTypeValeurSchema.optional(),
})

const planPivotSchema = z.object({
  layout: z.literal('pivot'),
  colonneIndividu: z.string(),
  colonnesPivot: z.array(z.object({ nom: z.string(), dateIso: z.string() })).min(1),
  colonneTypeValeur: colonneTypeValeurSchema.optional(),
})
```

Ajouter `'LIGNE_IGNOREE'` à l'enum de `normaliserWarningSchema` :

```typescript
  code: z.enum([
    'INDIVIDU_NON_RESOLU',
    'INDIVIDU_HALLUCINE',
    'DATE_INVALIDE',
    'VALEUR_INVALIDE',
    'CELLULE_VIDE',
    'LIGNE_IGNOREE',
  ]),
```

Ajouter le champ optionnel à la réponse (après `rapport` dans `normaliserValeursImportResponseApiModelSchema`) :

```typescript
  resolutionTypeValeur: z
    .object({
      colonne: z.string(),
      typesValeurDistincts: z.array(z.string()),
      typesValeurRetenus: z.array(z.string()),
    })
    .optional(),
```

- [ ] **Step 4: Lancer le test et vérifier le succès**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/valeurImport/schemaPartage.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/kpilote-shared/src/valeurImport.ts apps/kpilote-api/src/valeurImport/schemaPartage.test.ts
git commit -m "feat(import): schéma partagé colonneTypeValeur + resolutionTypeValeur + LIGNE_IGNOREE"
```

---

## Task 6 : Orchestration (`normaliserValeursImport`)

**Files:**
- Modify: `apps/kpilote-api/src/valeurImport/commands/normaliserValeursImport.ts`

**Interfaces:**
- Consumes: `collecterValeursDistinctes` (Task 1), `resoudreTypeValeur` + `ResoudreTypeValeurError` (Task 3), le paramètre `typeValeur` d'`appliquerPlan` (Task 4), `okAsync` (neverthrow).
- Produces: `NormaliserValeursImportResult` gagne `resolutionTypeValeur?: { colonne: string; typesValeurDistincts: string[]; typesValeurRetenus: string[] }`. La passe 1b n'est appelée que si `plan.colonneTypeValeur` existe.

- [ ] **Step 1: Ajouter les imports et le type de résultat**

Dans `apps/kpilote-api/src/valeurImport/commands/normaliserValeursImport.ts` :

- Étendre l'import neverthrow pour inclure `okAsync` :

```typescript
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
```

- Ajouter les imports des nouvelles briques :

```typescript
import { collecterValeursDistinctes } from '@/valeurImport/helpers/collecterValeursDistinctes'
import {
  resoudreTypeValeur,
  type ResoudreTypeValeurError,
} from '@/valeurImport/calls/resoudreTypeValeur'
```

- Ajouter le champ optionnel au type `NormaliserValeursImportResult` (après `rapport`) :

```typescript
  resolutionTypeValeur?: {
    colonne: string
    typesValeurDistincts: string[]
    typesValeurRetenus: string[]
  }
```

- [ ] **Step 2: Ajouter le mapper d'erreur de la passe 1b**

Après `mapResolutionError`, ajouter :

```typescript
const mapTypeValeurError = (error: ResoudreTypeValeurError): NormaliserValeursImportError =>
  error.type === 'ALBERT_NON_CONFIGURE'
    ? { type: 'ALBERT_NON_CONFIGURE' }
    : { type: 'ALBERT_UNAVAILABLE', cause: error.cause }
```

- [ ] **Step 3: Brancher la passe 1b dans le flux**

Remplacer le bloc qui va de `const plan = decouverte.plan` jusqu'à la fin du `.map((resolution) => { … })` par :

```typescript
          const plan = decouverte.plan
          const libellesSources = extraireLibellesSources(rows, plan.colonneIndividu)

          // Passe 1b (conditionnelle) : résolution sémantique du type de valeur (fichiers PPG).
          const colonneTypeValeur = plan.colonneTypeValeur
          const etapeTypeValeur: ResultAsync<
            NormaliserValeursImportResult['resolutionTypeValeur'] | null,
            NormaliserValeursImportError
          > = colonneTypeValeur
            ? (() => {
                const colonne = colonneTypeValeur.nom
                const typesValeurDistincts = collecterValeursDistinctes({ rows, colonne })
                return resoudreTypeValeur({ colonne, typesValeurDistincts })
                  .mapErr(mapTypeValeurError)
                  .map((res) => ({
                    colonne,
                    typesValeurDistincts,
                    typesValeurRetenus: res.typesValeurRetenus,
                  }))
              })()
            : okAsync(null)

          return etapeTypeValeur.andThen((resolutionTypeValeur) =>
            resoudreIndividus({
              indicateur: { nom: indicateur.nom },
              individusValides: individus,
              libellesSources,
            })
              .mapErr(mapResolutionError)
              .map((resolution) => {
                const application = appliquerPlan({
                  plan,
                  rows,
                  resolution,
                  individusValides: individus,
                  ...(resolutionTypeValeur
                    ? {
                        typeValeur: {
                          colonne: resolutionTypeValeur.colonne,
                          typesValeurRetenus: resolutionTypeValeur.typesValeurRetenus,
                        },
                      }
                    : {}),
                })
                return {
                  plan,
                  resolution: {
                    mapping: [...resolution.mapping],
                    nonResolus: [...resolution.nonResolus],
                  },
                  items: application.items,
                  warnings: application.warnings,
                  rapport: {
                    totalLignes: rows.length,
                    totalItemsProduits: application.items.length,
                    totalLibellesSources: libellesSources.length,
                    totalLibellesMappes: resolution.mapping.length,
                    totalLibellesNonResolus: resolution.nonResolus.length,
                  },
                  ...(resolutionTypeValeur ? { resolutionTypeValeur } : {}),
                }
              }),
          )
```

- [ ] **Step 4: Vérifier le typecheck et la non-régression**

Run: `pnpm -F @pilote/kpilote-api exec tsc --noEmit`
Expected: aucune erreur.

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/valeurImport`
Expected: PASS (tous les tests du module, dont Tasks 1/2/4/5).

- [ ] **Step 5: Commit**

```bash
git add apps/kpilote-api/src/valeurImport/commands/normaliserValeursImport.ts
git commit -m "feat(import): branche la passe 1b de résolution du type de valeur"
```

---

## Task 7 : UI — bloc « Type de valeur » (`NormalisationReviewView`)

**Files:**
- Modify: `apps/kpilote-webapp/src/components/import-valeurs/NormalisationReviewView.tsx`

**Interfaces:**
- Consumes: `response.resolutionTypeValeur?` (optionnel, ajouté au schéma partagé Task 5) et les warnings `LIGNE_IGNOREE` déjà rendus par la liste existante.

Pas de test unitaire (aucun test de composant dans ce dossier ; vérification par typecheck + revue visuelle).

- [ ] **Step 1: Ajouter le bloc « Type de valeur » dans les détails**

Dans `NormalisationReviewView.tsx`, déstructurer le nouveau champ :

```typescript
  const { items, warnings, plan, resolution, rapport, resolutionTypeValeur } = response
```

Puis, à l'intérieur du `<CollapsibleContent>` → `<div className="mt-3 space-y-4 …">`, juste après le bloc `Structure détectée` (le `<div className="text-sm">` contenant `decrirePlan(plan)`), insérer :

```tsx
            {resolutionTypeValeur ? (
              <div className="text-sm">
                <div className="font-medium text-text">Type de valeur</div>
                <p className="mt-0.5 text-text-muted">
                  Colonne « {resolutionTypeValeur.colonne} » —{' '}
                  {resolutionTypeValeur.typesValeurRetenus.length > 0 ? (
                    <>
                      valeurs retenues :{' '}
                      <span className="font-mono text-text">
                        {resolutionTypeValeur.typesValeurRetenus.join(', ')}
                      </span>
                    </>
                  ) : (
                    <span className="text-accent-rouge">aucune valeur d'avancement identifiée</span>
                  )}
                  {resolutionTypeValeur.typesValeurDistincts.filter(
                    (valeur) => !resolutionTypeValeur.typesValeurRetenus.includes(valeur),
                  ).length > 0 ? (
                    <>
                      {' '}— écartées :{' '}
                      <span className="font-mono text-text-subtle">
                        {resolutionTypeValeur.typesValeurDistincts
                          .filter((valeur) => !resolutionTypeValeur.typesValeurRetenus.includes(valeur))
                          .join(', ')}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
            ) : null}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `pnpm -F @pilote/kpilote-webapp exec tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add apps/kpilote-webapp/src/components/import-valeurs/NormalisationReviewView.tsx
git commit -m "feat(import): bloc « Type de valeur » dans la revue de normalisation"
```

---

## Vérification finale

- [ ] `pnpm -F @pilote/kpilote-api exec vitest run src/valeurImport` → tous les tests passent.
- [ ] `pnpm -F @pilote/kpilote-api exec tsc --noEmit` → OK.
- [ ] `pnpm -F @pilote/kpilote-webapp exec tsc --noEmit` → OK.
- [ ] Revue visuelle : importer un fichier PPG (colonnes `identifiant_indic, zone_id, zone_nom, date_valeur, type_valeur, valeur`), vérifier que seules les lignes `va` produisent des valeurs, que le bloc « Type de valeur » s'affiche, et que les lignes VI/VC apparaissent en warnings.

## Notes de couverture (self-review)

- Spec §1 (schéma partagé) → Task 5. §2 (decouvrirStructure) → Task 2. §3 (resoudreTypeValeur, `generateObject` + exemples dans le prompt) → Task 3. §4 (orchestration) → Task 6. §5 (appliquerPlan filtrage + `LIGNE_IGNOREE`) → Task 4. §6 (aucune VA → tout écarter + warning global) → Task 4 (test « aucun type retenu »). §7 (UI) → Task 7. Modèle final inchangé → aucune tâche ne touche `ItemNormaliseApiModel`.
- **Écart assumé au spec §8 :** le spec suggérait un test mocké pour `resoudreTypeValeur`. Aligné sur l'absence de pattern de mock Albert dans le repo, cette passe n'a pas de test unitaire ; la logique testable (extraction du set, filtrage) est couverte par Tasks 1 et 4. À rediscuter si un pattern de mock `generateObject` est introduit.
