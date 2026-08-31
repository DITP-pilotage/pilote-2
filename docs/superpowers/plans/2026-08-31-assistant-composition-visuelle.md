# Assistant kpilote — composition visuelle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'assistant de composer une vue — jauges, courbes, tableaux, cartes — à partir d'un catalogue fermé de vignettes qui ne portent que des références, jamais de valeurs.

**Architecture:** Le catalogue vit dans `@pilote/kpilote-shared/assistant/vignettes` comme union discriminée zod : il est simultanément le schéma d'entrée du tool côté serveur et la table d'aiguillage côté front. Le tool `compose_vue` délègue à un sous-agent en sortie structurée, puis valide que chaque identifiant produit provient du contexte fourni. Le front dispatche sur un registre typé par l'union — ajouter une vignette au catalogue casse la compilation tant que son composant n'existe pas. Les composants existent déjà et chargent leurs propres données à partir des références.

**Tech Stack:** TypeScript, `zod` v4, `ai` v6 (Albert Etalab), React 19, TanStack Query, `@pilote/kpilote-ui`, `vitest`, `pnpm`.

**Spec:** `docs/superpowers/specs/2026-08-31-assistant-composition-visuelle-design.md`

**Prérequis :** le sous-projet 1 est livré. En particulier `KpiloteUITools`, `NOMS_OUTILS`, le registry d'outils, le mécanisme de sous-agent de `search_indicateurs` et le rendu de `AssistantMessage`.

## Global Constraints

- Gestionnaire de paquets : **`pnpm`** (v10). Jamais `npm`.
- Nommage : verbes et termes techniques en anglais, noms d'entités en français.
- `pnpm lint` avant chaque commit. Pas de `Co-Authored-By`.
- Pas de plan de tests pour les composants front.
- Tailwind et composants de `@pilote/kpilote-ui`, jamais de classes DSFR `fr-*`, jamais de couleur en dur. Le helper de composition de classes s'appelle `clsxm`.
- **Une vignette ne porte jamais de valeur chiffrée**, uniquement des références. C'est la garantie de factualité du sous-projet.
- Un enum dans le catalogue ne peut décrire qu'un **périmètre** (une largeur), jamais la **nature** de ce qui est affiché.
- Grille à six colonnes : `tiers` = 2, `moitie` = 3, `pleine` = 6. `CardGrid` de kpilote-ui ne convient pas, elle fixe trois colonnes sans contrôle de portée.
- Borne : 12 vignettes par vue.

---

## File Structure

**`packages/kpilote-shared/src/assistant/`**
- `vignettes.ts` — union discriminée `vignetteSchema`, `vueSchema`, types dérivés
- `tools.ts` *(modifié)* — `compose_vue` dans `NOMS_OUTILS`, `LIBELLES_OUTILS`, `KpiloteUITools`

**`apps/kpilote-api/src/assistant/`**
- `tools/metier/validerVue.ts` — validation des identifiants et du garde-fou chiffres
- `tools/metier/composeVue.ts` — le tool, son sous-agent, sa description
- `tools/metier/composeVuePrompt.ts` — prompt du sous-agent, catalogue et exemples
- `tools/registry.ts` *(modifié)* — enregistrement du tool
- `evals/cas.ts` *(modifié)* — trois cas

**`apps/kpilote-webapp/src/assistant/vignettes/`**
- `registre.tsx` — table typée vignette → composant
- `adaptateurs.tsx` — les trois composants qui exigent une prop dérivée
- `GrilleVue.tsx` — grille six colonnes, Suspense et frontière d'erreur par vignette
- `FrontiereErreurVignette.tsx` — composant de classe, ~25 lignes
- `AssistantMessage.tsx` *(modifié)* — dispatch sur `tool-compose_vue`

---

## Task 1: Le catalogue de vignettes

**Files:**
- Create: `packages/kpilote-shared/src/assistant/vignettes.ts`
- Test: `packages/kpilote-shared/src/assistant/vignettes.test.ts`
- Modify: `packages/kpilote-shared/package.json` — export `./assistant/vignettes`

**Interfaces:**
- Consumes: les quatre schémas de `./publicIds`
- Produces: `TYPES_VIGNETTE`, `type TypeVignette`, `vignetteSchema`, `type Vignette`, `vueSchema`, `type Vue`, `LARGEURS`, `type Largeur`, `COLONNES_PAR_LARGEUR`

- [ ] **Step 1: Write the failing test**

Create `packages/kpilote-shared/src/assistant/vignettes.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { COLONNES_PAR_LARGEUR, TYPES_VIGNETTE, vignetteSchema, vueSchema } from './vignettes'

const vignetteValide = {
  type: 'vignette_avancement_indicateur',
  indicateurId: 'IND-1',
  individuId: 'DEPT-84',
}

describe('vignetteSchema', () => {
  it('accepte une vignette dont les références sont bien formées', () => {
    const resultat = vignetteSchema.safeParse(vignetteValide)
    expect(resultat.success).toBe(true)
    expect(resultat.success && resultat.data.largeur).toBe('tiers')
  })

  it('rejette un identifiant incohérent avec le type de référence attendu', () => {
    expect(
      vignetteSchema.safeParse({ ...vignetteValide, indicateurId: 'COL-1' }).success,
    ).toBe(false)
  })

  it('exige le territoire : une donnée d’indicateur est toujours indexée par individu', () => {
    const { individuId, ...sansTerritoire } = vignetteValide
    expect(vignetteSchema.safeParse(sansTerritoire).success).toBe(false)
  })

  it('rejette un type de vignette hors catalogue', () => {
    expect(vignetteSchema.safeParse({ ...vignetteValide, type: 'vignette_camembert' }).success).toBe(
      false,
    )
  })

  it('n’expose aucun enum qui changerait la nature de ce qui est affiché', () => {
    // Seule `largeur` est un enum, et elle ne décrit qu'un périmètre d'affichage.
    const enumsAutorises = ['largeur']
    for (const type of TYPES_VIGNETTE) {
      const cas = vignetteSchema.options.find(
        (option) => option.shape.type.value === type,
      )
      const clesEnum = Object.entries(cas!.shape)
        .filter(([, valeur]) => 'options' in (valeur as object))
        .map(([cle]) => cle)
        .filter((cle) => cle !== 'type')
      expect(clesEnum.every((cle) => enumsAutorises.includes(cle))).toBe(true)
    }
  })
})

describe('vueSchema', () => {
  it('accepte une vue avec un titre et des vignettes', () => {
    expect(vueSchema.safeParse({ titre: 'Fraude fiscale', vignettes: [vignetteValide] }).success).toBe(
      true,
    )
  })

  it('rejette une vue vide', () => {
    expect(vueSchema.safeParse({ titre: 'Vide', vignettes: [] }).success).toBe(false)
  })

  it('borne une vue à douze vignettes', () => {
    const vignettes = Array.from({ length: 13 }, () => vignetteValide)
    expect(vueSchema.safeParse({ titre: 'Trop', vignettes }).success).toBe(false)
  })
})

describe('COLONNES_PAR_LARGEUR', () => {
  it('découpe une grille de six colonnes', () => {
    expect(COLONNES_PAR_LARGEUR).toEqual({ tiers: 2, moitie: 3, pleine: 6 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-shared test -- vignettes`
Expected: FAIL — `Failed to resolve import "./vignettes"`

- [ ] **Step 3: Write the implementation**

Create `packages/kpilote-shared/src/assistant/vignettes.ts`:

```ts
import { z } from 'zod'

import {
  collectionPublicIdSchema,
  indicateurPublicIdSchema,
  individuPublicIdSchema,
  referentielPublicIdSchema,
} from '../publicIds'

// Grille à six colonnes. `largeur` est le SEUL enum du catalogue, et il ne décrit qu'un
// périmètre d'affichage : un enum qui changerait la nature de ce qui est montré ferait
// confondre les vignettes au modèle, c'est le constat de ppg sur leur `kpi_card` paramétré.
export const LARGEURS = ['tiers', 'moitie', 'pleine'] as const
export type Largeur = (typeof LARGEURS)[number]

export const COLONNES_PAR_LARGEUR: Record<Largeur, number> = {
  tiers: 2,
  moitie: 3,
  pleine: 6,
}

const largeurSchema = z
  .enum(LARGEURS)
  .describe('Largeur occupée dans la grille : tiers, moitie ou pleine.')

// Toutes les données d'indicateur de kpilote sont indexées par individu : une vignette
// porte donc l'entité ET le territoire. C'est ce que le contexte `focus` + `cadrage` du
// contrat de surface fournit.
const refIndicateur = {
  indicateurId: indicateurPublicIdSchema,
  individuId: individuPublicIdSchema.describe('Territoire pour lequel la donnée est lue.'),
}

const refCollection = {
  collectionId: collectionPublicIdSchema,
  individuId: individuPublicIdSchema.describe('Territoire pour lequel la donnée est lue.'),
}

export const vignetteSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('vignette_avancement_indicateur'),
    ...refIndicateur,
    largeur: largeurSchema.default('tiers'),
  }),
  z.object({
    type: z.literal('vignette_courbe_indicateur'),
    ...refIndicateur,
    largeur: largeurSchema.default('moitie'),
  }),
  z.object({
    type: z.literal('vignette_tableau_valeurs_indicateur'),
    ...refIndicateur,
    largeur: largeurSchema.default('moitie'),
  }),
  z.object({
    type: z.literal('vignette_carte_indicateur'),
    indicateurId: indicateurPublicIdSchema,
    referentielId: referentielPublicIdSchema.describe(
      'Référentiel dont les individus sont cartographiés. Détermine la maille de la carte.',
    ),
    largeur: largeurSchema.default('moitie'),
  }),
  z.object({
    type: z.literal('vignette_avancement_collection'),
    ...refCollection,
    largeur: largeurSchema.default('tiers'),
  }),
  z.object({
    type: z.literal('vignette_taux_collection'),
    ...refCollection,
    largeur: largeurSchema.default('tiers'),
  }),
  z.object({
    type: z.literal('vignette_titre_section'),
    texte: z.string().min(1).max(80).describe('Titre court introduisant une section de la vue.'),
    largeur: largeurSchema.default('pleine'),
  }),
  z.object({
    type: z.literal('vignette_paragraphe'),
    // La SEULE vignette où le modèle écrit du contenu. Aucune valeur chiffrée : les chiffres
    // appartiennent aux autres vignettes, qui les lisent à la source.
    texte: z
      .string()
      .min(1)
      .max(400)
      .describe(
        'Texte de mise en contexte. Ne contient JAMAIS de valeur chiffrée ni de pourcentage.',
      ),
    largeur: largeurSchema.default('pleine'),
  }),
])

export type Vignette = z.infer<typeof vignetteSchema>
export type TypeVignette = Vignette['type']

export const TYPES_VIGNETTE = vignetteSchema.options.map(
  (option) => option.shape.type.value,
) as ReadonlyArray<TypeVignette>

export const MAX_VIGNETTES = 12

export const vueSchema = z.object({
  titre: z.string().min(1).max(80).describe('Titre de la vue.'),
  vignettes: z.array(vignetteSchema).min(1).max(MAX_VIGNETTES),
})

export type Vue = z.infer<typeof vueSchema>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-shared test -- vignettes`
Expected: PASS — 9 tests

- [ ] **Step 5: Déclarer l'export**

Dans `packages/kpilote-shared/package.json`, à la suite des autres entrées `./assistant/…` :

```json
    "./assistant/vignettes": {
      "types": "./src/assistant/vignettes.ts",
      "default": "./src/assistant/vignettes.ts"
    },
```

- [ ] **Step 6: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-shared lint
git add packages/kpilote-shared/src/assistant/vignettes.ts packages/kpilote-shared/src/assistant/vignettes.test.ts packages/kpilote-shared/package.json
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): catalogue de vignettes de composition visuelle"
```

---

## Task 2: Déclarer `compose_vue` dans le contrat d'outils

**Files:**
- Modify: `packages/kpilote-shared/src/assistant/tools.ts`
- Modify: `packages/kpilote-shared/src/assistant/tools.test.ts`

**Interfaces:**
- Consumes: `vueSchema`, `type Vue` (Task 1)
- Produces: `inputComposeVueSchema`, `type ComposeVueOutput` ; `compose_vue` ajouté à `NOMS_OUTILS`, `LIBELLES_OUTILS` et `KpiloteUITools`

- [ ] **Step 1: Adapter le test existant**

Dans `packages/kpilote-shared/src/assistant/tools.test.ts`, le catalogue passe de douze à treize outils :

```ts
  it('décrit treize outils aux noms uniques', () => {
    expect(NOMS_OUTILS).toHaveLength(13)
    expect(new Set(NOMS_OUTILS).size).toBe(13)
  })
```

Et ajouter un cas sur le schéma d'entrée :

```ts
describe('compose_vue', () => {
  it('exige au moins un territoire : sans lui, aucune donnée n’est lisible', () => {
    const base = { demande: 'montre-moi la progression', indicateurs: ['IND-1'] }
    expect(inputComposeVueSchema.safeParse(base).success).toBe(false)
    expect(inputComposeVueSchema.safeParse({ ...base, individus: ['DEPT-84'] }).success).toBe(true)
  })

  it('borne le contexte pour ne pas noyer le sous-agent', () => {
    expect(
      inputComposeVueSchema.safeParse({
        demande: 'tout',
        individus: ['DEPT-84'],
        indicateurs: Array.from({ length: 9 }, (_, index) => `IND-${index + 1}`),
      }).success,
    ).toBe(false)
  })
})
```

Ajouter `inputComposeVueSchema` à l'import en tête de fichier.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-shared test -- tools`
Expected: FAIL — `NOMS_OUTILS` en compte douze, `inputComposeVueSchema` n'existe pas

- [ ] **Step 3: Étendre `tools.ts`**

Ajouter à `NOMS_OUTILS`, après `'get_synthese_collection'` :

```ts
  'compose_vue',
```

Ajouter à `LIBELLES_OUTILS` :

```ts
  compose_vue: 'Composition de la vue',
```

Ajouter l'import du catalogue en tête de fichier :

```ts
import { vueSchema, type Vue } from './vignettes'
```

Puis le schéma d'entrée et le type de sortie, à la suite des autres :

```ts
export const inputComposeVueSchema = z.object({
  demande: z
    .string()
    .min(1)
    .describe("Ce que l'utilisateur veut voir, dans ses termes."),
  indicateurs: z.array(indicateurPublicIdSchema).max(8).default([]),
  collections: z.array(collectionPublicIdSchema).max(8).default([]),
  // Au moins un territoire : toute donnée d'indicateur de kpilote est indexée par individu.
  // Sans lui, il n'y a rien à afficher — l'agent doit demander plutôt que de choisir.
  individus: z.array(individuPublicIdSchema).min(1).max(4),
  referentiels: z.array(referentielPublicIdSchema).max(4).default([]),
})

/** La vue validée, plus la raison d'un refus éventuel que le modèle doit rapporter. */
export type ComposeVueOutput = Vue | { erreur: string }
```

Vérifier que `referentielPublicIdSchema` est bien importé depuis `../publicIds` ; sinon l'ajouter.

Enfin, l'entrée dans `KpiloteUITools` :

```ts
  compose_vue: {
    input: z.input<typeof inputComposeVueSchema>
    output: ComposeVueOutput
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-shared test -- tools vignettes`
Expected: PASS

- [ ] **Step 5: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-shared lint
git add packages/kpilote-shared/src/assistant
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): declare compose_vue dans le contrat d'outils"
```

---

## Task 3: Validation d'une vue composée

C'est le garde-fou qui rend l'invention sans effet — la généralisation du `validateDashboardIdentifiers` de ppg. Fonction pure, donc testable sans modèle.

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/metier/validerVue.ts`
- Test: `apps/kpilote-api/src/assistant/tools/metier/validerVue.test.ts`

**Interfaces:**
- Consumes: `type Vue`, `type Vignette` (Task 1)
- Produces: `type ContexteVue`, `validerVue(vue: Vue, contexte: ContexteVue): string[]`, `contientValeurChiffree(texte: string): boolean`

- [ ] **Step 1: Write the failing test**

Create `apps/kpilote-api/src/assistant/tools/metier/validerVue.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { contientValeurChiffree, validerVue } from '@/assistant/tools/metier/validerVue'

const contexte = {
  indicateurs: ['IND-1'],
  collections: ['COL-1'],
  individus: ['DEPT-84'],
  referentiels: ['REF-DEPT'],
}

const vue = (vignettes: unknown[]) => ({ titre: 'Vue', vignettes }) as never

describe('validerVue', () => {
  it('accepte une vue dont tous les identifiants proviennent du contexte', () => {
    const anomalies = validerVue(
      vue([
        { type: 'vignette_avancement_indicateur', indicateurId: 'IND-1', individuId: 'DEPT-84', largeur: 'tiers' },
      ]),
      contexte,
    )
    expect(anomalies).toEqual([])
  })

  it('rejette un indicateur absent du contexte, en le nommant', () => {
    const anomalies = validerVue(
      vue([
        { type: 'vignette_avancement_indicateur', indicateurId: 'IND-9', individuId: 'DEPT-84', largeur: 'tiers' },
      ]),
      contexte,
    )
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0]).toContain('IND-9')
  })

  it('rejette un territoire absent du contexte', () => {
    const anomalies = validerVue(
      vue([
        { type: 'vignette_taux_collection', collectionId: 'COL-1', individuId: 'DEPT-13', largeur: 'tiers' },
      ]),
      contexte,
    )
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0]).toContain('DEPT-13')
  })

  it('rejette un référentiel absent du contexte', () => {
    const anomalies = validerVue(
      vue([
        { type: 'vignette_carte_indicateur', indicateurId: 'IND-1', referentielId: 'REF-REG', largeur: 'moitie' },
      ]),
      contexte,
    )
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0]).toContain('REF-REG')
  })

  it('rejette un paragraphe qui contient un chiffre — la factualité ne se négocie pas', () => {
    const anomalies = validerVue(
      vue([{ type: 'vignette_paragraphe', texte: "L'avancement atteint 67 %.", largeur: 'pleine' }]),
      contexte,
    )
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0]).toContain('paragraphe')
  })

  it('laisse passer un paragraphe purement qualitatif', () => {
    const anomalies = validerVue(
      vue([
        { type: 'vignette_paragraphe', texte: 'La progression reste en deçà de la cible.', largeur: 'pleine' },
      ]),
      contexte,
    )
    expect(anomalies).toEqual([])
  })

  it('signale toutes les anomalies, pas seulement la première', () => {
    const anomalies = validerVue(
      vue([
        { type: 'vignette_avancement_indicateur', indicateurId: 'IND-9', individuId: 'DEPT-13', largeur: 'tiers' },
      ]),
      contexte,
    )
    expect(anomalies).toHaveLength(2)
  })
})

describe('contientValeurChiffree', () => {
  it('repère un pourcentage', () => {
    expect(contientValeurChiffree('atteint 67 %')).toBe(true)
    expect(contientValeurChiffree('atteint 67%')).toBe(true)
  })

  it('repère un nombre suivi d’une unité', () => {
    expect(contientValeurChiffree('12 500 logements')).toBe(true)
  })

  it('laisse passer une année ou un identifiant', () => {
    expect(contientValeurChiffree('depuis 2024')).toBe(false)
    expect(contientValeurChiffree('voir IND-1')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-api test -- validerVue`
Expected: FAIL — module introuvable

- [ ] **Step 3: Write the implementation**

Create `apps/kpilote-api/src/assistant/tools/metier/validerVue.ts`:

```ts
import { type Vignette, type Vue } from '@pilote/kpilote-shared/assistant/vignettes'

export type ContexteVue = {
  indicateurs: ReadonlyArray<string>
  collections: ReadonlyArray<string>
  individus: ReadonlyArray<string>
  referentiels: ReadonlyArray<string>
}

// Une année ou un identifiant ne sont pas des mesures. Ce qui est proscrit, c'est un nombre
// présenté comme une valeur : suivi d'un `%`, ou d'un mot qui en fait une quantité.
const ANNEE = /^(19|20)\d{2}$/u
const NOMBRE_SUIVI = /(\d[\d\s .,]*)\s*(%|[a-zà-ÿ]{2,})/giu

/**
 * Vrai si le texte présente un nombre comme une mesure. Le paragraphe est la seule vignette
 * où le modèle écrit ; y laisser passer un chiffre reviendrait à rouvrir la porte que tout
 * le reste du design ferme.
 */
export const contientValeurChiffree = (texte: string): boolean => {
  for (const correspondance of texte.matchAll(NOMBRE_SUIVI)) {
    const nombre = correspondance[1].replace(/[\s ]/gu, '')
    const suite = correspondance[2]
    if (suite === '%') return true
    if (ANNEE.test(nombre)) continue
    return true
  }
  return false
}

const referencesDeVignette = (
  vignette: Vignette,
): ReadonlyArray<{ cle: keyof ContexteVue; valeur: string; libelle: string }> => {
  const references: Array<{ cle: keyof ContexteVue; valeur: string; libelle: string }> = []
  if ('indicateurId' in vignette) {
    references.push({ cle: 'indicateurs', valeur: vignette.indicateurId, libelle: 'indicateur' })
  }
  if ('collectionId' in vignette) {
    references.push({ cle: 'collections', valeur: vignette.collectionId, libelle: 'collection' })
  }
  if ('individuId' in vignette) {
    references.push({ cle: 'individus', valeur: vignette.individuId, libelle: 'territoire' })
  }
  if ('referentielId' in vignette) {
    references.push({ cle: 'referentiels', valeur: vignette.referentielId, libelle: 'référentiel' })
  }
  return references
}

/**
 * Renvoie la liste des anomalies, vide si la vue est conforme. On les rend TOUTES : le
 * message est renvoyé au modèle, qui corrige en un tour plutôt qu'en autant de tours qu'il
 * y a de fautes.
 */
export const validerVue = (vue: Vue, contexte: ContexteVue): string[] => {
  const anomalies: string[] = []

  vue.vignettes.forEach((vignette, index) => {
    for (const reference of referencesDeVignette(vignette)) {
      if (!contexte[reference.cle].includes(reference.valeur)) {
        anomalies.push(
          `Vignette ${index + 1} : le ${reference.libelle} ${reference.valeur} ne fait pas partie du contexte fourni. Utilise uniquement les identifiants du contexte.`,
        )
      }
    }

    if (vignette.type === 'vignette_paragraphe' && contientValeurChiffree(vignette.texte)) {
      anomalies.push(
        `Vignette ${index + 1} : le paragraphe contient une valeur chiffrée. Les chiffres sont affichés par les autres vignettes, qui les lisent à la source. Reformule sans nombre.`,
      )
    }
  })

  return anomalies
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-api test -- validerVue`
Expected: PASS — 10 tests

- [ ] **Step 5: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/assistant/tools/metier/validerVue.ts apps/kpilote-api/src/assistant/tools/metier/validerVue.test.ts
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): validation d'une vue composee contre son contexte"
```

---

## Task 4: Le tool `compose_vue` et son sous-agent

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/metier/composeVuePrompt.ts`
- Create: `apps/kpilote-api/src/assistant/tools/metier/composeVue.ts`
- Test: `apps/kpilote-api/src/assistant/tools/metier/composeVue.test.ts`
- Modify: `apps/kpilote-api/src/assistant/tools/registry.ts`
- Modify: `apps/kpilote-api/src/assistant/tools/registry.test.ts`

**Interfaces:**
- Consumes: `validerVue`, `type ContexteVue` (Task 3) ; `vueSchema`, `inputComposeVueSchema`, `type ComposeVueOutput` (Tasks 1-2) ; `creerModeleAssistant`, `TEMPERATURE_STRUCTUREE`
- Produces: `composerVue(params): Promise<ComposeVueOutput>`, `creerComposeVueTool(): Tool`, `PROMPT_SOUS_AGENT`, `DESCRIPTION_COMPOSE_VUE`

- [ ] **Step 1: Write the failing test**

Create `apps/kpilote-api/src/assistant/tools/metier/composeVue.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

import { composerVue } from '@/assistant/tools/metier/composeVue'
import { DESCRIPTION_COMPOSE_VUE } from '@/assistant/tools/metier/composeVuePrompt'

const contexte = {
  demande: 'montre-moi la progression',
  indicateurs: ['IND-1'],
  collections: [],
  individus: ['DEPT-84'],
  referentiels: [],
}

const vueValide = {
  titre: 'Progression',
  vignettes: [
    {
      type: 'vignette_avancement_indicateur',
      indicateurId: 'IND-1',
      individuId: 'DEPT-84',
      largeur: 'tiers',
    },
  ],
}

describe('composerVue', () => {
  it('renvoie la vue quand elle est conforme', async () => {
    const composer = vi.fn(async () => vueValide)
    expect(await composerVue({ ...contexte, composer })).toEqual(vueValide)
    expect(composer).toHaveBeenCalledOnce()
  })

  it('relance une fois le sous-agent en lui nommant ses anomalies', async () => {
    const vueFautive = {
      titre: 'Progression',
      vignettes: [
        {
          type: 'vignette_avancement_indicateur',
          indicateurId: 'IND-9',
          individuId: 'DEPT-84',
          largeur: 'tiers',
        },
      ],
    }
    const composer = vi
      .fn()
      .mockResolvedValueOnce(vueFautive)
      .mockResolvedValueOnce(vueValide)

    expect(await composerVue({ ...contexte, composer })).toEqual(vueValide)
    expect(composer).toHaveBeenCalledTimes(2)
    expect(composer.mock.calls[1][0]).toContain('IND-9')
  })

  it('abandonne après une relance et renvoie une erreur lisible', async () => {
    const vueFautive = {
      titre: 'Progression',
      vignettes: [
        {
          type: 'vignette_avancement_indicateur',
          indicateurId: 'IND-9',
          individuId: 'DEPT-84',
          largeur: 'tiers',
        },
      ],
    }
    const composer = vi.fn(async () => vueFautive)

    const sortie = await composerVue({ ...contexte, composer })
    expect(sortie).toHaveProperty('erreur')
    expect(composer).toHaveBeenCalledTimes(2)
  })
})

describe('DESCRIPTION_COMPOSE_VUE', () => {
  it('porte le catalogue complet, que le modèle lit au moment de décider', () => {
    expect(DESCRIPTION_COMPOSE_VUE).toContain('vignette_avancement_indicateur')
    expect(DESCRIPTION_COMPOSE_VUE).toContain('vignette_carte_indicateur')
    expect(DESCRIPTION_COMPOSE_VUE).toContain('vignette_paragraphe')
  })

  it('porte des exemples concrets — ppg a mesuré qu’ils étaient nécessaires', () => {
    const exemples = DESCRIPTION_COMPOSE_VUE.match(/"vignettes"/gu) ?? []
    expect(exemples.length).toBeGreaterThanOrEqual(3)
  })

  it('dit explicitement qu’une vignette ne porte jamais de valeur', () => {
    expect(DESCRIPTION_COMPOSE_VUE.toLowerCase()).toContain('jamais de valeur')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-api test -- composeVue`
Expected: FAIL — modules introuvables

- [ ] **Step 3: Écrire `composeVuePrompt.ts`**

```ts
// Tout le savoir de composition vit ICI, dans la description du tool et le prompt du
// sous-agent — pas dans le prompt système. C'est la meilleure décision rétrospective de ppg
// (commit 6138cbd69) : DRY, localité au moment de la décision d'appel, et un prompt système
// qui n'embarque pas à chaque tour un savoir qui ne sert qu'ici.

const CATALOGUE = `| Vignette | Ce qu'elle montre | Références obligatoires | Largeur par défaut |
|---|---|---|---|
| \`vignette_avancement_indicateur\` | La dernière valeur d'un indicateur pour un territoire | indicateurId, individuId | tiers |
| \`vignette_courbe_indicateur\` | L'évolution des valeurs dans le temps | indicateurId, individuId | moitie |
| \`vignette_tableau_valeurs_indicateur\` | Les valeurs datées, en tableau | indicateurId, individuId | moitie |
| \`vignette_carte_indicateur\` | La répartition d'un indicateur sur une carte | indicateurId, referentielId | moitie |
| \`vignette_avancement_collection\` | La progression d'une collection pour un territoire | collectionId, individuId | tiers |
| \`vignette_taux_collection\` | Le taux d'avancement d'une collection | collectionId, individuId | tiers |
| \`vignette_titre_section\` | Un titre introduisant une section | texte | pleine |
| \`vignette_paragraphe\` | Une phrase de mise en contexte | texte | pleine |`

const REGLES = `Règles :
- Une vignette ne contient JAMAIS de valeur chiffrée, uniquement des références. Les chiffres sont lus à l'affichage.
- N'utilise QUE les identifiants présents dans le contexte. N'en invente jamais, n'en déduis jamais.
- \`vignette_paragraphe\` est la seule où tu écris du texte, et il doit être purement qualitatif : aucun nombre, aucun pourcentage.
- La grille fait six colonnes : tiers en occupe 2, moitie 3, pleine 6. Compose des rangées qui se remplissent.
- Commence par un \`vignette_titre_section\` quand la vue couvre plusieurs sujets.
- Au maximum 12 vignettes. Préfère une vue courte et lisible à un inventaire.`

const EXEMPLES = `Exemples. Les identifiants y sont illustratifs : remplace-les par ceux du contexte.

Point sur un indicateur pour un territoire :
{"titre":"Fraude fiscale — Vaucluse","vignettes":[{"type":"vignette_titre_section","texte":"Fraude fiscale en Vaucluse","largeur":"pleine"},{"type":"vignette_avancement_indicateur","indicateurId":"IND-1","individuId":"DEPT-84","largeur":"tiers"},{"type":"vignette_courbe_indicateur","indicateurId":"IND-1","individuId":"DEPT-84","largeur":"moitie"},{"type":"vignette_tableau_valeurs_indicateur","indicateurId":"IND-1","individuId":"DEPT-84","largeur":"pleine"}]}

Comparaison d'un indicateur sur plusieurs territoires :
{"titre":"Fraude fiscale — comparaison","vignettes":[{"type":"vignette_titre_section","texte":"Comparaison territoriale","largeur":"pleine"},{"type":"vignette_avancement_indicateur","indicateurId":"IND-1","individuId":"DEPT-84","largeur":"tiers"},{"type":"vignette_avancement_indicateur","indicateurId":"IND-1","individuId":"DEPT-13","largeur":"tiers"},{"type":"vignette_avancement_indicateur","indicateurId":"IND-1","individuId":"DEPT-06","largeur":"tiers"},{"type":"vignette_carte_indicateur","indicateurId":"IND-1","referentielId":"REF-DEPT","largeur":"pleine"}]}

Point sur une collection :
{"titre":"Sécurité — Vaucluse","vignettes":[{"type":"vignette_titre_section","texte":"Collection Sécurité","largeur":"pleine"},{"type":"vignette_taux_collection","collectionId":"COL-1","individuId":"DEPT-84","largeur":"moitie"},{"type":"vignette_avancement_collection","collectionId":"COL-1","individuId":"DEPT-84","largeur":"moitie"}]}`

export const DESCRIPTION_COMPOSE_VUE = `Compose une vue visuelle — jauges, courbes, tableaux, cartes — au lieu de décrire les chiffres en prose.

Utilise cet outil quand l'utilisateur demande à voir, visualiser, afficher, comparer visuellement, ou demande un tableau de bord.

Il te faut au moins un territoire (\`individus\`) : toute donnée d'indicateur de kpilote est lue pour un territoire donné. Si tu n'en as pas, NE COMPOSE PAS — demande lequel à l'utilisateur.

${CATALOGUE}

${REGLES}

Après composition, dis une phrase d'introduction courte. Ne reproduis aucune valeur chiffrée dans ta réponse : elles sont affichées par la vue.`

export const PROMPT_SOUS_AGENT = `Tu composes une vue kpilote à partir d'un catalogue fermé de vignettes.

Tu ne charges aucune donnée et tu n'écris aucun chiffre : tu choisis des vignettes et tu les disposes.

${CATALOGUE}

${REGLES}

${EXEMPLES}`
```

- [ ] **Step 4: Écrire `composeVue.ts`**

```ts
import {
  inputComposeVueSchema,
  type ComposeVueOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { vueSchema, type Vue } from '@pilote/kpilote-shared/assistant/vignettes'
import { generateText, Output, stepCountIs, tool, type Tool } from 'ai'

import {
  DESCRIPTION_COMPOSE_VUE,
  PROMPT_SOUS_AGENT,
} from '@/assistant/tools/metier/composeVuePrompt'
import { validerVue, type ContexteVue } from '@/assistant/tools/metier/validerVue'
import { creerModeleAssistant, TEMPERATURE_STRUCTUREE } from '@/assistant/runtime/modele'
import { logger } from '@/framework/logger/logger'

export type Compositeur = (prompt: string) => Promise<Vue>

const construirePrompt = (
  demande: string,
  contexte: ContexteVue,
  anomalies: ReadonlyArray<string>,
): string => {
  const lignes = [
    demande,
    '',
    '<contexte>',
    `indicateurs: ${JSON.stringify(contexte.indicateurs)}`,
    `collections: ${JSON.stringify(contexte.collections)}`,
    `individus: ${JSON.stringify(contexte.individus)}`,
    `referentiels: ${JSON.stringify(contexte.referentiels)}`,
    '</contexte>',
  ]
  if (anomalies.length > 0) {
    lignes.push('', 'Ta proposition précédente a été rejetée :', ...anomalies.map((a) => `- ${a}`))
  }
  return lignes.join('\n')
}

/**
 * Compose puis valide. Une seule relance : au-delà, on rend la main au modèle principal avec
 * une erreur lisible plutôt que de brûler des tours. ppg fait le même choix — leur PRD note
 * qu'un retry consomme une étape de l'agent.
 */
export const composerVue = async ({
  demande,
  indicateurs,
  collections,
  individus,
  referentiels,
  composer,
}: ContexteVue & { demande: string; composer: Compositeur }): Promise<ComposeVueOutput> => {
  const contexte: ContexteVue = { indicateurs, collections, individus, referentiels }
  let anomalies: string[] = []

  for (let tentative = 0; tentative < 2; tentative += 1) {
    const vue = await composer(construirePrompt(demande, contexte, anomalies))
    anomalies = validerVue(vue, contexte)
    if (anomalies.length === 0) return vue

    logger.info(
      { event: 'assistant.composeVue.rejet', tentative: tentative + 1, anomalies },
      'Composition de vue rejetée',
    )
  }

  return {
    erreur: `La vue n'a pas pu être composée : ${anomalies.join(' ')} Explique à l'utilisateur que l'affichage a échoué et propose de reformuler.`,
  }
}

export const creerCompositeurLlm =
  (abortSignal?: AbortSignal): Compositeur =>
  async (prompt) => {
    const sortie = await generateText({
      model: creerModeleAssistant(),
      system: PROMPT_SOUS_AGENT,
      prompt,
      output: Output.object({ schema: vueSchema }),
      stopWhen: stepCountIs(3),
      temperature: TEMPERATURE_STRUCTUREE,
      abortSignal,
    })
    return sortie.output
  }

export const creerComposeVueTool = (): Tool =>
  tool({
    description: DESCRIPTION_COMPOSE_VUE,
    inputSchema: inputComposeVueSchema,
    execute: async (entree, { abortSignal }): Promise<ComposeVueOutput> =>
      composerVue({ ...entree, composer: creerCompositeurLlm(abortSignal) }),
  })
```

- [ ] **Step 5: Enregistrer le tool**

Dans `apps/kpilote-api/src/assistant/tools/registry.ts`, ajouter l'import puis l'entrée métier :

```ts
import { creerComposeVueTool } from '@/assistant/tools/metier/composeVue'
```

```ts
    compose_vue: creerComposeVueTool(),
```

Et ajouter `'compose_vue'` à la liste `OUTILS_PAR_SURFACE['ask-libre']`.

Dans `registry.test.ts`, le compte passe de douze à treize :

```ts
  it('expose treize outils pour la surface ask-libre', () => {
    expect(Object.keys(resoudreOutils('ask-libre', requeteur))).toHaveLength(13)
  })
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @pilote/kpilote-api test -- composeVue registry`
Expected: PASS

- [ ] **Step 7: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/assistant/tools
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): tool compose_vue et son sous-agent de composition"
```

---

## Task 5: Le registre de vignettes côté front

**Files:**
- Create: `apps/kpilote-webapp/src/assistant/vignettes/adaptateurs.tsx`
- Create: `apps/kpilote-webapp/src/assistant/vignettes/registre.tsx`
- Test: `apps/kpilote-webapp/src/assistant/vignettes/registre.test.ts`

**Interfaces:**
- Consumes: `type Vignette`, `type TypeVignette`, `TYPES_VIGNETTE` (Task 1) ; les composants existants
- Produces: `REGISTRE_VIGNETTES`

- [ ] **Step 1: Write the failing test**

Create `apps/kpilote-webapp/src/assistant/vignettes/registre.test.ts`:

```ts
import { TYPES_VIGNETTE } from '@pilote/kpilote-shared/assistant/vignettes'
import { describe, expect, it } from 'vitest'

import { REGISTRE_VIGNETTES } from './registre'

describe('REGISTRE_VIGNETTES', () => {
  it('couvre exactement le catalogue partagé', () => {
    expect(Object.keys(REGISTRE_VIGNETTES).sort()).toEqual([...TYPES_VIGNETTE].sort())
  })

  it('associe un composant à chaque vignette', () => {
    expect(Object.values(REGISTRE_VIGNETTES).every((rendu) => typeof rendu === 'function')).toBe(
      true,
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-webapp test -- registre`
Expected: FAIL — module introuvable

- [ ] **Step 3: Écrire `adaptateurs.tsx`**

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'

import { IndicateurAvancement } from '@/components/indicateurs/IndicateurAvancement'
import { IndicateurValeursChart } from '@/components/indicateurs/IndicateurValeursChart'
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer'
import { indicateurQueryOptions } from '@/queries/indicateurs'
import { referentielQueryOptions } from '@/queries/referentiels'

// La plupart des composants se branchent directement : ils ne prennent que des références et
// chargent leurs propres données. Seuls ceux qui exigent une prop dérivée ont besoin d'un
// adaptateur, et il tient en quelques lignes.

export function AdaptateurAvancementIndicateur({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(indicateurId))
  return (
    <IndicateurAvancement
      indicateurId={indicateurId}
      individuId={individuId}
      unite={indicateur.unite}
    />
  )
}

export function AdaptateurCourbeIndicateur({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(indicateurId))
  return (
    <IndicateurValeursChart
      indicateurId={indicateurId}
      individuId={individuId}
      unite={indicateur.unite}
    />
  )
}

/**
 * La maille de la carte est portée par le référentiel, qui déclare sa configuration de
 * cartographie. On réutilise `WidgetRenderer` plutôt que de dupliquer ce choix.
 */
export function AdaptateurCarteIndicateur({
  indicateurId,
  referentielId,
}: {
  indicateurId: string
  referentielId: string
}) {
  const { data: referentiel } = useSuspenseQuery(referentielQueryOptions(referentielId))
  const widget = referentiel.widgets[0]
  if (!widget) return null
  return <WidgetRenderer widget={widget} indicateurId={indicateurId} referentielId={referentielId} />
}
```

> Vérifier le nom réel du champ portant l'unité sur `IndicateurApiModel` et la forme de `referentiel.widgets` — les deux sont typés, le compilateur le dira.

- [ ] **Step 4: Écrire `registre.tsx`**

```tsx
import type { TypeVignette, Vignette } from '@pilote/kpilote-shared/assistant/vignettes'
import { Heading, Text } from '@pilote/kpilote-ui/Typography'
import type { ReactNode } from 'react'

import { CollectionAvancement } from '@/components/collections/CollectionAvancement'
import { CollectionTauxProgression } from '@/components/collections/CollectionTauxProgression'
import { IndicateurValeursTable } from '@/components/indicateurs/IndicateurValeursTable'

import {
  AdaptateurAvancementIndicateur,
  AdaptateurCarteIndicateur,
  AdaptateurCourbeIndicateur,
} from './adaptateurs'

type Rendu<T extends TypeVignette> = (vignette: Extract<Vignette, { type: T }>) => ReactNode

// Le mapped type sur l'union impose une entrée par vignette : ajouter un cas au catalogue
// partagé casse la compilation ici tant que son composant n'existe pas. C'est ce que le
// `Record<string, …>` de `WidgetRenderer` ne garantit pas.
export const REGISTRE_VIGNETTES: { [T in TypeVignette]: Rendu<T> } = {
  vignette_avancement_indicateur: (vignette) => (
    <AdaptateurAvancementIndicateur
      indicateurId={vignette.indicateurId}
      individuId={vignette.individuId}
    />
  ),
  vignette_courbe_indicateur: (vignette) => (
    <AdaptateurCourbeIndicateur
      indicateurId={vignette.indicateurId}
      individuId={vignette.individuId}
    />
  ),
  vignette_tableau_valeurs_indicateur: (vignette) => (
    <IndicateurValeursTable
      indicateurId={vignette.indicateurId}
      individuId={vignette.individuId}
    />
  ),
  vignette_carte_indicateur: (vignette) => (
    <AdaptateurCarteIndicateur
      indicateurId={vignette.indicateurId}
      referentielId={vignette.referentielId}
    />
  ),
  vignette_avancement_collection: (vignette) => (
    <CollectionAvancement collectionId={vignette.collectionId} individuId={vignette.individuId} />
  ),
  vignette_taux_collection: (vignette) => (
    <CollectionTauxProgression
      collectionId={vignette.collectionId}
      individu={vignette.individuId}
    />
  ),
  vignette_titre_section: (vignette) => <Heading as="h3">{vignette.texte}</Heading>,
  vignette_paragraphe: (vignette) => <Text>{vignette.texte}</Text>,
}
```

> `Heading` accepte un niveau ; vérifier sa signature réelle dans `packages/kpilote-ui/src/Typography.tsx` et l'ajuster.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-webapp test -- registre`
Expected: PASS — 2 tests

- [ ] **Step 6: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-webapp lint
git add apps/kpilote-webapp/src/assistant/vignettes
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): registre de vignettes avec exhaustivite verifiee"
```

---

## Task 6: Le rendu de la vue

**Files:**
- Create: `apps/kpilote-webapp/src/assistant/vignettes/FrontiereErreurVignette.tsx`
- Create: `apps/kpilote-webapp/src/assistant/vignettes/GrilleVue.tsx`
- Modify: `apps/kpilote-webapp/src/assistant/AssistantMessage.tsx`

**Interfaces:**
- Consumes: `REGISTRE_VIGNETTES` (Task 5), `COLONNES_PAR_LARGEUR`, `type Vue` (Task 1)
- Produces: `<GrilleVue vue={…} />`

- [ ] **Step 1: Écrire la frontière d'erreur**

```tsx
import { Callout } from '@pilote/kpilote-ui/Callout'
import { Component, type ReactNode } from 'react'

// Composant de classe custom plutôt qu'une dépendance pour vingt-cinq lignes — ppg a fait le
// même arbitrage. Une vignette en échec ne doit pas emporter la vue entière.
export class FrontiereErreurVignette extends Component<
  { children: ReactNode },
  { enErreur: boolean }
> {
  state = { enErreur: false }

  static getDerivedStateFromError() {
    return { enErreur: true }
  }

  render() {
    if (this.state.enErreur) {
      return <Callout tone="warning">Cette vignette n'a pas pu être affichée.</Callout>
    }
    return this.props.children
  }
}
```

> Vérifier les props réelles de `Callout` dans `packages/kpilote-ui/src/Callout.tsx`.

- [ ] **Step 2: Écrire la grille**

```tsx
import {
  COLONNES_PAR_LARGEUR,
  type Vignette,
  type Vue,
} from '@pilote/kpilote-shared/assistant/vignettes'
import { Heading } from '@pilote/kpilote-ui/Typography'
import { Suspense } from 'react'

import { clsxm } from '@/lib/clsxm'

import { FrontiereErreurVignette } from './FrontiereErreurVignette'
import { REGISTRE_VIGNETTES } from './registre'

// Grille propre à l'assistant : `CardGrid` de kpilote-ui fixe trois colonnes sans contrôle de
// portée, elle ne peut pas porter tiers / moitie / pleine.
const PORTEES: Record<number, string> = {
  2: 'sm:col-span-3 lg:col-span-2',
  3: 'sm:col-span-6 lg:col-span-3',
  6: 'col-span-6',
}

const rendre = (vignette: Vignette) => {
  // Le registre est indexé par le type ; l'union garantit que la vignette correspond.
  const rendu = REGISTRE_VIGNETTES[vignette.type] as (v: Vignette) => React.ReactNode
  return rendu(vignette)
}

export function GrilleVue({ vue }: { vue: Vue }) {
  return (
    <section aria-label={vue.titre} className="mt-4">
      <Heading as="h3">{vue.titre}</Heading>
      <div className="mt-3 grid grid-cols-6 gap-4">
        {vue.vignettes.map((vignette, index) => (
          <div
            key={index}
            className={clsxm('min-w-0', PORTEES[COLONNES_PAR_LARGEUR[vignette.largeur]])}
          >
            <FrontiereErreurVignette>
              <Suspense fallback={<div className="h-24 animate-pulse rounded bg-border" />}>
                {rendre(vignette)}
              </Suspense>
            </FrontiereErreurVignette>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Brancher dans `AssistantMessage`**

Dans `apps/kpilote-webapp/src/assistant/AssistantMessage.tsx`, avant le cas générique `part.type.startsWith('tool-')` :

```tsx
        // Part typée grâce à `KpiloteUITools` : `part.output` est `Vue | { erreur }`.
        if (part.type === 'tool-compose_vue' && part.state === 'output-available') {
          if ('erreur' in part.output) return null
          return <GrilleVue key={index} vue={part.output} />
        }
```

Ajouter l'import de `GrilleVue`. Le cas d'erreur ne rend rien : le modèle reçoit le message et l'explique lui-même dans sa réponse texte.

- [ ] **Step 4: Vérifier**

Run: `pnpm --filter @pilote/kpilote-webapp lint`
Expected: PASS

Puis à la main : demander « montre-moi IND-1 sur DEPT-84 » et vérifier que la vue s'affiche, que chaque vignette charge indépendamment, et qu'une vignette en erreur n'emporte pas les autres.

- [ ] **Step 5: Commit**

```bash
git add apps/kpilote-webapp/src/assistant
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): rendu de la vue composee en grille six colonnes"
```

---

## Task 7: Cas d'évaluation

**Files:**
- Modify: `apps/kpilote-api/src/assistant/evals/cas.ts`

**Interfaces:**
- Consumes: `type CasEval`

- [ ] **Step 1: Étendre le type d'attendu**

Dans `apps/kpilote-api/src/assistant/evals/cas.ts`, ajouter au bloc `attendu` :

```ts
    /** Types de vignette qui doivent figurer dans la vue composée. */
    vignettesContiennent?: ReadonlyArray<string>
    /** Nombre minimal de vignettes distinctes portant un territoire différent. */
    territoiresDistincts?: number
```

- [ ] **Step 2: Ajouter les trois cas**

```ts
  {
    nom: 'composition avec entité et territoire fournis',
    question: 'montre-moi IND-1 sur DEPT-84',
    surface: 'ask-libre',
    attendu: {
      outilsAppeles: ['compose_vue'],
      vignettesContiennent: ['vignette_avancement_indicateur'],
    },
  },
  {
    nom: 'comparaison : une vignette par territoire',
    question: 'compare IND-1 entre DEPT-84 et DEPT-13',
    surface: 'ask-libre',
    attendu: {
      outilsAppeles: ['compose_vue'],
      territoiresDistincts: 2,
    },
  },
  {
    // Le cas le plus important : composer sur un territoire choisi au hasard serait pire
    // que ne rien afficher.
    nom: 'sans territoire, l’assistant demande au lieu de composer',
    question: 'montre-moi la fraude fiscale',
    surface: 'ask-libre',
    attendu: {
      outilsInterdits: ['compose_vue'],
    },
  },
```

- [ ] **Step 3: Étendre l'exécuteur**

Dans `apps/kpilote-api/src/assistant/evals/executer.ts`, après les vérifications existantes :

```ts
  const vues = resultat.steps
    .flatMap((etape) => etape.toolResults)
    .filter((appel) => appel.toolName === 'compose_vue')
    .map((appel) => appel.output as { vignettes?: Array<Record<string, unknown>> })
    .filter((sortie) => Array.isArray(sortie.vignettes))

  const vignettes = vues.flatMap((vue) => vue.vignettes ?? [])

  for (const attendue of attendu.vignettesContiennent ?? []) {
    if (!vignettes.some((vignette) => vignette.type === attendue)) {
      details.push(`vignette manquante : ${attendue}`)
    }
  }
  if (attendu.territoiresDistincts !== undefined) {
    const territoires = new Set(
      vignettes.map((vignette) => vignette.individuId).filter((valeur) => typeof valeur === 'string'),
    )
    if (territoires.size < attendu.territoiresDistincts) {
      details.push(
        `${attendu.territoiresDistincts} territoires attendus, ${territoires.size} trouvé(s)`,
      )
    }
  }
```

- [ ] **Step 4: Vérifier**

Run: `pnpm --filter @pilote/kpilote-api lint`
Expected: PASS

Puis, avec `EVAL_API_KEY` renseignée et un jeu de données de recette : `pnpm --filter @pilote/kpilote-api eval`

- [ ] **Step 5: Commit**

```bash
git add apps/kpilote-api/src/assistant/evals
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): cas d'evaluation de la composition visuelle"
```
