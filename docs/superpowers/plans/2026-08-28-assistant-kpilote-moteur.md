# Assistant kpilote — moteur et surface `ask-libre` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer un moteur d'assistant conversationnel dans `kpilote-api`, atteignable par une surface déclarée, avec des outils dérivés de l'OpenAPI et des outils métier composés, un typage d'outils partagé de bout en bout, et un panneau de sources dérivé des identifiants publics.

**Architecture:** Le contrat (surfaces, entrées et sorties d'outils, format de message, sources) vit dans `@pilote/kpilote-shared/assistant`. Le moteur vit dans `apps/kpilote-api/src/assistant/` : il compose un prompt en trois couches, résout les outils autorisés par la surface, streame via le SDK `ai`, puis extrait et résout les sources. Les outils reçoivent par **injection** une fonction de requête in-process, ce qui applique la chaîne de middlewares — donc les habilitations — sans créer de cycle d'import ni masquer les fixtures en test. Le front consomme le flux via `@ai-sdk/react`, avec des parts d'outil typées.

**Tech Stack:** TypeScript, Hono + `@hono/zod-openapi`, Prisma 7, `ai` v6 + `@ai-sdk/openai` (provider Albert Etalab), `neverthrow`, `zod` v4, `vitest`, React 19 + TanStack Router, `pnpm`.

**Spec:** `docs/superpowers/specs/2026-08-28-assistant-kpilote-design.md`

## Global Constraints

- Gestionnaire de paquets : **`pnpm`** (v10). Jamais `npm`.
- Nommage : **verbes et termes techniques en anglais, noms d'entités en français** (`getSyntheseIndicateur`, `listIndicateurs`).
- `apps/kpilote-api/tsconfig.json` mappe `@/` **par dossier explicite** : tout nouveau sous-système exige son entrée dans `paths`.
- Prisma : après `prisma migrate dev`, relancer **`pnpm prisma:generate`** (le script porte `--sql`).
- Ne rien manipuler sur les conteneurs Docker de la base : demander à l'utilisateur de confirmer que Docker tourne.
- `pnpm lint` avant chaque commit (`eslint` + `tsc --noEmit` + `prettier --check`).
- Pas de `Co-Authored-By` dans les commits.
- Pas de plan de tests pour les composants front.
- Provider LLM : `https://albert.api.etalab.gouv.fr/v1`, clé dans `env.ALBERT_API_KEY` (déjà déclarée, `optional()`).
- Modèles autorisés : `openweight-large` (défaut) et `openweight-medium`.
- Borne d'exécution du modèle : `stepCountIs(12)` pour la surface `ask-libre`.
- Bornes de recherche : 60 candidats après pré-filtre, 300 entrées pour le repli sémantique.
- `pageSizeSchema` de `kpilote-shared/pagination.ts` est plafonné à **100** : aucun appel ne doit demander davantage.
- Rétention des conversations : 14 jours.

---

## File Structure

**`packages/kpilote-shared/src/assistant/`** — contrat, sans dépendance runtime
- `sources.ts` — types `ReferenceSource` / `Source`, extraction guidée par les clés
- `surfaces.ts` — `SURFACES`, `MODELES`, `contexteEntiteSchema`, `chatRequestSchema`
- `tools.ts` — `NOMS_OUTILS`, schémas d'entrée, types de sortie, `KpiloteUITools`, `LIBELLES_OUTILS`
- `message.ts` — `KpiloteUIMessage`
- `feedback.ts` — `evaluerBodySchema`, catégories

**`apps/kpilote-api/src/assistant/`** — moteur
- `routes.ts` — `POST /assistant/chat`, `POST /assistant/conversations/{id}/evaluation`
- `runtime/modele.ts` — provider, modèle par défaut, bornes
- `runtime/AssistantRuntime.ts` — orchestration d'un tour
- `runtime/sources.ts` — résolution des références en sources
- `prompts/socle.ts`, `prompts/runtime.ts`, `prompts/surfaces/askLibre.ts`, `prompts/construireSystemPrompt.ts`
- `tools/requeteur.ts` — type `Requeteur` et sa construction depuis une app Hono
- `tools/deriverTool.ts` — `createRoute` → `tool`
- `tools/whitelist.ts` — routes exposées et nom d'outil
- `tools/metier/prefiltrer.ts` — normalisation et pré-filtre déterministe
- `tools/metier/searchIndicateurs.ts`, `searchCollections.ts`
- `tools/metier/getSyntheseIndicateur.ts`, `getSyntheseCollection.ts`
- `tools/registry.ts` — assemblage par surface
- `commands/enregistrerConversation.ts`, `commands/evaluerReponse.ts`
- `evals/cas.ts`, `evals/executer.ts`

**`apps/kpilote-webapp/src/assistant/`** — surfaces
- `useAssistant.ts`, `AssistantPanel.tsx`, `AssistantMessage.tsx`, `PanneauSources.tsx`, `BarreFeedback.tsx`, `nettoyerPseudoAppels.ts`
- `src/components/command-palette/useAssistantCommand.ts`

**Modifications**
- `packages/kpilote-shared/package.json` — 5 entrées `exports`, `ai` en `peerDependencies`
- `packages/kpilote-shared/src/collection.ts` — ajout du filtre `ids` par symétrie avec les indicateurs
- `apps/kpilote-api/src/collection/queries/listCollections.ts` — prise en compte de `ids`
- `apps/kpilote-api/tsconfig.json` — `"@/assistant/*"`
- `apps/kpilote-api/src/app.ts` — `app.route('/', assistantRoutes)`
- `apps/kpilote-api/prisma/schema.prisma` — 2 modèles, 2 enums
- 4 fichiers `routes.ts` — export de 8 `createRoute` aujourd'hui module-locaux

---

## Task 1: Extraction des références dans `kpilote-shared`

**Files:**
- Create: `packages/kpilote-shared/src/assistant/sources.ts`
- Test: `packages/kpilote-shared/src/assistant/sources.test.ts`
- Modify: `packages/kpilote-shared/package.json`

**Interfaces:**
- Consumes: `indicateurPublicIdSchema`, `collectionPublicIdSchema`, `referentielPublicIdSchema`, `individuPublicIdSchema` depuis `./publicIds`
- Produces: `type TypeSource`, `type ReferenceSource`, `type Source`, `extraireReferences(valeur: unknown): ReferenceSource[]`

- [ ] **Step 1: Write the failing test**

Create `packages/kpilote-shared/src/assistant/sources.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { extraireReferences } from './sources'

describe('extraireReferences', () => {
  it('extrait un publicId indicateur depuis une clé publicId', () => {
    expect(extraireReferences({ publicId: 'IND-42', nom: 'Fraude fiscale' })).toEqual([
      { type: 'indicateur', publicId: 'IND-42' },
    ])
  })

  it('extrait depuis les clés typées imbriquées', () => {
    const sortie = { items: [{ indicateurId: 'IND-7' }, { collectionId: 'COL-3' }] }
    expect(extraireReferences(sortie)).toEqual([
      { type: 'indicateur', publicId: 'IND-7' },
      { type: 'collection', publicId: 'COL-3' },
    ])
  })

  it('ignore les valeurs qui ressemblent à un identifiant sous une clé non identifiante', () => {
    const sortie = { visibilite: 'PUBLIC', actions: ['READ', 'WRITE_DATA'], meteo: 'SOLEIL' }
    expect(extraireReferences(sortie)).toEqual([])
  })

  it('ignore une valeur mal formée sous une clé identifiante', () => {
    expect(extraireReferences({ indicateurId: 'quarante-deux' })).toEqual([])
  })

  it('dédoublonne sur le couple type + publicId', () => {
    const sortie = [{ publicId: 'IND-42' }, { indicateurId: 'IND-42' }]
    expect(extraireReferences(sortie)).toEqual([{ type: 'indicateur', publicId: 'IND-42' }])
  })

  it("résout le type d'un individu par sa clé, faute de préfixe discriminant", () => {
    expect(extraireReferences({ individuId: 'DEPT-84' })).toEqual([
      { type: 'individu', publicId: 'DEPT-84' },
    ])
  })

  it('reconnaît un modèle d’API d’individu, dont l’identifiant vit sous la clé id', () => {
    const individu = { id: 'DEPT-84', nom: 'Vaucluse', referentiel: 'REF-DEPT' }
    expect(extraireReferences(individu)).toEqual([
      { type: 'individu', publicId: 'DEPT-84' },
      { type: 'referentiel', publicId: 'REF-DEPT' },
    ])
  })

  it('ne prend pas un id non préfixé pour un individu hors de ce contexte', () => {
    expect(extraireReferences({ id: 'PUBLIC', nom: 'Quelque chose' })).toEqual([])
  })

  it('renvoie un tableau vide sur une valeur scalaire ou nulle', () => {
    expect(extraireReferences('IND-42')).toEqual([])
    expect(extraireReferences(null)).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-shared test -- sources`
Expected: FAIL — `Failed to resolve import "./sources"`

- [ ] **Step 3: Write the implementation**

Create `packages/kpilote-shared/src/assistant/sources.ts`:

```ts
import {
  collectionPublicIdSchema,
  indicateurPublicIdSchema,
  individuPublicIdSchema,
  referentielPublicIdSchema,
} from '../publicIds'

export type TypeSource = 'indicateur' | 'collection' | 'referentiel' | 'individu'

/** Ce qu'on sait d'une source à l'extraction : son type et son identifiant. */
export type ReferenceSource = { type: TypeSource; publicId: string }

/**
 * Une source résolue. `chemin` est `null` pour les types qui n'ont pas de page de détail
 * dans le front : ils sont affichés sans lien plutôt qu'omis, sinon une réponse entièrement
 * fondée sur des individus afficherait « aucune source ».
 */
export type Source = ReferenceSource & { libelle: string; chemin: string | null }

// L'extraction est guidée par les CLÉS et non par les valeurs : `individuPublicIdSchema`
// accepte `^[A-Z][A-Z0-9-]{0,19}$`, donc un balayage de toutes les chaînes ramasserait
// `READ`, `PUBLIC` ou `SOLEIL`. Seules les clés qui portent une identité sont lues.
const CLES_PAR_TYPE: Record<TypeSource, ReadonlyArray<string>> = {
  indicateur: ['indicateurId', 'indicateurPublicId'],
  collection: ['collectionId', 'collectionPublicId'],
  // `referentiel` tout court : c'est le nom du champ dans le modèle d'API d'un individu.
  referentiel: ['referentielId', 'referentielPublicId', 'referentiel'],
  individu: ['individuId', 'individuPublicId'],
}

const SCHEMAS_PAR_TYPE: Record<TypeSource, { safeParse: (v: unknown) => { success: boolean } }> = {
  indicateur: indicateurPublicIdSchema,
  collection: collectionPublicIdSchema,
  referentiel: referentielPublicIdSchema,
  individu: individuPublicIdSchema,
}

// Les modèles d'API exposent leur identifiant public sous `id` (c'est `publicId` côté
// Prisma seulement), et les fixtures sous `publicId` : les deux clés sont ambiguës, on
// résout le type par le préfixe de la valeur.
const TYPES_A_PREFIXE: ReadonlyArray<TypeSource> = ['indicateur', 'collection', 'referentiel']
const CLES_AMBIGUES: ReadonlyArray<string> = ['publicId', 'id']

// L'individu n'a aucun préfixe discriminant : `DEPT-84` ne se distingue pas d'un mot en
// capitales. Sous une clé ambiguë, on ne le retient donc que si l'objet porte aussi un
// champ `referentiel` — obligatoire dans le modèle d'individu, donc un signal stable.
const CLE_TEMOIN_INDIVIDU = 'referentiel'

const typeDepuisCle = (cle: string): TypeSource | null => {
  for (const type of Object.keys(CLES_PAR_TYPE) as TypeSource[]) {
    if (CLES_PAR_TYPE[type].includes(cle)) return type
  }
  return null
}

const typeDepuisValeur = (valeur: string): TypeSource | null =>
  TYPES_A_PREFIXE.find((type) => SCHEMAS_PAR_TYPE[type].safeParse(valeur).success) ?? null

export const extraireReferences = (valeur: unknown): ReferenceSource[] => {
  const trouvees: ReferenceSource[] = []
  const vues = new Set<string>()

  const ajouter = (type: TypeSource, publicId: string): void => {
    if (!SCHEMAS_PAR_TYPE[type].safeParse(publicId).success) return
    const cle = `${type}:${publicId}`
    if (vues.has(cle)) return
    vues.add(cle)
    trouvees.push({ type, publicId })
  }

  const parcourir = (noeud: unknown): void => {
    if (Array.isArray(noeud)) {
      noeud.forEach(parcourir)
      return
    }
    if (noeud === null || typeof noeud !== 'object') return

    const objet = noeud as Record<string, unknown>
    const ressembleAUnIndividu = typeof objet[CLE_TEMOIN_INDIVIDU] === 'string'

    for (const [cle, contenu] of Object.entries(objet)) {
      if (typeof contenu === 'string') {
        const typeExplicite = typeDepuisCle(cle)
        if (typeExplicite) {
          ajouter(typeExplicite, contenu)
          continue
        }
        if (CLES_AMBIGUES.includes(cle)) {
          const typeDeduit = typeDepuisValeur(contenu)
          if (typeDeduit) ajouter(typeDeduit, contenu)
          else if (ressembleAUnIndividu) ajouter('individu', contenu)
        }
        continue
      }
      parcourir(contenu)
    }
  }

  parcourir(valeur)
  return trouvees
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-shared test -- sources`
Expected: PASS — 7 tests

- [ ] **Step 5: Déclarer l'export du package**

Dans `packages/kpilote-shared/package.json`, ajouter à `exports`, après l'entrée `"./apiKey"` :

```json
    "./assistant/sources": {
      "types": "./src/assistant/sources.ts",
      "default": "./src/assistant/sources.ts"
    },
```

- [ ] **Step 6: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-shared lint
git add packages/kpilote-shared/src/assistant/sources.ts packages/kpilote-shared/src/assistant/sources.test.ts packages/kpilote-shared/package.json
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): extraction des references de source guidee par les cles"
```

---

## Task 2: Contrat de surface et de contexte

**Files:**
- Create: `packages/kpilote-shared/src/assistant/surfaces.ts`
- Test: `packages/kpilote-shared/src/assistant/surfaces.test.ts`
- Modify: `packages/kpilote-shared/package.json`

**Interfaces:**
- Consumes: les quatre schémas de `./publicIds`
- Produces: `SURFACES`, `type Surface`, `MODELES`, `type Modele`, `contexteEntiteSchema`, `type ContexteEntite`, `chatRequestSchema`, `type ChatRequest`

- [ ] **Step 1: Write the failing test**

Create `packages/kpilote-shared/src/assistant/surfaces.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { chatRequestSchema, contexteEntiteSchema } from './surfaces'

const conversationId = '018f3a2b-0000-7000-8000-000000000000'

describe('chatRequestSchema', () => {
  it('accepte une requête ask-libre', () => {
    expect(
      chatRequestSchema.safeParse({ surface: 'ask-libre', conversationId, messages: [] }).success,
    ).toBe(true)
  })

  it('accepte une surcharge de modèle parmi la liste fermée', () => {
    expect(
      chatRequestSchema.safeParse({
        surface: 'ask-libre',
        conversationId,
        messages: [],
        modele: 'openweight-medium',
      }).success,
    ).toBe(true)
  })

  it('rejette un modèle hors liste', () => {
    expect(
      chatRequestSchema.safeParse({
        surface: 'ask-libre',
        conversationId,
        messages: [],
        modele: 'gpt-4',
      }).success,
    ).toBe(false)
  })

  it('rejette une surface non encore servie par le moteur', () => {
    expect(
      chatRequestSchema.safeParse({ surface: 'ask-entite', conversationId, messages: [] }).success,
    ).toBe(false)
  })

  it('rejette un conversationId qui n’est pas un uuid', () => {
    expect(
      chatRequestSchema.safeParse({ surface: 'ask-libre', conversationId: 'x', messages: [] })
        .success,
    ).toBe(false)
  })
})

describe('contexteEntiteSchema', () => {
  it('exprime une entité seule', () => {
    const resultat = contexteEntiteSchema.safeParse({
      focus: { type: 'indicateur', publicId: 'IND-42' },
    })
    expect(resultat.success).toBe(true)
    expect(resultat.success && resultat.data.cadrage).toEqual([])
  })

  it('exprime une collection vue pour un individu — le cas que le mono-entité ne savait pas dire', () => {
    expect(
      contexteEntiteSchema.safeParse({
        focus: { type: 'collection', publicId: 'COL-7' },
        cadrage: [{ type: 'individu', publicId: 'DEPT-84' }],
      }).success,
    ).toBe(true)
  })

  it('accepte les quatre types d’entité en focus', () => {
    const focus = [
      { type: 'indicateur', publicId: 'IND-1' },
      { type: 'collection', publicId: 'COL-1' },
      { type: 'individu', publicId: 'DEPT-84' },
      { type: 'referentiel', publicId: 'REF-DEPT' },
    ]
    expect(focus.every((f) => contexteEntiteSchema.safeParse({ focus: f }).success)).toBe(true)
  })

  it('rejette un publicId incohérent avec le type déclaré', () => {
    expect(
      contexteEntiteSchema.safeParse({ focus: { type: 'indicateur', publicId: 'COL-7' } }).success,
    ).toBe(false)
  })

  it('borne le cadrage à quatre entités', () => {
    const cadrage = Array.from({ length: 5 }, (_, index) => ({
      type: 'individu' as const,
      publicId: `DEPT-8${index}`,
    }))
    expect(
      contexteEntiteSchema.safeParse({ focus: { type: 'collection', publicId: 'COL-7' }, cadrage })
        .success,
    ).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-shared test -- surfaces`
Expected: FAIL — `Failed to resolve import "./surfaces"`

- [ ] **Step 3: Write the implementation**

Create `packages/kpilote-shared/src/assistant/surfaces.ts`:

```ts
import { z } from 'zod'

import {
  collectionPublicIdSchema,
  indicateurPublicIdSchema,
  individuPublicIdSchema,
  referentielPublicIdSchema,
} from '../publicIds'

// Une surface est un point d'entrée de l'assistant. L'appelant la DÉCLARE : le moteur ne
// déduit jamais l'intention du texte.
//
// Surfaces à venir, chacune consommant `contexteEntiteSchema` ci-dessous. Les ajouter ici
// fait échouer la compilation de `PROMPTS_SURFACE` côté API tant qu'elles n'ont pas leur
// couche de prompt : le compilateur tient la liste de ce qui reste à faire.
//
// - 'ask-entite'    question portant sur une entité désignée dans la palette de commandes.
//                   Le focus est LE sujet : l'assistant n'en sort pas sans y être invité.
// - 'ask-page'      question posée depuis une page. Le focus est le sujet PAR DÉFAUT, mais
//                   la question peut porter ailleurs.
// - 'synthese-page' synthèse de la page courante. La question est pré-remplie par le front
//                   et envoyée comme message utilisateur : même endpoint, même transport,
//                   et la synthèse devient le premier tour d'une conversation qu'on peut
//                   poursuivre plutôt qu'un cul-de-sac.
export const SURFACES = ['ask-libre'] as const
export type Surface = (typeof SURFACES)[number]

/** Liste fermée : une surcharge de modèle ne doit pas pouvoir pointer hors d'Albert. */
export const MODELES = ['openweight-large', 'openweight-medium'] as const
export type Modele = (typeof MODELES)[number]

const referenceEntiteSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('indicateur'), publicId: indicateurPublicIdSchema }),
  z.object({ type: z.literal('collection'), publicId: collectionPublicIdSchema }),
  z.object({ type: z.literal('individu'), publicId: individuPublicIdSchema }),
  z.object({ type: z.literal('referentiel'), publicId: referentielPublicIdSchema }),
])

export type ReferenceEntite = z.infer<typeof referenceEntiteSchema>

/**
 * Le contexte qu'une surface fournit au moteur.
 *
 * `focus` est le sujet, `cadrage` les entités qui le restreignent. Une page peut porter une
 * collection VUE POUR un individu : focus = collection, cadrage = [individu]. Un contexte
 * mono-entité ne sait pas l'exprimer, d'où cette forme — validée maintenant pour ne pas
 * renégocier le contrat quand la deuxième surface arrivera.
 */
export const contexteEntiteSchema = z.object({
  focus: referenceEntiteSchema,
  cadrage: z.array(referenceEntiteSchema).max(4).default([]),
})

export type ContexteEntite = z.infer<typeof contexteEntiteSchema>

export const chatRequestSchema = z.discriminatedUnion('surface', [
  z.object({
    surface: z.literal('ask-libre'),
    conversationId: z.uuid().describe('Identifiant de la conversation, généré par le client.'),
    messages: z.array(z.unknown()).describe('Historique au format UIMessage du SDK ai.'),
    modele: z
      .enum(MODELES)
      .optional()
      .describe('Surcharge du modèle. Sert à rejouer un même échange sur deux modèles.'),
  }),
])

export type ChatRequest = z.infer<typeof chatRequestSchema>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-shared test -- surfaces`
Expected: PASS — 11 tests

- [ ] **Step 5: Déclarer l'export**

Ajouter dans `exports` de `packages/kpilote-shared/package.json`, à la suite de `"./assistant/sources"` :

```json
    "./assistant/surfaces": {
      "types": "./src/assistant/surfaces.ts",
      "default": "./src/assistant/surfaces.ts"
    },
```

- [ ] **Step 6: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-shared lint
git add packages/kpilote-shared/src/assistant packages/kpilote-shared/package.json
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): contrat de surface et contexte focus + cadrage"
```

---

## Task 3: Contrat d'outils typé de bout en bout

**Files:**
- Create: `packages/kpilote-shared/src/assistant/tools.ts`
- Create: `packages/kpilote-shared/src/assistant/message.ts`
- Test: `packages/kpilote-shared/src/assistant/tools.test.ts`
- Modify: `packages/kpilote-shared/package.json` — 2 exports + `ai` en `peerDependencies`

**Interfaces:**
- Consumes: `Source` (Task 1) ; les modèles d'API déjà exportés par le package (`IndicateurApiModel`, `IndicateurListApiModel`, `CollectionApiModel`, `CollectionListApiModel`, `TauxProgressionListApiModel`, `ValeursRemarquablesListApiModel`, `SyntheseIndividusListApiModel`, `ValeurAvancementListApiModel`, `DernieresValeursIndividuListApiModel`, `ObjectifIndicateurIndividuListApiModel`, `ReferentielListApiModel`, `IndividuListApiModel`, `CollectionTauxProgressionApiModel`)
- Produces: `NOMS_OUTILS`, `type NomOutil`, `LIBELLES_OUTILS`, `inputRechercheSchema`, `inputIdIndicateurSchema`, `inputIdCollectionSchema`, `type EntiteTrouvee`, `type SearchOutput`, `type BrancheSynthese<T>`, `type SyntheseIndicateurOutput`, `type SyntheseCollectionOutput`, `type ErreurOutil`, `type KpiloteUITools`, `type KpiloteUIMessage`

- [ ] **Step 1: Write the failing test**

Create `packages/kpilote-shared/src/assistant/tools.test.ts`:

```ts
import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  inputIdIndicateurSchema,
  inputRechercheSchema,
  LIBELLES_OUTILS,
  NOMS_OUTILS,
  type KpiloteUITools,
  type NomOutil,
} from './tools'

describe('NOMS_OUTILS', () => {
  it('décrit douze outils aux noms uniques', () => {
    expect(NOMS_OUTILS).toHaveLength(12)
    expect(new Set(NOMS_OUTILS).size).toBe(12)
  })

  it('porte un libellé pour chaque outil', () => {
    expect(NOMS_OUTILS.every((nom) => (LIBELLES_OUTILS[nom] ?? '').length > 0)).toBe(true)
  })

  it('déclare une entrée KpiloteUITools par outil — sans quoi le front perd le typage', () => {
    expectTypeOf<keyof KpiloteUITools>().toEqualTypeOf<NomOutil>()
  })
})

describe('schémas d’entrée', () => {
  it('rejette un identifiant indicateur mal formé', () => {
    expect(inputIdIndicateurSchema.safeParse({ id: 'IND-quarante-deux' }).success).toBe(false)
    expect(inputIdIndicateurSchema.safeParse({ id: 'IND-42' }).success).toBe(true)
  })

  it('exige une requête de recherche non vide', () => {
    expect(inputRechercheSchema.safeParse({ requete: '' }).success).toBe(false)
    expect(inputRechercheSchema.safeParse({ requete: 'fraude fiscale' }).success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-shared test -- tools`
Expected: FAIL — `Failed to resolve import "./tools"`

- [ ] **Step 3: Write `tools.ts`**

```ts
import { z } from 'zod'

import type { CollectionApiModel, CollectionListApiModel } from '../collection'
import type { CollectionTauxProgressionApiModel } from '../collectionTauxProgression'
import type { IndicateurApiModel, IndicateurListApiModel } from '../indicateur'
import type { IndividuListApiModel } from '../individu'
import type { ObjectifIndicateurIndividuListApiModel } from '../objectifIndicateurIndividu'
import { collectionPublicIdSchema, indicateurPublicIdSchema, individuPublicIdSchema } from '../publicIds'
import type { ReferentielListApiModel } from '../referentiel'
import type { TauxProgressionListApiModel } from '../tauxProgression'
import type {
  DernieresValeursIndividuListApiModel,
  SyntheseIndividusListApiModel,
  ValeurAvancementListApiModel,
  ValeursRemarquablesListApiModel,
} from '../valeurAvancement'

// Source unique de vérité des noms d'outils. Le serveur les enregistre, le front en dérive
// ses libellés et son nettoyage des pseudo-appels : aucune liste dupliquée ne peut diverger.
// Chez ppg, `AssistantMessageText.tsx` en déclare 7 quand la route en expose 11, et les
// pseudo-appels des 4 manquants passent au travers.
export const NOMS_OUTILS = [
  'search_indicateurs',
  'search_collections',
  'get_synthese_indicateur',
  'get_synthese_collection',
  'get_indicateurs',
  'get_indicateur',
  'get_indicateur_valeurs',
  'get_collections',
  'get_collection',
  'get_individu_dernieres_valeurs',
  'get_referentiels',
  'get_referentiel_individus',
] as const

export type NomOutil = (typeof NOMS_OUTILS)[number]

export const LIBELLES_OUTILS: Record<NomOutil, string> = {
  search_indicateurs: 'Recherche des indicateurs correspondants',
  search_collections: 'Recherche des collections correspondantes',
  get_synthese_indicateur: "Synthèse de l'indicateur",
  get_synthese_collection: 'Synthèse de la collection',
  get_indicateurs: 'Liste des indicateurs',
  get_indicateur: "Détail de l'indicateur",
  get_indicateur_valeurs: "Valeurs de l'indicateur",
  get_collections: 'Liste des collections',
  get_collection: 'Détail de la collection',
  get_individu_dernieres_valeurs: "Dernières valeurs de l'individu",
  get_referentiels: 'Liste des référentiels',
  get_referentiel_individus: 'Individus du référentiel',
}

// --- Schémas d'entrée : source de vérité, le serveur les utilise tels quels --------------

export const inputRechercheSchema = z.object({
  requete: z
    .string()
    .min(1)
    .describe('La formulation de l’utilisateur, telle quelle, sans reformulation.'),
})

export const inputIdIndicateurSchema = z.object({ id: indicateurPublicIdSchema })
export const inputIdCollectionSchema = z.object({ id: collectionPublicIdSchema })
export const inputIdIndividuSchema = z.object({ id: individuPublicIdSchema })

// --- Types de sortie ---------------------------------------------------------------------

/** Un outil dérivé dont l'appel échoue renvoie ceci plutôt que de faire tomber le tour. */
export type ErreurOutil = { erreur: string }

export type EntiteTrouvee = { publicId: string; nom: string }

export type SearchOutput = {
  resultats: EntiteTrouvee[]
  /** Vrai quand le pré-filtre déterministe n'a rien donné et qu'on a rechargé le catalogue. */
  repli: boolean
  /** Renseignée quand `resultats` est vide, pour que le modèle sache quoi dire. */
  raison?: string
}

/**
 * Une branche de synthèse porte sa raison d'absence plutôt qu'un `null` nu : sans cela le
 * modèle lit un refus de droit comme « pas de données ».
 */
export type BrancheSynthese<T> = { donnees: T } | { indisponible: string }

export type SyntheseIndicateurOutput = {
  identite: BrancheSynthese<IndicateurApiModel>
  tauxProgression: BrancheSynthese<TauxProgressionListApiModel>
  valeursRemarquables: BrancheSynthese<ValeursRemarquablesListApiModel>
  objectifs: BrancheSynthese<ObjectifIndicateurIndividuListApiModel>
  syntheseIndividus: BrancheSynthese<SyntheseIndividusListApiModel>
}

export type SyntheseCollectionOutput = {
  identite: BrancheSynthese<CollectionApiModel>
  tauxProgression: BrancheSynthese<CollectionTauxProgressionApiModel>
}

/**
 * Le tableau que `KpiloteUIMessage` consomme pour typer les parts d'outil. Sans lui,
 * `part.output` est `unknown` et aucun outil produisant de l'interface n'est rendable —
 * c'est la limite qu'on rencontrerait au premier `display_choices`.
 *
 * Les sorties de la couche métier sont vérifiées à la compilation par l'annotation de retour
 * d'`execute`. Celles de la couche dérivée reprennent le modèle de réponse documenté par la
 * route ; ce sont les tests de route qui en garantissent la forme.
 */
export type KpiloteUITools = {
  search_indicateurs: { input: z.input<typeof inputRechercheSchema>; output: SearchOutput }
  search_collections: { input: z.input<typeof inputRechercheSchema>; output: SearchOutput }
  get_synthese_indicateur: {
    input: z.input<typeof inputIdIndicateurSchema>
    output: SyntheseIndicateurOutput
  }
  get_synthese_collection: {
    input: z.input<typeof inputIdCollectionSchema>
    output: SyntheseCollectionOutput
  }
  get_indicateurs: { input: Record<string, unknown>; output: IndicateurListApiModel | ErreurOutil }
  get_indicateur: {
    input: z.input<typeof inputIdIndicateurSchema>
    output: IndicateurApiModel | ErreurOutil
  }
  get_indicateur_valeurs: {
    input: z.input<typeof inputIdIndicateurSchema>
    output: ValeurAvancementListApiModel | ErreurOutil
  }
  get_collections: { input: Record<string, unknown>; output: CollectionListApiModel | ErreurOutil }
  get_collection: {
    input: z.input<typeof inputIdCollectionSchema>
    output: CollectionApiModel | ErreurOutil
  }
  get_individu_dernieres_valeurs: {
    input: z.input<typeof inputIdIndividuSchema>
    output: DernieresValeursIndividuListApiModel | ErreurOutil
  }
  get_referentiels: { input: Record<string, unknown>; output: ReferentielListApiModel | ErreurOutil }
  get_referentiel_individus: {
    input: { id: string }
    output: IndividuListApiModel | ErreurOutil
  }
}
```

- [ ] **Step 4: Write `message.ts`**

```ts
import type { UIMessage } from 'ai'

import type { Source } from './sources'
import type { KpiloteUITools } from './tools'

/** Parts de données émises par le moteur en plus du texte et des appels d'outils. */
export type KpiloteDataParts = { sources: Source[] }

export type KpiloteUIMessage = UIMessage<never, KpiloteDataParts, KpiloteUITools>
```

- [ ] **Step 5: Ajouter `ai` en peerDependency et déclarer les exports**

Dans `packages/kpilote-shared/package.json` :

```json
  "peerDependencies": {
    "ai": "^6.0.161",
    "zod": "^4.3.6"
  },
```

Et deux entrées dans `exports`, à la suite de `"./assistant/surfaces"` :

```json
    "./assistant/tools": {
      "types": "./src/assistant/tools.ts",
      "default": "./src/assistant/tools.ts"
    },
    "./assistant/message": {
      "types": "./src/assistant/message.ts",
      "default": "./src/assistant/message.ts"
    },
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-shared test -- tools`
Expected: PASS — 5 tests

- [ ] **Step 7: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-shared lint
git add packages/kpilote-shared/src/assistant packages/kpilote-shared/package.json
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): contrat d'outils type de bout en bout"
```

---

## Task 4: Modèles de persistance

**Files:**
- Modify: `apps/kpilote-api/prisma/schema.prisma`
- Create: migration générée par Prisma

**Interfaces:**
- Produces: modèles `AssistantConversation` et `AssistantAppel`, enums `AssistantEvaluation` et `AssistantCategorieProbleme`

- [ ] **Step 1: Ajouter les enums et modèles au schéma**

À la fin de `apps/kpilote-api/prisma/schema.prisma` :

```prisma
enum AssistantEvaluation {
  POSITIVE
  NEGATIVE
}

enum AssistantCategorieProbleme {
  PROBLEME_TECHNIQUE
  INCOMPREHENSION
  SUGGESTION
  AUTRE
}

/// Blob JSONB d'une conversation : les `parts` d'un UIMessage sont polymorphes et
/// définies par le SDK `ai`. Une table par message ne servirait qu'à les
/// re-sérialiser, et aucune recherche plein texte n'est prévue.
model AssistantConversation {
  id            String   @id @db.Uuid
  utilisateurId String   @db.Uuid
  titre         String
  surface       String
  messages      Json
  contexte      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  appels AssistantAppel[]

  @@index([utilisateurId, updatedAt(sort: Desc)])
  @@index([updatedAt])
}

/// Audit brut : une ligne par tour. Sert au suivi et au harnais d'évaluation.
model AssistantAppel {
  id                 String                       @id @default(uuid()) @db.Uuid
  conversationId     String                       @db.Uuid
  utilisateurId      String                       @db.Uuid
  modele             String
  surface            String
  transcript         Json
  inputTokens        Int                          @default(0)
  outputTokens       Int                          @default(0)
  dureeMs            Int                          @default(0)
  evaluation         AssistantEvaluation?
  categoriesProbleme AssistantCategorieProbleme[] @default([])
  commentaire        String?
  createdAt          DateTime                     @default(now())

  conversation AssistantConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt(sort: Desc)])
}
```

- [ ] **Step 2: Générer la migration**

Demander d'abord à l'utilisateur de confirmer que le Docker de la base tourne — ne rien manipuler soi-même sur les conteneurs.

Run: `pnpm --filter @pilote/kpilote-api database:migration -- --name ajoute_assistant_conversation_et_appel`
Expected: migration créée sous `apps/kpilote-api/prisma/migrations/`

- [ ] **Step 3: Régénérer le client**

Run: `pnpm --filter @pilote/kpilote-api prisma:generate`
Expected: succès. Ce script porte `--sql` — l'omettre casse les requêtes typées existantes.

- [ ] **Step 4: Vérifier la compilation**

Run: `pnpm --filter @pilote/kpilote-api lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/kpilote-api/prisma
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): modeles de persistance de l'assistant"
```

---

## Task 5: Provider Albert et mapping de chemins

**Files:**
- Create: `apps/kpilote-api/src/assistant/runtime/modele.ts`
- Modify: `apps/kpilote-api/tsconfig.json`

**Interfaces:**
- Consumes: `env.ALBERT_API_KEY`, `MODELES`, `type Modele` (Task 2)
- Produces: `creerModeleAssistant(nom?: Modele): LanguageModel`, `MODELE_PAR_DEFAUT`, `TEMPERATURE_CONVERSATION`, `TEMPERATURE_STRUCTUREE`, `MAX_ETAPES`, `MAX_CANDIDATS_CLASSEMENT`, `MAX_CATALOGUE_REPLI`

- [ ] **Step 1: Ajouter le mapping de chemin**

Dans `apps/kpilote-api/tsconfig.json`, dans `compilerOptions.paths`, après `"@/apiKey/*"` :

```json
      "@/assistant/*": ["./src/assistant/*"],
```

Sans cette entrée aucun import `@/assistant/...` ne résout : le mapping y est par dossier explicite.

- [ ] **Step 2: Écrire le module**

Create `apps/kpilote-api/src/assistant/runtime/modele.ts`:

```ts
import { createOpenAI } from '@ai-sdk/openai'
import { type Modele } from '@pilote/kpilote-shared/assistant/surfaces'
import { type LanguageModel } from 'ai'

import { env } from '@/env'

const ALBERT_BASE_URL = 'https://albert.api.etalab.gouv.fr/v1'

/** Point de bascule unique quand un meilleur modèle Etalab arrive. */
export const MODELE_PAR_DEFAUT: Modele = 'openweight-large'

export const TEMPERATURE_CONVERSATION = 0.2
export const TEMPERATURE_STRUCTUREE = 0

/** ppg est à 50, ce qui laisse une conversation partir en vrille pendant cinquante tours. */
export const MAX_ETAPES = 12

/** Nombre de candidats soumis au sous-modèle après pré-filtre déterministe. */
export const MAX_CANDIDATS_CLASSEMENT = 60

/** Taille au-delà de laquelle on refuse le repli sémantique plutôt que de tronquer. */
export const MAX_CATALOGUE_REPLI = 300

// Throw si la clé n'est pas configurée : c'est une erreur de déploiement (500), pas un
// état métier. Même parti pris que `valeurImport/helpers/albert.ts`.
export const creerModeleAssistant = (nom: Modele = MODELE_PAR_DEFAUT): LanguageModel => {
  if (!env.ALBERT_API_KEY) {
    throw new Error('ALBERT_API_KEY manquante — assistant non configuré côté API.')
  }
  const provider = createOpenAI({ baseURL: ALBERT_BASE_URL, apiKey: env.ALBERT_API_KEY })
  return provider.chat(nom)
}
```

- [ ] **Step 3: Vérifier la compilation**

Run: `pnpm --filter @pilote/kpilote-api lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/kpilote-api/tsconfig.json apps/kpilote-api/src/assistant/runtime/modele.ts
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): provider Albert du moteur d'assistant"
```

---

## Task 6: Filtre `ids` sur les collections, par symétrie avec les indicateurs

`listIndicateursQuerySchema` porte un filtre `ids` ; `listCollectionsQuerySchema` n'en a pas. La résolution des sources en a besoin pour charger des libellés en un appel. Cette asymétrie est une lacune de l'API, pas une décision : on la comble plutôt que de la contourner côté assistant.

**Files:**
- Modify: `packages/kpilote-shared/src/collection.ts:89-97` — ajouter `ids` à `listCollectionsQuerySchema`
- Modify: `apps/kpilote-api/src/collection/queries/listCollections.ts` — prendre `ids` en compte
- Test: `apps/kpilote-api/src/collection/queries/listCollections.test.ts` — ajouter un cas

**Interfaces:**
- Produces: `ListCollectionsQuery` gagne `ids?: string[]`

- [ ] **Step 1: Write the failing test**

Ajouter à `apps/kpilote-api/src/collection/queries/listCollections.test.ts`, en suivant la forme des cas déjà présents dans ce fichier (mêmes helpers `fixtures`, `integrationTest`, `runAs*`) :

```ts
  it(
    'filtre sur les identifiants publics fournis',
    integrationTest(async () => {
      const cle = await fixtures.apiKey({ label: 'test-ids' })
      const gardee = await fixtures.collection({ nom: 'Gardée' })
      await fixtures.collection({ nom: 'Ignorée' })

      const resultat = await runAsAdmin(cle.id, () =>
        listCollections({ ids: [gardee.publicId] }).match(
          (data) => data,
          () => null,
        ),
      )

      // Le modèle d'API expose l'identifiant public sous `id` ; la fixture Prisma sous `publicId`.
      expect(resultat?.items.map((item) => item.id)).toEqual([gardee.publicId])
    }),
  )

  it(
    'ignore un tableau ids vide plutôt que de tout filtrer',
    integrationTest(async () => {
      const cle = await fixtures.apiKey({ label: 'test-ids-vide' })
      await fixtures.collection({ nom: 'Présente' })

      const resultat = await runAsAdmin(cle.id, () =>
        listCollections({ ids: [] }).match(
          (data) => data,
          () => null,
        ),
      )

      expect((resultat?.items.length ?? 0) > 0).toBe(true)
    }),
  )
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-api test -- listCollections`
Expected: FAIL — `ids` n'existe pas sur `ListCollectionsQuery`

- [ ] **Step 3: Étendre le schéma partagé**

Dans `packages/kpilote-shared/src/collection.ts`, ajouter le champ à `listCollectionsQuerySchema`, en reprenant à l'identique le prétraitement CSV de `listIndicateursQuerySchema` (`packages/kpilote-shared/src/indicateur.ts:267-278`) :

```ts
  ids: z
    .preprocess((val) => {
      if (typeof val !== 'string') return val
      const parts = val
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
      return parts.length === 0 ? undefined : parts
    }, z.array(collectionPublicIdSchema).optional())
    .describe(
      'Filtre par identifiants publics (CSV, ex. `COL-001,COL-002`). Vide ou absent = aucun filtre.',
    ),
```

Vérifier que `collectionPublicIdSchema` est bien importé dans ce fichier ; sinon l'ajouter depuis `./publicIds`.

- [ ] **Step 4: Prendre `ids` en compte dans la query**

Dans `apps/kpilote-api/src/collection/queries/listCollections.ts`, ajouter le filtre au même endroit que les autres, sur le modèle de `listIndicateurs.ts:23-25` :

```ts
  if (params.ids && params.ids.length > 0) {
    filters.publicId = { in: params.ids }
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-api test -- listCollections`
Expected: PASS — les cas existants plus les 2 nouveaux

- [ ] **Step 6: Lint et commit**

```bash
pnpm lint
git add packages/kpilote-shared/src/collection.ts apps/kpilote-api/src/collection
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): filtre ids sur les collections par symetrie avec les indicateurs"
```

---

## Task 7: Requêteur injecté et dérivation d'outils depuis l'OpenAPI

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/requeteur.ts`
- Create: `apps/kpilote-api/src/assistant/tools/deriverTool.ts`
- Create: `apps/kpilote-api/src/assistant/tools/whitelist.ts`
- Test: `apps/kpilote-api/src/assistant/tools/deriverTool.test.ts`
- Modify: `apps/kpilote-api/src/indicateur/routes.ts:52,76` — exporter `getIndicateursRoute`, `getIndicateurByIdRoute`
- Modify: `apps/kpilote-api/src/collection/routes.ts:100,123` — exporter `getCollectionsRoute`, `getCollectionByIdRoute`
- Modify: `apps/kpilote-api/src/referentiel/routes.ts:34,105` — exporter `getReferentielsRoute`, `getIndividusForReferentielRoute`
- Modify: `apps/kpilote-api/src/valeurAvancement/routes.ts:105,319` — exporter `getValeursForIndicateurRoute`, `getDernieresValeursForIndividuRoute`

**Interfaces:**
- Consumes: `NomOutil` (Task 3)
- Produces: `type Requeteur`, `creerRequeteur(app, jeton): Requeteur`, `construireUrl(chemin, params): string`, `deriverTool(entree, requeteur): Tool`, `type EntreeWhitelist`, `WHITELIST: ReadonlyArray<EntreeWhitelist>`

- [ ] **Step 1: Write the failing test**

Create `apps/kpilote-api/src/assistant/tools/deriverTool.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

import { construireUrl, deriverTool } from '@/assistant/tools/deriverTool'
import { WHITELIST } from '@/assistant/tools/whitelist'

describe('construireUrl', () => {
  it('substitue les paramètres de chemin', () => {
    expect(construireUrl('/indicateurs/{id}', { id: 'IND-42' })).toBe('/indicateurs/IND-42')
  })

  it('reporte les paramètres restants en query string', () => {
    expect(construireUrl('/indicateurs', { recherche: 'fraude', pageSize: 20 })).toBe(
      '/indicateurs?recherche=fraude&pageSize=20',
    )
  })

  it('combine chemin et query', () => {
    expect(construireUrl('/indicateurs/{id}/valeurs', { id: 'IND-7', pageSize: 5 })).toBe(
      '/indicateurs/IND-7/valeurs?pageSize=5',
    )
  })

  it('encode les valeurs de chemin', () => {
    expect(construireUrl('/referentiels/{id}/individus', { id: 'REF-A B' })).toBe(
      '/referentiels/REF-A%20B/individus',
    )
  })

  it('ignore les paramètres non renseignés', () => {
    expect(construireUrl('/indicateurs', { recherche: undefined })).toBe('/indicateurs')
  })

  it('déplie un paramètre tableau en occurrences répétées', () => {
    expect(construireUrl('/indicateurs', { ids: ['IND-1', 'IND-2'] })).toBe(
      '/indicateurs?ids=IND-1&ids=IND-2',
    )
  })
})

describe('deriverTool', () => {
  const entree = WHITELIST.find((candidat) => candidat.nom === 'get_indicateur')!

  it('passe par le requêteur injecté, jamais par une app importée', async () => {
    const requeteur = vi.fn(async () => new Response(JSON.stringify({ publicId: 'IND-42' })))
    const outil = deriverTool(entree, requeteur)

    const sortie = await outil.execute?.({ id: 'IND-42' }, { toolCallId: 't', messages: [] })

    expect(requeteur).toHaveBeenCalledWith('/indicateurs/IND-42')
    expect(sortie).toEqual({ publicId: 'IND-42' })
  })

  it('renvoie une erreur lisible plutôt que de faire tomber le tour', async () => {
    const requeteur = vi.fn(async () => new Response('nope', { status: 403 }))
    const outil = deriverTool(entree, requeteur)

    const sortie = await outil.execute?.({ id: 'IND-42' }, { toolCallId: 't', messages: [] })

    expect(sortie).toEqual({ erreur: expect.stringContaining('403') })
  })

  it('reprend la description de la route, que le modèle lit au moment de décider', () => {
    const outil = deriverTool(entree, async () => new Response('{}'))
    expect(outil.description).toBe(entree.route.description)
  })
})

describe('WHITELIST', () => {
  it('expose huit entrées aux noms uniques', () => {
    const noms = WHITELIST.map((entreeCourante) => entreeCourante.nom)
    expect(noms).toHaveLength(8)
    expect(new Set(noms).size).toBe(8)
  })

  it('ne référence que des routes de lecture', () => {
    expect(WHITELIST.every((entreeCourante) => entreeCourante.route.method === 'get')).toBe(true)
  })

  it('porte une description substantielle sur chaque route, lue par le modèle', () => {
    expect(
      WHITELIST.every((entreeCourante) => (entreeCourante.route.description ?? '').length > 40),
    ).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-api test -- deriverTool`
Expected: FAIL — modules `@/assistant/tools/deriverTool` et `whitelist` introuvables

- [ ] **Step 3: Exporter les huit configurations de route**

Ajouter le mot-clé `export` devant les huit `const … = createRoute({` listés dans **Files**. Aucun autre changement dans ces fichiers. Exemple, `apps/kpilote-api/src/indicateur/routes.ts:52` :

```ts
export const getIndicateursRoute = createRoute({
```

- [ ] **Step 4: Écrire `requeteur.ts`**

```ts
import { type Hono } from 'hono'

/**
 * Une fonction qui joue un appel documenté et rend sa réponse.
 *
 * Elle est INJECTÉE aux outils, jamais importée par eux. Deux raisons :
 *
 * 1. `@/app` monte les routes de l'assistant, donc un outil qui importerait `app`
 *    créerait un cycle.
 * 2. En test, `buildTestApp` exclut délibérément `databaseContext` — son commentaire dit
 *    qu'il « écraserait le contexte db transactionnel d'integrationTest et rendrait les
 *    fixtures invisibles ». Un outil rappelant le vrai `app` réintroduirait ce middleware
 *    et ne verrait pas les fixtures de son propre test.
 */
export type Requeteur = (url: string) => Promise<Response>

/**
 * En production, l'app complète : pas de socket, mais toute la chaîne de middlewares
 * s'exécute — `databaseContext`, `authContext`, `requireAuthentication`, puis les filtres
 * de permission des queries. L'outil ne peut donc pas voir plus que l'appelant dont il
 * porte le jeton.
 */
export const creerRequeteur =
  (app: Pick<Hono, 'request'>, jeton: string): Requeteur =>
  (url) =>
    app.request(url, { headers: { authorization: `Bearer ${jeton}` } })
```

- [ ] **Step 5: Écrire `deriverTool.ts`**

```ts
import { type RouteConfig } from '@hono/zod-openapi'
import { type NomOutil } from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'
import { z } from 'zod'

import { type Requeteur } from '@/assistant/tools/requeteur'

export type EntreeWhitelist = { nom: NomOutil; route: RouteConfig }

const PARAM_DANS_CHEMIN = /\{([^}]+)\}/g

/**
 * Reconstitue l'URL documentée par la route : les paramètres qui apparaissent entre
 * accolades dans le chemin y sont substitués, les autres partent en query string.
 */
export const construireUrl = (chemin: string, params: Record<string, unknown>): string => {
  const consommes = new Set<string>()
  const chemAvecParams = chemin.replace(PARAM_DANS_CHEMIN, (_correspondance, nom: string) => {
    consommes.add(nom)
    return encodeURIComponent(String(params[nom] ?? ''))
  })

  const query = new URLSearchParams()
  for (const [cle, valeur] of Object.entries(params)) {
    if (consommes.has(cle) || valeur === undefined || valeur === null) continue
    if (Array.isArray(valeur)) {
      valeur.forEach((element) => query.append(cle, String(element)))
      continue
    }
    query.append(cle, String(valeur))
  }

  const suffixe = query.toString()
  return suffixe ? `${chemAvecParams}?${suffixe}` : chemAvecParams
}

const fusionnerSchemas = (route: RouteConfig): z.ZodObject<z.ZodRawShape> => {
  const params = route.request?.params as z.ZodObject<z.ZodRawShape> | undefined
  const query = route.request?.query as z.ZodObject<z.ZodRawShape> | undefined
  return z.object({ ...(params?.shape ?? {}), ...(query?.shape ?? {}) })
}

/**
 * Transforme une route de lecture en outil. La description et le schéma sont ceux de la
 * route : quand elle évolue, l'outil suit sans intervention.
 */
export const deriverTool = ({ route }: EntreeWhitelist, requeteur: Requeteur): Tool =>
  tool({
    description: route.description ?? route.summary ?? '',
    inputSchema: fusionnerSchemas(route),
    execute: async (params: Record<string, unknown>) => {
      const reponse = await requeteur(construireUrl(route.path, params))
      if (!reponse.ok) {
        // Une erreur lisible plutôt qu'un throw : le modèle peut corriger son appel ou
        // dire à l'utilisateur qu'il n'a pas accès, au lieu de perdre tout le tour.
        return { erreur: `L'appel a échoué avec le statut ${reponse.status}.` }
      }
      return reponse.json()
    },
  })
```

- [ ] **Step 6: Écrire `whitelist.ts`**

```ts
import { getCollectionByIdRoute, getCollectionsRoute } from '@/collection/routes'
import { getIndicateurByIdRoute, getIndicateursRoute } from '@/indicateur/routes'
import { getIndividusForReferentielRoute, getReferentielsRoute } from '@/referentiel/routes'
import {
  getDernieresValeursForIndividuRoute,
  getValeursForIndicateurRoute,
} from '@/valeurAvancement/routes'
import { type EntreeWhitelist } from '@/assistant/tools/deriverTool'

// Le nom de l'outil est déclaré ici plutôt que dérivé du chemin : une dérivation
// automatique buterait sur la singularisation pour un gain nul.
//
// Volontairement absentes : les routes que `get_synthese_indicateur` compose déjà
// (taux-progression, valeurs-remarquables, objectifs, synthese-individus). Les exposer
// offrirait au modèle un chemin plus verbeux vers le même résultat. Le jeu d'évals dira
// s'il en manque une.
//
// Volontairement hors périmètre : apiKey, feature, permission, utilisateur, me, whoami,
// brouillons de commentaire — administration, pas analyse.
export const WHITELIST: ReadonlyArray<EntreeWhitelist> = [
  { nom: 'get_indicateurs', route: getIndicateursRoute },
  { nom: 'get_indicateur', route: getIndicateurByIdRoute },
  { nom: 'get_indicateur_valeurs', route: getValeursForIndicateurRoute },
  { nom: 'get_collections', route: getCollectionsRoute },
  { nom: 'get_collection', route: getCollectionByIdRoute },
  { nom: 'get_individu_dernieres_valeurs', route: getDernieresValeursForIndividuRoute },
  { nom: 'get_referentiels', route: getReferentielsRoute },
  { nom: 'get_referentiel_individus', route: getIndividusForReferentielRoute },
]
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-api test -- deriverTool`
Expected: PASS — 12 tests

- [ ] **Step 8: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/assistant/tools apps/kpilote-api/src/indicateur/routes.ts apps/kpilote-api/src/collection/routes.ts apps/kpilote-api/src/referentiel/routes.ts apps/kpilote-api/src/valeurAvancement/routes.ts
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): derivation des outils OpenAPI avec requeteur injecte"
```

---

## Task 8: Pré-filtre déterministe de recherche

C'est la correction du défaut d'échelle : ppg injecte tout son catalogue dans le prompt, ce qui tient pour soixante chantiers et pas pour des centaines d'indicateurs. On filtre d'abord avec les moyens de l'API, on n'appelle le modèle que sur ce qui reste.

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/metier/prefiltrer.ts`
- Test: `apps/kpilote-api/src/assistant/tools/metier/prefiltrer.test.ts`

**Interfaces:**
- Produces: `decouperEnTermes(requete: string): string[]`, `classerParTermesSatisfaits(candidats, termes): EntiteTrouvee[]`, `filtrerHallucinations(candidats, catalogue, obtenirId)`

- [ ] **Step 1: Write the failing test**

Create `apps/kpilote-api/src/assistant/tools/metier/prefiltrer.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  classerParTermesSatisfaits,
  decouperEnTermes,
  filtrerHallucinations,
} from '@/assistant/tools/metier/prefiltrer'

describe('decouperEnTermes', () => {
  it('normalise la casse et retire les diacritiques', () => {
    expect(decouperEnTermes('Délais DE Paiement')).toEqual(['delais', 'paiement'])
  })

  it('retire les mots vides et les termes trop courts', () => {
    expect(decouperEnTermes("l'indicateur sur la fraude fiscale")).toEqual(['fraude', 'fiscale'])
  })

  it('dédoublonne', () => {
    expect(decouperEnTermes('fraude fraude fiscale')).toEqual(['fraude', 'fiscale'])
  })

  it('renvoie un tableau vide sur une requête sans terme exploitable', () => {
    expect(decouperEnTermes('et le ?')).toEqual([])
  })
})

describe('classerParTermesSatisfaits', () => {
  const candidats = [
    { publicId: 'IND-1', nom: 'Recouvrement de la fraude fiscale' },
    { publicId: 'IND-2', nom: 'Fraude aux prestations' },
    { publicId: 'IND-3', nom: 'Délais de paiement' },
  ]

  it('place devant les candidats qui satisfont le plus de termes', () => {
    const classes = classerParTermesSatisfaits(candidats, ['fraude', 'fiscale'])
    expect(classes.map((candidat) => candidat.publicId)).toEqual(['IND-1', 'IND-2'])
  })

  it('écarte les candidats qui ne satisfont aucun terme', () => {
    const classes = classerParTermesSatisfaits(candidats, ['paiement'])
    expect(classes.map((candidat) => candidat.publicId)).toEqual(['IND-3'])
  })

  it('est insensible à la casse et aux diacritiques du candidat', () => {
    const classes = classerParTermesSatisfaits([{ publicId: 'IND-9', nom: 'DÉLAIS' }], ['delais'])
    expect(classes).toHaveLength(1)
  })

  it('dédoublonne sur publicId quand un candidat vient de plusieurs appels', () => {
    const doublons = [candidats[0], candidats[0]]
    expect(classerParTermesSatisfaits(doublons, ['fraude'])).toHaveLength(1)
  })
})

describe('filtrerHallucinations', () => {
  const catalogue = [
    { publicId: 'IND-1', nom: 'Fraude fiscale' },
    { publicId: 'IND-2', nom: 'Délais de paiement' },
  ]

  it('conserve les candidats présents au catalogue, dans leur ordre de pertinence', () => {
    expect(filtrerHallucinations([{ id: 'IND-2' }, { id: 'IND-1' }], catalogue, (c) => c.id)).toEqual([
      { publicId: 'IND-2', nom: 'Délais de paiement' },
      { publicId: 'IND-1', nom: 'Fraude fiscale' },
    ])
  })

  it('écarte un identifiant inventé par le sous-modèle', () => {
    expect(filtrerHallucinations([{ id: 'IND-999' }], catalogue, (c) => c.id)).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-api test -- prefiltrer`
Expected: FAIL — module introuvable

- [ ] **Step 3: Write the implementation**

Create `apps/kpilote-api/src/assistant/tools/metier/prefiltrer.ts`:

```ts
import { type EntiteTrouvee } from '@pilote/kpilote-shared/assistant/tools'

const LONGUEUR_MIN_TERME = 3

// Mots vides français les plus fréquents dans une formulation de recherche. La liste est
// volontairement courte : un mot vide oublié coûte un appel de filtre en plus, pas un
// résultat faux.
const MOTS_VIDES = new Set([
  'les', 'des', 'une', 'nos', 'vos', 'leur', 'leurs', 'pour', 'avec', 'dans', 'sur', 'par',
  'que', 'qui', 'quoi', 'est', 'sont', 'ont', 'aux', 'ses', 'mes', 'tes', 'ces', 'cet',
  'cette', 'indicateur', 'indicateurs', 'collection', 'collections',
])

export const normaliser = (texte: string): string =>
  texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/gu, '')
    .toLowerCase()

/**
 * Découpe la formulation de l'utilisateur en termes exploitables par le filtre `recherche`
 * de l'API. Les mots vides et les termes trop courts sont retirés : ils ramèneraient tout
 * le catalogue et ne discriminent rien.
 */
export const decouperEnTermes = (requete: string): string[] => {
  const termes = normaliser(requete)
    .split(/[^a-z0-9]+/u)
    .filter((terme) => terme.length >= LONGUEUR_MIN_TERME && !MOTS_VIDES.has(terme))
  return [...new Set(termes)]
}

/**
 * Classe l'union des résultats de filtre par nombre de termes satisfaits, décroissant.
 * Les candidats qui n'en satisfont aucun sont écartés — ils viennent d'un appel dont le
 * terme matchait ailleurs.
 */
export const classerParTermesSatisfaits = (
  candidats: ReadonlyArray<EntiteTrouvee>,
  termes: ReadonlyArray<string>,
): EntiteTrouvee[] => {
  const parId = new Map<string, { entite: EntiteTrouvee; score: number }>()

  for (const candidat of candidats) {
    if (parId.has(candidat.publicId)) continue
    const nom = normaliser(candidat.nom)
    const score = termes.filter((terme) => nom.includes(terme)).length
    if (score === 0) continue
    parId.set(candidat.publicId, { entite: candidat, score })
  }

  return [...parId.values()]
    .sort((gauche, droite) => droite.score - gauche.score)
    .map((entree) => entree.entite)
}

/**
 * Ne garde que les candidats présents au catalogue réellement récupéré. Un sous-modèle peut
 * inventer un identifiant plausible ; le catalogue, lui, est déjà filtré par les
 * habilitations. C'est le garde-fou qui rend l'invention sans effet.
 */
export const filtrerHallucinations = <TCandidat, TReference extends { publicId: string }>(
  candidats: ReadonlyArray<TCandidat>,
  catalogue: ReadonlyArray<TReference>,
  obtenirId: (candidat: TCandidat) => string,
): TReference[] => {
  const parId = new Map(catalogue.map((entree) => [entree.publicId, entree]))
  return candidats.flatMap((candidat) => {
    const reference = parId.get(obtenirId(candidat))
    return reference === undefined ? [] : [reference]
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-api test -- prefiltrer`
Expected: PASS — 10 tests

- [ ] **Step 5: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/assistant/tools/metier
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): prefiltre deterministe de recherche d'entite"
```

---

## Task 9: Outils de recherche d'entité

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/metier/searchIndicateurs.ts`
- Create: `apps/kpilote-api/src/assistant/tools/metier/searchCollections.ts`
- Test: `apps/kpilote-api/src/assistant/tools/metier/searchIndicateurs.test.ts`

**Interfaces:**
- Consumes: `decouperEnTermes`, `classerParTermesSatisfaits`, `filtrerHallucinations` (Task 8) ; `listIndicateurs`, `listCollections` ; `creerModeleAssistant`, `TEMPERATURE_STRUCTUREE`, `MAX_CANDIDATS_CLASSEMENT`, `MAX_CATALOGUE_REPLI` (Task 5) ; `inputRechercheSchema`, `type SearchOutput` (Task 3)
- Produces: `rechercherEntites(params): Promise<SearchOutput>`, `creerSearchIndicateursTool(): Tool`, `creerSearchCollectionsTool(): Tool`

- [ ] **Step 1: Write the failing test**

Create `apps/kpilote-api/src/assistant/tools/metier/searchIndicateurs.test.ts`:

```ts
import { type EntiteTrouvee } from '@pilote/kpilote-shared/assistant/tools'
import { describe, expect, it, vi } from 'vitest'

import { rechercherEntites } from '@/assistant/tools/metier/searchIndicateurs'

const catalogue: EntiteTrouvee[] = [
  { publicId: 'IND-1', nom: 'Recouvrement de la fraude fiscale' },
  { publicId: 'IND-2', nom: 'Délais de paiement' },
  { publicId: 'IND-3', nom: 'Violences sexistes et sexuelles' },
]

const filtrerParTerme = async (terme: string) =>
  catalogue.filter((entite) => entite.nom.toLowerCase().includes(terme))

describe('rechercherEntites', () => {
  it('renvoie directement le candidat unique, sans appeler le modèle', async () => {
    const classer = vi.fn()
    const sortie = await rechercherEntites({
      requete: 'délais de paiement',
      filtrerParTerme,
      chargerCatalogue: async () => catalogue,
      classer,
    })

    expect(sortie.resultats).toEqual([{ publicId: 'IND-2', nom: 'Délais de paiement' }])
    expect(sortie.repli).toBe(false)
    expect(classer).not.toHaveBeenCalled()
  })

  it('fait classer par le modèle quand plusieurs candidats subsistent', async () => {
    const classer = vi.fn(async () => [{ id: 'IND-1' }])
    const sortie = await rechercherEntites({
      requete: 'fraude fiscale paiement',
      filtrerParTerme,
      chargerCatalogue: async () => catalogue,
      classer,
    })

    expect(classer).toHaveBeenCalledOnce()
    expect(sortie.resultats.map((entite) => entite.publicId)).toEqual(['IND-1'])
  })

  it('retombe sur le catalogue complet quand le pré-filtre ne trouve rien — cas des acronymes', async () => {
    const classer = vi.fn(async () => [{ id: 'IND-3' }])
    const sortie = await rechercherEntites({
      requete: 'les VSS',
      filtrerParTerme,
      chargerCatalogue: async () => catalogue,
      classer,
    })

    expect(sortie.repli).toBe(true)
    expect(sortie.resultats.map((entite) => entite.publicId)).toEqual(['IND-3'])
  })

  it('refuse le repli plutôt que de tronquer un catalogue trop large', async () => {
    const gros = Array.from({ length: 400 }, (_, index) => ({
      publicId: `IND-${index}`,
      nom: `Indicateur ${index}`,
    }))
    const classer = vi.fn()
    const sortie = await rechercherEntites({
      requete: 'zzz',
      filtrerParTerme: async () => [],
      chargerCatalogue: async () => gros,
      classer,
    })

    expect(sortie.resultats).toEqual([])
    expect(sortie.raison).toContain('trop large')
    expect(classer).not.toHaveBeenCalled()
  })

  it('écarte un identifiant que le modèle a inventé', async () => {
    const classer = vi.fn(async () => [{ id: 'IND-999' }, { id: 'IND-1' }])
    const sortie = await rechercherEntites({
      requete: 'fraude fiscale paiement',
      filtrerParTerme,
      chargerCatalogue: async () => catalogue,
      classer,
    })

    expect(sortie.resultats.map((entite) => entite.publicId)).toEqual(['IND-1'])
  })

  it('renvoie vide avec une raison quand la requête n’a aucun terme exploitable', async () => {
    const classer = vi.fn()
    const sortie = await rechercherEntites({
      requete: 'et le ?',
      filtrerParTerme,
      chargerCatalogue: async () => catalogue,
      classer,
    })

    expect(sortie.resultats).toEqual([])
    expect(sortie.raison).toBeDefined()
    expect(classer).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-api test -- searchIndicateurs`
Expected: FAIL — module introuvable

- [ ] **Step 3: Écrire `searchIndicateurs.ts`**

```ts
import {
  inputRechercheSchema,
  type EntiteTrouvee,
  type SearchOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { generateText, Output, stepCountIs, tool, type Tool } from 'ai'
import { z } from 'zod'

import {
  classerParTermesSatisfaits,
  decouperEnTermes,
  filtrerHallucinations,
} from '@/assistant/tools/metier/prefiltrer'
import {
  creerModeleAssistant,
  MAX_CANDIDATS_CLASSEMENT,
  MAX_CATALOGUE_REPLI,
  TEMPERATURE_STRUCTUREE,
} from '@/assistant/runtime/modele'
import { logger } from '@/framework/logger/logger'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'

const PAGE_MAX = 100 // `pageSizeSchema` plafonne à 100 : ne jamais demander davantage.

const classementSchema = z.object({
  resultats: z
    .array(z.object({ id: z.string() }))
    .max(10)
    .describe('Identifiants retenus, du plus pertinent au moins pertinent.'),
})

export type Classeur = (
  requete: string,
  candidats: ReadonlyArray<EntiteTrouvee>,
) => Promise<ReadonlyArray<{ id: string }>>

/**
 * Résout un libellé approximatif en identifiants, en trois temps.
 *
 * 1. Pré-filtre déterministe par le filtre `recherche` de l'API, terme par terme.
 * 2. Court-circuit : zéro ou un candidat n'appelle pas le modèle.
 * 3. Classement par sous-modèle sur les candidats restants, puis filtrage anti-invention.
 *
 * Le repli sur catalogue complet existe parce que le pré-filtre est un `LIKE` : il échoue
 * sur les acronymes, précisément là où ppg brillait. On le borne et on le journalise plutôt
 * que d'en faire le cas nominal.
 */
export const rechercherEntites = async ({
  requete,
  filtrerParTerme,
  chargerCatalogue,
  classer,
}: {
  requete: string
  filtrerParTerme: (terme: string) => Promise<EntiteTrouvee[]>
  chargerCatalogue: () => Promise<EntiteTrouvee[]>
  classer: Classeur
}): Promise<SearchOutput> => {
  const termes = decouperEnTermes(requete)

  const parFiltre = termes.length === 0 ? [] : (await Promise.all(termes.map(filtrerParTerme))).flat()
  let candidats = classerParTermesSatisfaits(parFiltre, termes)
  let repli = false

  if (candidats.length === 0) {
    const catalogue = await chargerCatalogue()

    if (catalogue.length > MAX_CATALOGUE_REPLI) {
      // Pas de troncature silencieuse : une liste coupée se lit comme « rien trouvé ».
      return {
        resultats: [],
        repli: false,
        raison: `Le catalogue accessible est trop large (${catalogue.length} entrées) pour une recherche exhaustive. Demande à l'utilisateur de préciser sa demande.`,
      }
    }

    if (catalogue.length === 0) {
      return { resultats: [], repli: false, raison: 'Aucune entité accessible.' }
    }

    repli = true
    candidats = catalogue
    logger.info(
      {
        event: 'assistant.recherche.repli',
        nbCandidatsPrefiltre: 0,
        tailleCatalogue: catalogue.length,
      },
      'Recherche — repli sur le catalogue complet',
    )
  }

  if (candidats.length === 1) return { resultats: candidats, repli }

  const classement = await classer(requete, candidats.slice(0, MAX_CANDIDATS_CLASSEMENT))
  const resultats = filtrerHallucinations(classement, candidats, (candidat) => candidat.id)

  return resultats.length === 0
    ? { resultats: [], repli, raison: 'Aucune entité ne correspond à la demande.' }
    : { resultats, repli }
}

const SYSTEM_PROMPT = `Tu reçois une requête utilisateur en langage naturel et une liste de candidats.
Ta tâche : renvoyer les identifiants des candidats qui correspondent à la requête, du plus pertinent au moins pertinent, au maximum 10.
Recopie les identifiants EXACTEMENT tels qu'ils apparaissent. N'en invente jamais.
Prends en compte les acronymes, les synonymes métier et les thématiques de politique publique.
Si aucun candidat ne correspond, renvoie une liste vide.`

export const creerClasseurLlm =
  (abortSignal?: AbortSignal): Classeur =>
  async (requete, candidats) => {
    const sortie = await generateText({
      model: creerModeleAssistant(),
      system: SYSTEM_PROMPT,
      prompt: `${requete}\n\n<candidats>\n${JSON.stringify(candidats)}\n</candidats>`,
      output: Output.object({ schema: classementSchema }),
      stopWhen: stepCountIs(3),
      temperature: TEMPERATURE_STRUCTUREE,
      abortSignal,
    })
    return sortie.output.resultats
  }

const DESCRIPTION = `Identifie des indicateurs (IND-XXX) à partir d'une requête en langage naturel, quand l'utilisateur ne connaît pas leur identifiant.

Utilise cet outil quand l'utilisateur mentionne une thématique, un acronyme ou un libellé approximatif sans donner d'identifiant — « l'indicateur sur la fraude fiscale », « les délais de paiement ».

N'utilise PAS cet outil quand l'utilisateur a déjà fourni un IND-XXX explicite : appelle directement get_indicateur ou get_synthese_indicateur.

Renvoie au maximum 10 indicateurs, avec leur identifiant et leur nom uniquement. Aucune donnée de valeur ou d'avancement — utilise les autres outils pour cela. Quand \`resultats\` est vide, \`raison\` explique pourquoi : rapporte-la à l'utilisateur.`

export const creerSearchIndicateursTool = (): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: inputRechercheSchema,
    execute: async ({ requete }, { abortSignal }): Promise<SearchOutput> =>
      rechercherEntites({
        requete,
        // Les deux chargements passent par la query, donc par `withIndicateurReadPermission` :
        // le catalogue est déjà restreint à ce que le principal peut lire.
        filtrerParTerme: async (terme) =>
          listIndicateurs({ recherche: terme, pageSize: PAGE_MAX }).match(
            (data) => data.items.map((item) => ({ publicId: item.id, nom: item.nom })),
            () => [],
          ),
        chargerCatalogue: async () =>
          listIndicateurs({ pageSize: PAGE_MAX }).match(
            (data) => data.items.map((item) => ({ publicId: item.id, nom: item.nom })),
            () => [],
          ),
        classer: creerClasseurLlm(abortSignal),
      }),
  })
```

- [ ] **Step 4: Écrire `searchCollections.ts`**

```ts
import {
  inputRechercheSchema,
  type SearchOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'

import { listCollections } from '@/collection/queries/listCollections'
import { creerClasseurLlm, rechercherEntites } from '@/assistant/tools/metier/searchIndicateurs'

const PAGE_MAX = 100

const DESCRIPTION = `Identifie des collections (COL-XXX) à partir d'une requête en langage naturel, quand l'utilisateur ne connaît pas leur identifiant.

Utilise cet outil quand l'utilisateur évoque un regroupement d'indicateurs par son thème ou son intitulé approximatif, sans donner d'identifiant.

N'utilise PAS cet outil quand un COL-XXX explicite est fourni : appelle directement get_collection ou get_synthese_collection.

Renvoie au maximum 10 collections, avec leur identifiant et leur nom uniquement. Quand \`resultats\` est vide, \`raison\` explique pourquoi : rapporte-la à l'utilisateur.`

export const creerSearchCollectionsTool = (): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: inputRechercheSchema,
    execute: async ({ requete }, { abortSignal }): Promise<SearchOutput> =>
      rechercherEntites({
        requete,
        filtrerParTerme: async (terme) =>
          listCollections({ recherche: terme, pageSize: PAGE_MAX }).match(
            (data) => data.items.map((item) => ({ publicId: item.id, nom: item.nom })),
            () => [],
          ),
        chargerCatalogue: async () =>
          listCollections({ pageSize: PAGE_MAX }).match(
            (data) => data.items.map((item) => ({ publicId: item.id, nom: item.nom })),
            () => [],
          ),
        classer: creerClasseurLlm(abortSignal),
      }),
  })
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-api test -- searchIndicateurs`
Expected: PASS — 6 tests

- [ ] **Step 6: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/assistant/tools/metier
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): outils de recherche avec court-circuits et repli borne"
```

---

## Task 10: Outils de synthèse composés

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/metier/composerAppels.ts`
- Create: `apps/kpilote-api/src/assistant/tools/metier/getSyntheseIndicateur.ts`
- Create: `apps/kpilote-api/src/assistant/tools/metier/getSyntheseCollection.ts`
- Test: `apps/kpilote-api/src/assistant/tools/metier/composerAppels.test.ts`

**Interfaces:**
- Consumes: `Requeteur` (Task 7) ; `inputIdIndicateurSchema`, `inputIdCollectionSchema`, `type BrancheSynthese`, `type SyntheseIndicateurOutput`, `type SyntheseCollectionOutput` (Task 3)
- Produces: `composerAppels<T>(requeteur, appels): Promise<T>`, `creerGetSyntheseIndicateurTool(requeteur): Tool`, `creerGetSyntheseCollectionTool(requeteur): Tool`

- [ ] **Step 1: Write the failing test**

Create `apps/kpilote-api/src/assistant/tools/metier/composerAppels.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

import { composerAppels } from '@/assistant/tools/metier/composerAppels'
import { creerGetSyntheseIndicateurTool } from '@/assistant/tools/metier/getSyntheseIndicateur'

describe('composerAppels', () => {
  it('assemble les réponses sous les clés demandées', async () => {
    const requeteur = vi.fn(async (url: string) => new Response(JSON.stringify({ url })))
    const resultat = await composerAppels(requeteur, { a: '/un', b: '/deux' })

    expect(resultat).toEqual({
      a: { donnees: { url: '/un' } },
      b: { donnees: { url: '/deux' } },
    })
  })

  it('lance les appels en parallèle', async () => {
    const enCours: string[] = []
    const requeteur = vi.fn(async (url: string) => {
      enCours.push(url)
      expect(enCours).toHaveLength(2)
      return new Response('{}')
    })
    await composerAppels(requeteur, { a: '/un', b: '/deux' })
  })

  it('porte la raison d’indisponibilité plutôt qu’un null nu', async () => {
    const requeteur = vi.fn(async () => new Response('non', { status: 403 }))
    const resultat = await composerAppels(requeteur, { a: '/un' })

    expect(resultat.a).toEqual({ indisponible: expect.stringContaining('403') })
  })

  it('distingue un refus de droit d’une absence de données', async () => {
    const requeteur = vi.fn(async (url: string) =>
      url === '/interdit' ? new Response('', { status: 403 }) : new Response('{"items":[]}'),
    )
    const resultat = await composerAppels(requeteur, { vide: '/ok', refuse: '/interdit' })

    expect(resultat.vide).toEqual({ donnees: { items: [] } })
    expect('indisponible' in (resultat.refuse as object)).toBe(true)
  })
})

describe('get_synthese_indicateur', () => {
  it('appelle les cinq branches de la synthèse', async () => {
    const vues: string[] = []
    const requeteur = vi.fn(async (url: string) => {
      vues.push(url)
      return new Response('{}')
    })

    const outil = creerGetSyntheseIndicateurTool(requeteur)
    await outil.execute?.({ id: 'IND-42' }, { toolCallId: 't', messages: [] })

    expect(vues.sort()).toEqual(
      [
        '/indicateurs/IND-42',
        '/indicateurs/IND-42/objectifs',
        '/indicateurs/IND-42/synthese-individus',
        '/indicateurs/IND-42/taux-progression',
        '/indicateurs/IND-42/valeurs-remarquables',
      ].sort(),
    )
  })

  it('rejette un identifiant mal formé avant tout appel', () => {
    const requeteur = vi.fn(async () => new Response('{}'))
    const outil = creerGetSyntheseIndicateurTool(requeteur)

    expect(outil.inputSchema.safeParse({ id: 'IND-quarante-deux' }).success).toBe(false)
    expect(outil.inputSchema.safeParse({ id: 'IND-42' }).success).toBe(true)
    expect(requeteur).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-api test -- composerAppels`
Expected: FAIL — modules introuvables

- [ ] **Step 3: Écrire `composerAppels.ts`**

```ts
import { type BrancheSynthese } from '@pilote/kpilote-shared/assistant/tools'

import { type Requeteur } from '@/assistant/tools/requeteur'

/**
 * Joue plusieurs appels documentés en parallèle et les assemble sous un seul objet.
 *
 * Les queries sous-jacentes prennent un `params` typé par leur schéma de query string :
 * passer par les routes évite de le reconstruire, et applique les mêmes habilitations.
 *
 * Une branche en échec porte SA RAISON plutôt qu'un `null` nu — sans quoi le modèle lit un
 * refus de droit comme « pas de données » et l'affirme à l'utilisateur.
 */
export const composerAppels = async <T extends Record<string, BrancheSynthese<unknown>>>(
  requeteur: Requeteur,
  appels: Record<keyof T & string, string>,
): Promise<T> => {
  const entrees = Object.entries(appels) as Array<[keyof T & string, string]>

  const branches = await Promise.all(
    entrees.map(async ([, url]): Promise<BrancheSynthese<unknown>> => {
      const reponse = await requeteur(url)
      if (!reponse.ok) {
        return {
          indisponible:
            reponse.status === 403
              ? `Accès refusé (statut ${reponse.status}) : l'utilisateur n'a pas les droits sur cette donnée.`
              : `Donnée non récupérée (statut ${reponse.status}).`,
        }
      }
      return { donnees: (await reponse.json()) as unknown }
    }),
  )

  return Object.fromEntries(entrees.map(([cle], index) => [cle, branches[index]])) as T
}
```

- [ ] **Step 4: Écrire `getSyntheseIndicateur.ts`**

```ts
import {
  inputIdIndicateurSchema,
  type SyntheseIndicateurOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'

import { composerAppels } from '@/assistant/tools/metier/composerAppels'
import { type Requeteur } from '@/assistant/tools/requeteur'

const DESCRIPTION = `Dresse en un seul appel l'état complet d'un indicateur : son identité, son taux de progression, ses valeurs remarquables, ses objectifs et la synthèse par individu.

Préfère TOUJOURS cet outil à l'enchaînement d'appels unitaires quand l'utilisateur demande « où en est » un indicateur, son avancement, son état ou une synthèse.

Nécessite un identifiant au format IND-XXX. Si l'utilisateur n'en fournit pas, résous-le d'abord avec search_indicateurs.

Chaque section est soit \`{ donnees }\`, soit \`{ indisponible }\` avec la raison. Une section indisponible pour cause de droits n'est PAS une absence de donnée : ne l'annonce jamais comme telle.`

export const creerGetSyntheseIndicateurTool = (requeteur: Requeteur): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: inputIdIndicateurSchema,
    execute: async ({ id }): Promise<SyntheseIndicateurOutput> =>
      composerAppels<SyntheseIndicateurOutput>(requeteur, {
        identite: `/indicateurs/${id}`,
        tauxProgression: `/indicateurs/${id}/taux-progression`,
        valeursRemarquables: `/indicateurs/${id}/valeurs-remarquables`,
        objectifs: `/indicateurs/${id}/objectifs`,
        syntheseIndividus: `/indicateurs/${id}/synthese-individus`,
      }),
  })
```

- [ ] **Step 5: Écrire `getSyntheseCollection.ts`**

```ts
import {
  inputIdCollectionSchema,
  type SyntheseCollectionOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'

import { composerAppels } from '@/assistant/tools/metier/composerAppels'
import { type Requeteur } from '@/assistant/tools/requeteur'

const DESCRIPTION = `Dresse en un seul appel l'état d'une collection : son identité, les indicateurs qu'elle regroupe et son taux de progression.

Préfère TOUJOURS cet outil à l'enchaînement d'appels unitaires quand l'utilisateur demande où en est une collection ou son avancement d'ensemble.

Nécessite un identifiant au format COL-XXX. Si l'utilisateur n'en fournit pas, résous-le d'abord avec search_collections.

Chaque section est soit \`{ donnees }\`, soit \`{ indisponible }\` avec la raison.`

export const creerGetSyntheseCollectionTool = (requeteur: Requeteur): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: inputIdCollectionSchema,
    execute: async ({ id }): Promise<SyntheseCollectionOutput> =>
      composerAppels<SyntheseCollectionOutput>(requeteur, {
        identite: `/collections/${id}`,
        tauxProgression: `/collections/${id}/taux-progression`,
      }),
  })
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-api test -- composerAppels`
Expected: PASS — 6 tests

- [ ] **Step 7: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/assistant/tools/metier
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): outils de synthese composes avec raison d'indisponibilite"
```

---

## Task 11: Registry par surface et composition du prompt

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/registry.ts`
- Create: `apps/kpilote-api/src/assistant/prompts/socle.ts`
- Create: `apps/kpilote-api/src/assistant/prompts/surfaces/askLibre.ts`
- Create: `apps/kpilote-api/src/assistant/prompts/runtime.ts`
- Create: `apps/kpilote-api/src/assistant/prompts/construireSystemPrompt.ts`
- Test: `apps/kpilote-api/src/assistant/prompts/construireSystemPrompt.test.ts`
- Test: `apps/kpilote-api/src/assistant/tools/registry.test.ts`

**Interfaces:**
- Consumes: `WHITELIST`, `deriverTool`, `Requeteur` (Task 7) ; les quatre `creer*Tool` (Tasks 9-10) ; `Surface` (Task 2)
- Produces: `resoudreOutils(surface: Surface, requeteur: Requeteur): ToolSet`, `construireSystemPrompt({ surface, maintenant }): string`, `SOCLE`

- [ ] **Step 1: Write the failing tests**

Create `apps/kpilote-api/src/assistant/prompts/construireSystemPrompt.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { construireSystemPrompt } from '@/assistant/prompts/construireSystemPrompt'
import { SOCLE } from '@/assistant/prompts/socle'

const maintenant = new Date('2026-08-31T10:00:00Z')

describe('construireSystemPrompt', () => {
  it('empile le socle, la couche de surface et le contexte runtime', () => {
    const prompt = construireSystemPrompt({ surface: 'ask-libre', maintenant })
    expect(prompt.startsWith(SOCLE)).toBe(true)
    expect(prompt).toContain('2026-08-31')
  })

  it('reste court : le socle part à chaque tour', () => {
    expect(SOCLE.split('\n').length).toBeLessThan(45)
  })

  it("n'embarque ni glossaire métier ni catalogue d'entités", () => {
    const prompt = construireSystemPrompt({ surface: 'ask-libre', maintenant })
    expect(prompt).not.toContain('IND-1')
    expect(prompt).not.toContain('Glossaire')
  })

  it('ne porte pas de directive de raisonnement non mesurée', () => {
    expect(SOCLE).not.toContain('Reasoning')
  })
})
```

Create `apps/kpilote-api/src/assistant/tools/registry.test.ts`:

```ts
import { NOMS_OUTILS } from '@pilote/kpilote-shared/assistant/tools'
import { describe, expect, it } from 'vitest'

import { resoudreOutils } from '@/assistant/tools/registry'

const requeteur = async () => new Response('{}')

describe('resoudreOutils', () => {
  it('expose douze outils pour la surface ask-libre', () => {
    expect(Object.keys(resoudreOutils('ask-libre', requeteur))).toHaveLength(12)
  })

  it('couvre exactement les noms déclarés dans le contrat partagé', () => {
    const noms = Object.keys(resoudreOutils('ask-libre', requeteur)).sort()
    expect(noms).toEqual([...NOMS_OUTILS].sort())
  })

  it('donne une description non vide à chaque outil', () => {
    const outils = resoudreOutils('ask-libre', requeteur)
    expect(Object.values(outils).every((outil) => (outil.description ?? '').length > 0)).toBe(true)
  })

  it("n'expose pas les routes que get_synthese_indicateur compose déjà", () => {
    const noms = Object.keys(resoudreOutils('ask-libre', requeteur))
    expect(noms).not.toContain('get_indicateur_taux_progression')
    expect(noms).not.toContain('get_indicateur_objectifs')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @pilote/kpilote-api test -- construireSystemPrompt registry`
Expected: FAIL — modules introuvables

- [ ] **Step 3: Écrire `socle.ts`**

```ts
// Invariants, envoyés à CHAQUE tour. Tout ce qui n'est pas invariant appartient à une
// couche de surface ou au contexte runtime.
//
// N'y figurent volontairement pas :
// - le glossaire métier : il vit dans les .describe() des schémas partagés et dans les
//   descriptions des routes, que le modèle reçoit avec les outils, au moment pertinent ;
// - la liste des entités accessibles : elle peut compter des centaines d'entrées, et sa
//   résolution est le travail de search_indicateurs / search_collections ;
// - `Reasoning: high` : le PRD de ppg recommande de le retirer faute de gain mesuré.
export const SOCLE = `Tu es l'assistant de kpilote, l'outil de pilotage d'indicateurs de politiques publiques de la DITP.

Règles invariantes :
- N'invente jamais une donnée. Toute valeur chiffrée que tu cites doit provenir d'un appel d'outil réalisé dans ce tour.
- Si une donnée manque ou qu'un outil ne renvoie rien, dis-le explicitement plutôt que de combler.
- Une section marquée indisponible pour cause de droits n'est PAS une absence de donnée : dis que l'utilisateur n'y a pas accès, jamais qu'il n'y a rien.
- N'écris jamais un appel d'outil en pseudo-code dans ta réponse. Utilise le mécanisme d'appel d'outil.
- Reste dans le périmètre kpilote : indicateurs, collections, valeurs d'avancement, référentiels et individus.
- Tu peux hiérarchiser factuellement sur la base des données. Tu ne formules pas d'avis personnel ni de recommandation que les données ne justifient pas.
- Réponds en français, en prose courte. Un tableau seulement quand plusieurs entités se comparent sur les mêmes colonnes.
- Nomme toujours une entité par son libellé suivi de son identifiant entre parenthèses, par exemple « Fraude fiscale (IND-42) ».`
```

- [ ] **Step 4: Écrire `surfaces/askLibre.ts`**

```ts
// Politique de dialogue et de rendu de la surface « question libre depuis la palette ».
// L'appelant ne fournit aucun contexte : tout part de la question.
export const ASK_LIBRE = `Contexte d'usage : l'utilisateur t'interroge depuis la palette de commandes, sans avoir désigné d'entité. Sa question peut être vague.

Politique de dialogue :
- Si la question désigne une entité par un libellé approximatif, résous-la d'abord avec search_indicateurs ou search_collections, puis enchaîne sans demander confirmation quand un seul résultat ressort clairement.
- Si plusieurs entités correspondent, présente-les et demande laquelle avant d'aller plus loin.
- Si une recherche renvoie une liste vide, rapporte la raison qu'elle fournit au lieu de conclure toi-même à l'absence.
- Si la question est trop vague pour choisir un outil, pose UNE question de précision, pas une liste.
- Si la question sort du périmètre kpilote, dis-le en une phrase et arrête-toi.

Politique de rendu :
- Ouvre par la réponse, pas par un rappel de la question.
- Les sources sont affichées automatiquement sous ta réponse : ne dresse pas toi-même de liste de références en fin de message.`
```

- [ ] **Step 5: Écrire `runtime.ts`**

```ts
export const construireContexteRuntime = ({ maintenant }: { maintenant: Date }): string =>
  `Contexte du tour :
- Date du jour : ${maintenant.toISOString().slice(0, 10)}`
```

- [ ] **Step 6: Écrire `construireSystemPrompt.ts`**

```ts
import { type Surface } from '@pilote/kpilote-shared/assistant/surfaces'

import { construireContexteRuntime } from '@/assistant/prompts/runtime'
import { SOCLE } from '@/assistant/prompts/socle'
import { ASK_LIBRE } from '@/assistant/prompts/surfaces/askLibre'

// `Record<Surface, string>` : ajouter une surface à SURFACES fait échouer la compilation
// ici tant qu'elle n'a pas sa couche de prompt. Le compilateur tient la liste de ce qui
// reste à faire — c'est ce qui remplace des fichiers de prompt écrits d'avance.
const PROMPTS_SURFACE: Record<Surface, string> = {
  'ask-libre': ASK_LIBRE,
}

export const construireSystemPrompt = ({
  surface,
  maintenant,
}: {
  surface: Surface
  maintenant: Date
}): string =>
  [SOCLE, PROMPTS_SURFACE[surface], construireContexteRuntime({ maintenant })].join('\n\n')
```

- [ ] **Step 7: Écrire `registry.ts`**

```ts
import { type Surface } from '@pilote/kpilote-shared/assistant/surfaces'
import { type NomOutil } from '@pilote/kpilote-shared/assistant/tools'
import { type ToolSet } from 'ai'

import { deriverTool } from '@/assistant/tools/deriverTool'
import { creerGetSyntheseCollectionTool } from '@/assistant/tools/metier/getSyntheseCollection'
import { creerGetSyntheseIndicateurTool } from '@/assistant/tools/metier/getSyntheseIndicateur'
import { creerSearchCollectionsTool } from '@/assistant/tools/metier/searchCollections'
import { creerSearchIndicateursTool } from '@/assistant/tools/metier/searchIndicateurs'
import { type Requeteur } from '@/assistant/tools/requeteur'
import { WHITELIST } from '@/assistant/tools/whitelist'

const OUTILS_PAR_SURFACE: Record<Surface, ReadonlyArray<NomOutil>> = {
  'ask-libre': [
    'search_indicateurs',
    'search_collections',
    'get_synthese_indicateur',
    'get_synthese_collection',
    ...WHITELIST.map((entree) => entree.nom),
  ],
}

export const resoudreOutils = (surface: Surface, requeteur: Requeteur): ToolSet => {
  const metier: ToolSet = {
    search_indicateurs: creerSearchIndicateursTool(),
    search_collections: creerSearchCollectionsTool(),
    get_synthese_indicateur: creerGetSyntheseIndicateurTool(requeteur),
    get_synthese_collection: creerGetSyntheseCollectionTool(requeteur),
  }
  const derives: ToolSet = Object.fromEntries(
    WHITELIST.map((entree) => [entree.nom, deriverTool(entree, requeteur)]),
  )

  const autorises = new Set<string>(OUTILS_PAR_SURFACE[surface])
  return Object.fromEntries(
    Object.entries({ ...metier, ...derives }).filter(([nom]) => autorises.has(nom)),
  )
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `pnpm --filter @pilote/kpilote-api test -- construireSystemPrompt registry`
Expected: PASS — 8 tests

- [ ] **Step 9: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/assistant/prompts apps/kpilote-api/src/assistant/tools/registry.ts apps/kpilote-api/src/assistant/tools/registry.test.ts
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): registry par surface et composition du prompt en couches"
```

---

## Task 12: Résolution des sources

**Files:**
- Create: `apps/kpilote-api/src/assistant/runtime/sources.ts`
- Test: `apps/kpilote-api/src/assistant/runtime/sources.test.ts`

**Interfaces:**
- Consumes: `extraireReferences`, `type ReferenceSource`, `type Source` (Task 1) ; `listIndicateurs`, `listCollections` (avec `ids`, Task 6) ; `listReferentiels`, `listIndividus`
- Produces: `resoudreSources(references: ReferenceSource[]): Promise<Source[]>`

- [ ] **Step 1: Write the failing test**

Create `apps/kpilote-api/src/assistant/runtime/sources.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { resoudreSources } from '@/assistant/runtime/sources'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

describe('resoudreSources', () => {
  it(
    'résout libellé et chemin front pour un indicateur lisible',
    integrationTest(async () => {
      const cle = await fixtures.apiKey({ label: 'assistant' })
      const indicateur = await fixtures.indicateur({ nom: 'Fraude fiscale' })

      const sources = await runAsAdmin(cle.id, () =>
        resoudreSources([{ type: 'indicateur', publicId: indicateur.publicId }]),
      )

      expect(sources).toEqual([
        {
          type: 'indicateur',
          publicId: indicateur.publicId,
          libelle: 'Fraude fiscale',
          chemin: `/indicateurs/${indicateur.publicId}`,
        },
      ])
    }),
  )

  it(
    'écarte une source que le principal ne peut pas lire',
    integrationTest(async () => {
      const cle = await fixtures.apiKey({ label: 'assistant' })
      const indicateur = await fixtures.indicateur({ nom: 'Confidentiel', visibilite: 'PRIVE' })

      const sources = await runAsContributor(cle.id, () =>
        resoudreSources([{ type: 'indicateur', publicId: indicateur.publicId }]),
      )

      expect(sources).toEqual([])
    }),
  )

  it(
    'résout un individu sans lien plutôt que de l’omettre',
    integrationTest(async () => {
      const cle = await fixtures.apiKey({ label: 'assistant' })
      const referentiel = await fixtures.referentiel({ nom: 'Départements' })
      const individu = await fixtures.individu({ referentielId: referentiel.id, nom: 'Vaucluse' })

      const sources = await runAsAdmin(cle.id, () =>
        resoudreSources([{ type: 'individu', publicId: individu.publicId }]),
      )

      expect(sources).toEqual([
        {
          type: 'individu',
          publicId: individu.publicId,
          libelle: 'Vaucluse',
          chemin: null,
        },
      ])
    }),
  )

  it(
    'renvoie un tableau vide sans référence',
    integrationTest(async () => {
      const cle = await fixtures.apiKey({ label: 'assistant' })
      expect(await runAsAdmin(cle.id, () => resoudreSources([]))).toEqual([])
    }),
  )
})
```

> Adapter les appels `fixtures.referentiel` / `fixtures.individu` à leur signature réelle dans `src/test/fixtures.ts` — les noms de champs y sont fixés par les modèles Prisma.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-api test -- runtime/sources`
Expected: FAIL — module introuvable

- [ ] **Step 3: Write the implementation**

Create `apps/kpilote-api/src/assistant/runtime/sources.ts`:

```ts
import { type ReferenceSource, type Source, type TypeSource } from '@pilote/kpilote-shared/assistant/sources'

import { listCollections } from '@/collection/queries/listCollections'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'
import { listIndividus } from '@/individu/queries/listIndividus'
import { listReferentiels } from '@/referentiel/queries/listReferentiels'

const TAILLE_LOT = 100

// Les quatre types sont résolus, mais seuls deux ont une page de détail dans le front.
// Individus et référentiels sont affichés SANS lien plutôt qu'omis : une réponse entièrement
// fondée sur des individus afficherait sinon « aucune source », ce qui serait faux.
const CHEMINS: Record<TypeSource, ((publicId: string) => string) | null> = {
  indicateur: (publicId) => `/indicateurs/${publicId}`,
  collection: (publicId) => `/collections/${publicId}`,
  individu: null,
  referentiel: null,
}

const idsDeType = (references: ReadonlyArray<ReferenceSource>, type: TypeSource): string[] =>
  references.filter((reference) => reference.type === type).map((reference) => reference.publicId)

/**
 * Résout les libellés en lot. La résolution repasse par les queries, donc par les filtres
 * d'habilitation : une source que l'utilisateur ne peut pas lire disparaît du panneau. Le
 * sourcing est aussi un dernier filet de sécurité.
 */
export const resoudreSources = async (references: ReferenceSource[]): Promise<Source[]> => {
  const charger = async <T extends { id: string; nom: string }>(
    ids: string[],
    query: (ids: string[]) => Promise<T[]>,
  ): Promise<T[]> => (ids.length === 0 ? [] : query(ids))

  const [indicateurs, collections, referentiels, individus] = await Promise.all([
    charger(idsDeType(references, 'indicateur'), (ids) =>
      listIndicateurs({ ids, pageSize: TAILLE_LOT }).match(
        (data) => data.items,
        () => [],
      ),
    ),
    charger(idsDeType(references, 'collection'), (ids) =>
      listCollections({ ids, pageSize: TAILLE_LOT }).match(
        (data) => data.items,
        () => [],
      ),
    ),
    charger(idsDeType(references, 'referentiel'), async (ids) => {
      const page = await listReferentiels({ pageSize: TAILLE_LOT }).match(
        (data) => data.items,
        () => [],
      )
      return page.filter((item) => ids.includes(item.id))
    }),
    charger(idsDeType(references, 'individu'), async (ids) => {
      const page = await listIndividus({ pageSize: TAILLE_LOT }).match(
        (data) => data.items,
        () => [],
      )
      return page.filter((item) => ids.includes(item.id))
    }),
  ])

  // Les modèles d'API portent leur identifiant public sous `id`, pas `publicId`.
  const libelles = new Map<string, string>([
    ...indicateurs.map((item): [string, string] => [`indicateur:${item.id}`, item.nom]),
    ...collections.map((item): [string, string] => [`collection:${item.id}`, item.nom]),
    ...referentiels.map((item): [string, string] => [`referentiel:${item.id}`, item.nom]),
    ...individus.map((item): [string, string] => [`individu:${item.id}`, item.nom]),
  ])

  return references.flatMap((reference) => {
    const libelle = libelles.get(`${reference.type}:${reference.publicId}`)
    if (libelle === undefined) return []
    const construireChemin = CHEMINS[reference.type]
    return [
      { ...reference, libelle, chemin: construireChemin ? construireChemin(reference.publicId) : null },
    ]
  })
}
```

> Référentiels et individus sont filtrés après chargement faute de filtre `ids` sur leurs queries — contrairement aux indicateurs et collections. Si leur volumétrie dépasse `TAILLE_LOT`, leur ajouter `ids` comme on l'a fait pour les collections en tâche 6, plutôt que d'augmenter la page. Vérifier au passage les signatures réelles de `listReferentiels` et `listIndividus` et le nom de leur champ de libellé.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-api test -- runtime/sources`
Expected: PASS — 4 tests

- [ ] **Step 5: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/assistant/runtime
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): resolution des sources refiltree par les habilitations"
```

---

## Task 13: Runtime, route de conversation et persistance

**Files:**
- Create: `apps/kpilote-api/src/assistant/commands/enregistrerConversation.ts`
- Create: `apps/kpilote-api/src/assistant/runtime/AssistantRuntime.ts`
- Create: `apps/kpilote-api/src/assistant/routes.ts`
- Test: `apps/kpilote-api/src/assistant/commands/enregistrerConversation.test.ts`
- Test: `apps/kpilote-api/src/assistant/routes.test.ts`
- Modify: `apps/kpilote-api/src/app.ts` — enregistrer les routes

**Interfaces:**
- Consumes: `resoudreOutils`, `construireSystemPrompt` (Task 11) ; `resoudreSources` (Task 12) ; `extraireReferences` (Task 1) ; `creerRequeteur` (Task 7) ; `creerModeleAssistant`, `MAX_ETAPES`, `MODELE_PAR_DEFAUT`, `TEMPERATURE_CONVERSATION` (Task 5)
- Produces: `deriverTitre(messages): string`, `enregistrerConversation(params): Promise<void>`, `enregistrerAppel(params): Promise<void>`, `streamerTour(params): Promise<Response>`, `assistantRoutes`

- [ ] **Step 1: Write the failing tests**

Create `apps/kpilote-api/src/assistant/commands/enregistrerConversation.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { deriverTitre } from '@/assistant/commands/enregistrerConversation'

describe('deriverTitre', () => {
  it('reprend le premier message utilisateur', () => {
    const messages = [
      { role: 'assistant', parts: [{ type: 'text', text: 'Bonjour' }] },
      { role: 'user', parts: [{ type: 'text', text: 'Où en est la fraude fiscale ?' }] },
    ]
    expect(deriverTitre(messages)).toBe('Où en est la fraude fiscale ?')
  })

  it('tronque au-delà de quatre-vingts caractères', () => {
    const texte = 'a'.repeat(200)
    const titre = deriverTitre([{ role: 'user', parts: [{ type: 'text', text: texte }] }])
    expect(titre).toHaveLength(80)
    expect(titre.endsWith('…')).toBe(true)
  })

  it('retombe sur un titre par défaut sans message utilisateur exploitable', () => {
    expect(deriverTitre([])).toBe('Nouvelle conversation')
    expect(deriverTitre([{ role: 'user', parts: [] }])).toBe('Nouvelle conversation')
  })
})
```

Create `apps/kpilote-api/src/assistant/routes.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { assistantRoutes } from '@/assistant/routes'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

const buildApp = () => buildTestApp(assistantRoutes)
const conversationId = '018f3a2b-0000-7000-8000-000000000001'

const corps = (surcharge: Record<string, unknown> = {}) =>
  JSON.stringify({
    surface: 'ask-libre',
    conversationId,
    messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Bonjour' }] }],
    ...surcharge,
  })

const appeler = (cleBrute: string | null, body: string) =>
  buildApp().request('/assistant/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cleBrute ? { Authorization: `Bearer ${cleBrute}` } : {}),
    },
    body,
  })

describe('POST /assistant/chat', () => {
  it(
    'renvoie 401 sans authentification',
    integrationTest(async () => {
      expect((await appeler(null, corps())).status).toBe(401)
    }),
  )

  it(
    'renvoie 400 sur une surface que le moteur ne sert pas',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_surface_inconnue_ok'
      await fixtures.apiKey({ rawKey: cleBrute, label: 'assistant' })
      expect((await appeler(cleBrute, corps({ surface: 'ask-entite' }))).status).toBe(400)
    }),
  )

  it(
    'renvoie 400 quand conversationId n’est pas un uuid',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_uuid_invalide_okay'
      await fixtures.apiKey({ rawKey: cleBrute, label: 'assistant' })
      expect((await appeler(cleBrute, corps({ conversationId: 'pas-un-uuid' }))).status).toBe(400)
    }),
  )

  it(
    'renvoie 400 sur un modèle hors liste fermée',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_modele_hors_liste'
      await fixtures.apiKey({ rawKey: cleBrute, label: 'assistant' })
      expect((await appeler(cleBrute, corps({ modele: 'gpt-4' }))).status).toBe(400)
    }),
  )
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @pilote/kpilote-api test -- assistant/routes enregistrerConversation`
Expected: FAIL — modules introuvables

- [ ] **Step 3: Écrire `enregistrerConversation.ts`**

```ts
import { db } from '@/framework/persistence/dbStore'

const LONGUEUR_MAX_TITRE = 80

/** Premier message utilisateur, tronqué. Suffit à retrouver une conversation dans une liste. */
export const deriverTitre = (messages: ReadonlyArray<unknown>): string => {
  for (const message of messages) {
    const candidat = message as { role?: string; parts?: ReadonlyArray<unknown> }
    if (candidat.role !== 'user') continue
    const texte = (candidat.parts ?? [])
      .filter((part): part is { type: 'text'; text: string } => {
        const courante = part as { type?: string }
        return courante.type === 'text'
      })
      .map((part) => part.text)
      .join(' ')
      .trim()
    if (texte.length === 0) continue
    return texte.length > LONGUEUR_MAX_TITRE
      ? `${texte.slice(0, LONGUEUR_MAX_TITRE - 1)}…`
      : texte
  }
  return 'Nouvelle conversation'
}

// Aller-retour JSON explicite : le sérialiseur de Prisma plante sur les schémas zod que le
// SDK attache aux définitions d'outils présentes dans les parts.
const enPlainJson = (valeur: unknown): object => JSON.parse(JSON.stringify(valeur)) as object

export const enregistrerConversation = async ({
  id,
  utilisateurId,
  surface,
  messages,
}: {
  id: string
  utilisateurId: string
  surface: string
  messages: ReadonlyArray<unknown>
}): Promise<void> => {
  const blob = enPlainJson(messages)
  await db().assistantConversation.upsert({
    where: { id },
    create: { id, utilisateurId, surface, titre: deriverTitre(messages), messages: blob },
    update: { messages: blob },
  })
}

export const enregistrerAppel = async ({
  conversationId,
  utilisateurId,
  modele,
  surface,
  transcript,
  inputTokens,
  outputTokens,
  dureeMs,
}: {
  conversationId: string
  utilisateurId: string
  modele: string
  surface: string
  transcript: unknown
  inputTokens: number
  outputTokens: number
  dureeMs: number
}): Promise<void> => {
  await db().assistantAppel.create({
    data: {
      conversationId,
      utilisateurId,
      modele,
      surface,
      transcript: enPlainJson(transcript),
      inputTokens,
      outputTokens,
      dureeMs,
    },
  })
}
```

- [ ] **Step 4: Écrire `AssistantRuntime.ts`**

```ts
import { extraireReferences } from '@pilote/kpilote-shared/assistant/sources'
import { type Modele, type Surface } from '@pilote/kpilote-shared/assistant/surfaces'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai'

import {
  enregistrerAppel,
  enregistrerConversation,
} from '@/assistant/commands/enregistrerConversation'
import { construireSystemPrompt } from '@/assistant/prompts/construireSystemPrompt'
import {
  creerModeleAssistant,
  MAX_ETAPES,
  MODELE_PAR_DEFAUT,
  TEMPERATURE_CONVERSATION,
} from '@/assistant/runtime/modele'
import { resoudreSources } from '@/assistant/runtime/sources'
import { resoudreOutils } from '@/assistant/tools/registry'
import { type Requeteur } from '@/assistant/tools/requeteur'
import { runWithPrincipal, type Principal } from '@/framework/auth/userContext'
import { logger } from '@/framework/logger/logger'
import { prisma } from '@/framework/persistence/prisma'
import { runWithDb } from '@/framework/persistence/dbStore'
import { startTimer } from '@/framework/timer'

/**
 * Rétablit explicitement les contextes ambiants.
 *
 * Les callbacks du flux s'exécutent APRÈS que le handler a rendu la `Response` et que la
 * chaîne de middlewares s'est dénouée. S'en remettre à la propagation de
 * l'AsyncLocalStorage jusque-là n'est pas garanti : on obtiendrait un `dbStore is empty`
 * ou un `UnauthorizedError` levés dans le flux, par intermittence.
 */
const dansLeContexte = <T>(principal: Principal, fn: () => Promise<T>): Promise<T> =>
  runWithDb(prisma, () => runWithPrincipal(principal, fn)) as Promise<T>

export const streamerTour = async ({
  surface,
  conversationId,
  principal,
  utilisateurId,
  messages,
  modele,
  requeteur,
  abortSignal,
}: {
  surface: Surface
  conversationId: string
  principal: Principal
  utilisateurId: string
  messages: UIMessage[]
  modele: Modele
  requeteur: Requeteur
  abortSignal?: AbortSignal
}): Promise<Response> => {
  const elapsed = startTimer()

  const resultat = streamText({
    model: creerModeleAssistant(modele),
    system: construireSystemPrompt({ surface, maintenant: new Date() }),
    messages: await convertToModelMessages(messages),
    tools: resoudreOutils(surface, requeteur),
    stopWhen: stepCountIs(MAX_ETAPES),
    temperature: TEMPERATURE_CONVERSATION,
    abortSignal,
  })

  const flux = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      writer.merge(resultat.toUIMessageStream())

      const etapes = await resultat.steps
      const sortiesOutils = etapes.flatMap((etape) =>
        etape.toolResults.map((appel) => appel.output as unknown),
      )

      // Les sources sont dérivées de ce que les outils ont RÉELLEMENT renvoyé, pas citées
      // par le modèle : ni oubli ni invention possibles.
      const sources = await dansLeContexte(principal, () =>
        resoudreSources(extraireReferences(sortiesOutils)),
      )
      if (sources.length > 0) writer.write({ type: 'data-sources', data: sources })

      const usage = await resultat.usage
      logger.info(
        {
          event: 'assistant.tour.done',
          conversationId,
          surface,
          modele,
          durationMs: elapsed(),
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          outils: etapes.flatMap((etape) => etape.toolCalls.map((appel) => appel.toolName)),
        },
        'Assistant — tour terminé',
      )
    },
    onFinish: async ({ messages: messagesFinaux }) => {
      const usage = await resultat.usage
      await dansLeContexte(principal, async () => {
        // La conversation AVANT l'appel : AssistantAppel.conversationId la référence, la
        // contrainte de clé étrangère échouerait au premier tour dans l'autre ordre.
        await enregistrerConversation({
          id: conversationId,
          utilisateurId,
          surface,
          messages: messagesFinaux,
        })
        await enregistrerAppel({
          conversationId,
          utilisateurId,
          modele,
          surface,
          transcript: await resultat.response,
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          dureeMs: elapsed(),
        })
      })
    },
  })

  return createUIMessageStreamResponse({ stream: flux })
}
```

- [ ] **Step 5: Écrire `routes.ts`**

```ts
import { createRoute, z } from '@hono/zod-openapi'
import { chatRequestSchema } from '@pilote/kpilote-shared/assistant/surfaces'
import { validateUIMessages, type UIMessage } from 'ai'

import { app } from '@/app'
import { streamerTour } from '@/assistant/runtime/AssistantRuntime'
import { MODELE_PAR_DEFAUT } from '@/assistant/runtime/modele'
import { creerRequeteur } from '@/assistant/tools/requeteur'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { requireCurrentPrincipalId, requirePrincipal } from '@/framework/auth/userContext'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { erreur400 } from '@/framework/openapi/responses'

const ChatBodySchema = chatRequestSchema.openapi('AssistantChatBody')

const chatRoute = createRoute({
  method: 'post',
  path: '/assistant/chat',
  tags: ['Assistant'],
  summary: 'Ouvrir un tour de conversation avec l’assistant',
  description:
    "Streame la réponse de l'assistant au format UIMessage du SDK `ai` (flux SSE). La `surface` est déclarée par l'appelant et détermine la couche de prompt et les outils autorisés : le moteur ne déduit jamais l'intention du texte. Les sources consultées sont émises en fin de tour dans une part `data-sources`, dérivée des identifiants publics réellement renvoyés par les outils et refiltrée par les habilitations de l'appelant. Le paramètre `modele` permet de rejouer un même échange sur un autre modèle Albert.",
  middleware: [requireAuthentication],
  request: {
    body: { content: { 'application/json': { schema: ChatBodySchema } }, required: true },
  },
  responses: {
    200: {
      content: { 'text/event-stream': { schema: z.string() } },
      description: 'Flux de la réponse',
    },
    400: erreur400,
  },
})

export const assistantRoutes = createOpenApiHono()

assistantRoutes.openapi(chatRoute, async (context) => {
  const corps = context.req.valid('json')
  const jeton = (context.req.header('authorization') ?? '').replace(/^Bearer\s+/iu, '')
  const messages = (await validateUIMessages({ messages: corps.messages })) as UIMessage[]

  return streamerTour({
    surface: corps.surface,
    conversationId: corps.conversationId,
    // Capturés MAINTENANT : les callbacks du flux tournent après le dénouement des middlewares.
    principal: requirePrincipal(),
    utilisateurId: requireCurrentPrincipalId(),
    messages,
    modele: corps.modele ?? MODELE_PAR_DEFAUT,
    requeteur: creerRequeteur(app, jeton),
    abortSignal: context.req.raw.signal,
  })
})
```

- [ ] **Step 6: Enregistrer les routes dans l'app**

Dans `apps/kpilote-api/src/app.ts`, importer puis monter à la suite des autres :

```ts
import { assistantRoutes } from '@/assistant/routes'
```

```ts
app.route('/', assistantRoutes)
```

`routes.ts` importe `app` et `app.ts` importe `assistantRoutes` : ce cycle-ci est sans danger, `app` n'étant déréférencé qu'au moment de la requête. C'est justement pour éviter que ce cycle atteigne les outils que le requêteur leur est injecté.

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm --filter @pilote/kpilote-api test -- assistant/routes enregistrerConversation`
Expected: PASS — 7 tests

- [ ] **Step 8: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/assistant apps/kpilote-api/src/app.ts
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): route de conversation, runtime et persistance du tour"
```

---

## Task 14: Retour utilisateur

**Files:**
- Create: `packages/kpilote-shared/src/assistant/feedback.ts`
- Create: `apps/kpilote-api/src/assistant/commands/evaluerReponse.ts`
- Modify: `apps/kpilote-api/src/assistant/routes.ts` — ajouter la route d'évaluation
- Modify: `apps/kpilote-api/src/assistant/routes.test.ts` — ajouter les cas
- Modify: `packages/kpilote-shared/package.json` — export `./assistant/feedback`

**Interfaces:**
- Produces: `CATEGORIES_PROBLEME`, `type CategorieProbleme`, `LIBELLES_CATEGORIES`, `evaluerBodySchema`, `type EvaluerBody`, `evaluerReponse(params): Promise<void>`

- [ ] **Step 1: Write the failing test**

Ajouter à `apps/kpilote-api/src/assistant/routes.test.ts` :

```ts
const evaluer = (cleBrute: string, body: Record<string, unknown>) =>
  buildApp().request(`/assistant/conversations/${conversationId}/evaluation`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${cleBrute}` },
    body: JSON.stringify(body),
  })

describe('POST /assistant/conversations/{id}/evaluation', () => {
  it(
    'refuse un feedback négatif sans catégorie',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_eval_sans_categ_ok'
      await fixtures.apiKey({ rawKey: cleBrute, label: 'assistant' })
      expect((await evaluer(cleBrute, { evaluation: 'NEGATIVE', categories: [] })).status).toBe(400)
    }),
  )

  it(
    'refuse la catégorie AUTRE sans commentaire',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_eval_autre_vide_ok'
      await fixtures.apiKey({ rawKey: cleBrute, label: 'assistant' })
      expect(
        (await evaluer(cleBrute, { evaluation: 'NEGATIVE', categories: ['AUTRE'] })).status,
      ).toBe(400)
    }),
  )

  it(
    'accepte un feedback positif sans commentaire',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_eval_positif_okay'
      await fixtures.apiKey({ rawKey: cleBrute, label: 'assistant' })
      expect((await evaluer(cleBrute, { evaluation: 'POSITIVE' })).status).toBe(204)
    }),
  )

  it(
    'reste en 204 sur une conversation sans tour enregistré',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_eval_sans_tour_ok'
      await fixtures.apiKey({ rawKey: cleBrute, label: 'assistant' })
      expect(
        (await evaluer(cleBrute, { evaluation: 'NEGATIVE', categories: ['INCOMPREHENSION'] }))
          .status,
      ).toBe(204)
    }),
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-api test -- assistant/routes`
Expected: FAIL — la route renvoie 404

- [ ] **Step 3: Écrire `feedback.ts` dans le contrat partagé**

```ts
import { z } from 'zod'

export const CATEGORIES_PROBLEME = [
  'PROBLEME_TECHNIQUE',
  'INCOMPREHENSION',
  'SUGGESTION',
  'AUTRE',
] as const

export type CategorieProbleme = (typeof CATEGORIES_PROBLEME)[number]

export const LIBELLES_CATEGORIES: Record<CategorieProbleme, { titre: string; aide: string }> = {
  PROBLEME_TECHNIQUE: { titre: 'Problème technique', aide: 'Erreur ou bug' },
  INCOMPREHENSION: { titre: 'Incompréhension', aide: 'Réponse pas claire' },
  SUGGESTION: { titre: 'Suggestion', aide: "Idée d'amélioration" },
  AUTRE: { titre: 'Autre', aide: 'Autre problème' },
}

export const evaluerBodySchema = z
  .discriminatedUnion('evaluation', [
    z.object({ evaluation: z.literal('POSITIVE'), commentaire: z.string().optional() }),
    z.object({
      evaluation: z.literal('NEGATIVE'),
      categories: z.array(z.enum(CATEGORIES_PROBLEME)).min(1),
      commentaire: z.string().optional(),
    }),
  ])
  // « Autre » n'apprend rien sans texte : on l'exige plutôt que de collecter du bruit.
  .refine(
    (corps) =>
      corps.evaluation === 'POSITIVE' ||
      !corps.categories.includes('AUTRE') ||
      (corps.commentaire ?? '').trim().length > 0,
    { message: 'Un commentaire est requis quand la catégorie AUTRE est sélectionnée.' },
  )

export type EvaluerBody = z.infer<typeof evaluerBodySchema>
```

Ajouter l'entrée `"./assistant/feedback"` dans les `exports` de `packages/kpilote-shared/package.json`, sur le modèle des précédentes.

- [ ] **Step 4: Écrire `evaluerReponse.ts`**

```ts
import { type EvaluerBody } from '@pilote/kpilote-shared/assistant/feedback'

import { db } from '@/framework/persistence/dbStore'

/**
 * L'évaluation porte sur le dernier tour de la conversation : c'est celui que l'utilisateur
 * a sous les yeux quand il clique. Sans tour correspondant on ne fait rien — un retour est
 * une donnée d'amélioration, pas une opération métier dont l'échec doit remonter.
 */
export const evaluerReponse = async ({
  conversationId,
  corps,
}: {
  conversationId: string
  corps: EvaluerBody
}): Promise<void> => {
  const dernierTour = await db().assistantAppel.findFirst({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })
  if (!dernierTour) return

  await db().assistantAppel.update({
    where: { id: dernierTour.id },
    data: {
      evaluation: corps.evaluation,
      commentaire: corps.commentaire,
      categoriesProbleme: corps.evaluation === 'NEGATIVE' ? corps.categories : [],
    },
  })
}
```

- [ ] **Step 5: Ajouter la route**

Dans `apps/kpilote-api/src/assistant/routes.ts`, après `chatRoute` :

```ts
const evaluerRoute = createRoute({
  method: 'post',
  path: '/assistant/conversations/{id}/evaluation',
  tags: ['Assistant'],
  summary: 'Évaluer la dernière réponse de l’assistant',
  description:
    "Enregistre un retour utilisateur sur le dernier tour de la conversation. Un retour négatif exige au moins une catégorie de problème ; la catégorie `AUTRE` exige en plus un commentaire non vide. Sans conversation ni tour correspondant, l'appel reste en 204 : le retour est une donnée d'amélioration, pas une opération métier dont l'échec doit remonter.",
  middleware: [requireAuthentication],
  request: {
    params: z.object({ id: z.uuid() }),
    body: {
      content: { 'application/json': { schema: evaluerBodySchema.openapi('AssistantEvaluerBody') } },
      required: true,
    },
  },
  responses: {
    204: { description: 'Retour enregistré' },
    400: erreur400,
  },
})

assistantRoutes.openapi(evaluerRoute, async (context) => {
  await evaluerReponse({
    conversationId: context.req.valid('param').id,
    corps: context.req.valid('json'),
  })
  return context.body(null, 204)
})
```

Ajouter en tête de fichier : `evaluerBodySchema` depuis `@pilote/kpilote-shared/assistant/feedback` et `evaluerReponse` depuis `@/assistant/commands/evaluerReponse`.

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-api test -- assistant/routes`
Expected: PASS — 8 tests

- [ ] **Step 7: Lint et commit**

```bash
pnpm lint
git add packages/kpilote-shared apps/kpilote-api/src/assistant
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): retour utilisateur sur les reponses de l'assistant"
```

---

## Task 15: Harnais d'évaluation

**Files:**
- Create: `apps/kpilote-api/src/assistant/evals/cas.ts`
- Create: `apps/kpilote-api/src/assistant/evals/executer.ts`
- Modify: `apps/kpilote-api/package.json` — script `eval`

**Interfaces:**
- Consumes: `resoudreOutils`, `construireSystemPrompt`, `creerRequeteur`, `creerModeleAssistant`, `MAX_ETAPES`, `MODELES`
- Produces: `type CasEval`, `CAS`, script `pnpm --filter @pilote/kpilote-api eval`

> Les évals vivent sous `src/` et non à la racine de l'app : le `tsconfig.json` de kpilote-api n'inclut que `src/**/*` et `pnpm lint` ne parcourt que `src` et `scripts`. Placées ailleurs, les imports `@/assistant/...` ne résoudraient pas et le fichier échapperait au lint.

- [ ] **Step 1: Écrire le jeu de cas**

Create `apps/kpilote-api/src/assistant/evals/cas.ts`:

```ts
import { type Surface } from '@pilote/kpilote-shared/assistant/surfaces'
import { type NomOutil } from '@pilote/kpilote-shared/assistant/tools'

export type CasEval = {
  nom: string
  question: string
  surface: Surface
  attendu: {
    /** Outils qui DOIVENT avoir été appelés, dans n'importe quel ordre. */
    outilsAppeles?: ReadonlyArray<NomOutil>
    /** Outils qui ne doivent PAS l'avoir été. */
    outilsInterdits?: ReadonlyArray<NomOutil>
    /** Identifiants publics qui doivent figurer dans les sources émises. */
    sourcesContiennent?: ReadonlyArray<string>
    /** Aucune source ne doit être émise — sert à vérifier l'absence de fuite. */
    aucuneSource?: boolean
    /** Le tour ne doit avoir déclenché aucun appel d'outil. */
    aucunOutil?: boolean
  }
}

// On n'évalue pas la prose : elle est instable et la noter demanderait un juge, donc du
// bruit. « Quel outil », « avec quels paramètres », « quelles sources » sont des faits
// binaires, extraits du transcript qu'on stocke déjà.
//
// Les identifiants supposent le jeu de données de recette : les ajuster à l'environnement
// d'exécution avant le premier passage.
export const CAS: ReadonlyArray<CasEval> = [
  {
    nom: 'résolution depuis un libellé approximatif',
    question: "l'indicateur sur la fraude fiscale, il en est où ?",
    surface: 'ask-libre',
    attendu: { outilsAppeles: ['search_indicateurs', 'get_synthese_indicateur'] },
  },
  {
    nom: 'résolution depuis un acronyme — le pré-filtre échoue, le repli doit prendre le relais',
    question: 'les indicateurs sur les VSS',
    surface: 'ask-libre',
    attendu: { outilsAppeles: ['search_indicateurs'] },
  },
  {
    nom: 'identifiant explicite, pas de recherche',
    question: 'donne-moi la synthèse de IND-1',
    surface: 'ask-libre',
    attendu: {
      outilsAppeles: ['get_synthese_indicateur'],
      outilsInterdits: ['search_indicateurs'],
      sourcesContiennent: ['IND-1'],
    },
  },
  {
    nom: 'préfère la synthèse composée aux appels unitaires',
    question: 'où en est IND-1 ?',
    surface: 'ask-libre',
    attendu: {
      outilsAppeles: ['get_synthese_indicateur'],
      outilsInterdits: ['get_indicateur_valeurs'],
    },
  },
  {
    nom: 'hors périmètre',
    question: 'quelle est la capitale du Portugal ?',
    surface: 'ask-libre',
    attendu: { aucunOutil: true },
  },
  {
    nom: 'entité inaccessible : aucune fuite en sources',
    question: 'donne-moi la synthèse de IND-999',
    surface: 'ask-libre',
    attendu: { aucuneSource: true },
  },
  {
    nom: 'question ambiguë : demande de précision',
    question: 'et les chiffres ?',
    surface: 'ask-libre',
    attendu: { aucunOutil: true },
  },
]
```

- [ ] **Step 2: Écrire l'exécuteur**

Create `apps/kpilote-api/src/assistant/evals/executer.ts`:

```ts
import { extraireReferences } from '@pilote/kpilote-shared/assistant/sources'
import { MODELES, type Modele } from '@pilote/kpilote-shared/assistant/surfaces'
import { generateText, stepCountIs } from 'ai'

import { app } from '@/app'
import { construireSystemPrompt } from '@/assistant/prompts/construireSystemPrompt'
import { creerModeleAssistant, MAX_ETAPES, MODELE_PAR_DEFAUT } from '@/assistant/runtime/modele'
import { resoudreOutils } from '@/assistant/tools/registry'
import { creerRequeteur } from '@/assistant/tools/requeteur'
import { CAS, type CasEval } from '@/assistant/evals/cas'

const JETON = process.env.EVAL_API_KEY
if (!JETON) throw new Error('EVAL_API_KEY manquante — clé API utilisée pour les appels d’outils.')

const MODELE = (process.env.EVAL_MODELE as Modele | undefined) ?? MODELE_PAR_DEFAUT
if (!(MODELES as ReadonlyArray<string>).includes(MODELE)) {
  throw new Error(`EVAL_MODELE inconnu : ${MODELE}. Attendu : ${MODELES.join(', ')}`)
}

type Verdict = { cas: string; ok: boolean; details: string[] }

const evaluer = async (cas: CasEval): Promise<Verdict> => {
  const resultat = await generateText({
    model: creerModeleAssistant(MODELE),
    system: construireSystemPrompt({ surface: cas.surface, maintenant: new Date() }),
    prompt: cas.question,
    tools: resoudreOutils(cas.surface, creerRequeteur(app, JETON)),
    stopWhen: stepCountIs(MAX_ETAPES),
  })

  const appeles = resultat.steps.flatMap((etape) => etape.toolCalls.map((appel) => appel.toolName))
  const sorties = resultat.steps.flatMap((etape) => etape.toolResults.map((appel) => appel.output))
  const sources = extraireReferences(sorties).map((reference) => reference.publicId)

  const details: string[] = []
  const { attendu } = cas

  for (const requis of attendu.outilsAppeles ?? []) {
    if (!appeles.includes(requis)) details.push(`outil manquant : ${requis}`)
  }
  for (const interdit of attendu.outilsInterdits ?? []) {
    if (appeles.includes(interdit)) details.push(`outil interdit appelé : ${interdit}`)
  }
  for (const source of attendu.sourcesContiennent ?? []) {
    if (!sources.includes(source)) details.push(`source manquante : ${source}`)
  }
  if (attendu.aucuneSource && sources.length > 0) {
    details.push(`aucune source attendue, ${sources.length} émise(s) : ${sources.join(', ')}`)
  }
  if (attendu.aucunOutil && appeles.length > 0) {
    details.push(`aucun outil attendu, ${appeles.length} appelé(s) : ${appeles.join(', ')}`)
  }

  return { cas: cas.nom, ok: details.length === 0, details }
}

const principal = async (): Promise<void> => {
  /* eslint-disable no-console -- sortie d'un script d'évaluation */
  console.log(`Modèle évalué : ${MODELE}\n`)

  const verdicts: Verdict[] = []
  for (const cas of CAS) verdicts.push(await evaluer(cas))

  for (const verdict of verdicts) {
    console.log(`${verdict.ok ? 'OK   ' : 'ÉCHEC'} ${verdict.cas}`)
    for (const detail of verdict.details) console.log(`      ${detail}`)
  }

  const reussis = verdicts.filter((verdict) => verdict.ok).length
  console.log(`\n${reussis}/${verdicts.length} cas réussis`)
  /* eslint-enable no-console */

  if (reussis !== verdicts.length) process.exitCode = 1
}

void principal()
```

- [ ] **Step 3: Déclarer le script**

Dans `apps/kpilote-api/package.json`, sous `scripts` :

```json
    "eval": "tsx src/assistant/evals/executer.ts",
```

Ne PAS le brancher dans la CI : chaque exécution consomme des appels Albert. `EVAL_MODELE` permet de rejouer le même jeu sur `openweight-medium` pour comparer.

- [ ] **Step 4: Vérifier la compilation**

Run: `pnpm --filter @pilote/kpilote-api lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/kpilote-api/src/assistant/evals apps/kpilote-api/package.json
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): harnais d'evaluation des decisions de l'assistant"
```

---

## Task 16: Rendu de la conversation dans le webapp

**Files:**
- Create: `apps/kpilote-webapp/src/assistant/nettoyerPseudoAppels.ts`
- Create: `apps/kpilote-webapp/src/assistant/useAssistant.ts`
- Create: `apps/kpilote-webapp/src/assistant/PanneauSources.tsx`
- Create: `apps/kpilote-webapp/src/assistant/AssistantMessage.tsx`
- Create: `apps/kpilote-webapp/src/assistant/BarreFeedback.tsx`
- Create: `apps/kpilote-webapp/src/assistant/AssistantPanel.tsx`
- Test: `apps/kpilote-webapp/src/assistant/nettoyerPseudoAppels.test.ts`
- Modify: `apps/kpilote-webapp/package.json` — `ai`, `@ai-sdk/react`

**Interfaces:**
- Consumes: `KpiloteUIMessage` (Task 3), `NOMS_OUTILS`, `LIBELLES_OUTILS`, `Source`, `CATEGORIES_PROBLEME`, `LIBELLES_CATEGORIES`
- Produces: `nettoyerPseudoAppels(texte: string): string`, `useAssistant(conversationId)`, `<AssistantPanel />`

- [ ] **Step 1: Write the failing test**

Create `apps/kpilote-webapp/src/assistant/nettoyerPseudoAppels.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { nettoyerPseudoAppels } from './nettoyerPseudoAppels'

describe('nettoyerPseudoAppels', () => {
  it('supprime un appel écrit en pseudo-code sur une ligne', () => {
    expect(nettoyerPseudoAppels('Voici :\nget_indicateur({"id": "IND-1"})\nRésultat.')).toBe(
      'Voici :\nRésultat.',
    )
  })

  it('supprime un appel étalé sur plusieurs lignes', () => {
    const texte = 'Avant\nsearch_indicateurs({\n  requete: "fraude"\n})\nAprès'
    expect(nettoyerPseudoAppels(texte)).toBe('Avant\nAprès')
  })

  it('laisse intact un texte qui mentionne un outil sans l’appeler', () => {
    const texte = "J'ai utilisé get_indicateur pour récupérer la fiche."
    expect(nettoyerPseudoAppels(texte)).toBe(texte)
  })

  it('couvre tous les outils du contrat, pas une liste recopiée', () => {
    expect(nettoyerPseudoAppels('get_referentiel_individus({"id": "REF-A"})')).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-webapp test -- nettoyerPseudoAppels`
Expected: FAIL — module introuvable

- [ ] **Step 3: Write `nettoyerPseudoAppels.ts`**

```ts
import { NOMS_OUTILS } from '@pilote/kpilote-shared/assistant/tools'

// Les modèles reproduisent parfois la syntaxe d'appel d'outil vue à l'entraînement, et le
// bloc apparaît en texte brut à l'utilisateur. Filet de sécurité, alimenté par le contrat
// partagé : la liste ne peut pas diverger de celle que le serveur enregistre — chez ppg,
// elle a divergé de quatre outils.
const DEBUT_APPEL = new RegExp(`^\\s*(?:${NOMS_OUTILS.join('|')})\\s*\\(`)

const soldeParentheses = (ligne: string): number =>
  [...ligne].reduce((solde, caractere) => {
    if (caractere === '(') return solde + 1
    if (caractere === ')') return solde - 1
    return solde
  }, 0)

export const nettoyerPseudoAppels = (texte: string): string => {
  const conservees: string[] = []
  let profondeur = 0
  let dansUnAppel = false

  for (const ligne of texte.split('\n')) {
    if (dansUnAppel) {
      profondeur += soldeParentheses(ligne)
      if (profondeur <= 0) {
        dansUnAppel = false
        profondeur = 0
      }
      continue
    }
    if (DEBUT_APPEL.test(ligne)) {
      profondeur = soldeParentheses(ligne)
      if (profondeur > 0) dansUnAppel = true
      continue
    }
    conservees.push(ligne)
  }

  return conservees
    .join('\n')
    .replace(/(\n\s*---\s*)+\s*$/u, '')
    .trim()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-webapp test -- nettoyerPseudoAppels`
Expected: PASS — 4 tests

- [ ] **Step 5: Ajouter les dépendances**

```bash
pnpm --filter @pilote/kpilote-webapp add ai@^6.0.161 @ai-sdk/react@^3.0.93
```

- [ ] **Step 6: Écrire `useAssistant.ts`**

```ts
import { useChat } from '@ai-sdk/react'
import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { Chat, DefaultChatTransport } from 'ai'
import { useRef } from 'react'

import { apiUrl } from '@/api/client'

export const useAssistant = (conversationId: string) => {
  const chatRef = useRef(
    new Chat<KpiloteUIMessage>({
      id: conversationId,
      transport: new DefaultChatTransport<KpiloteUIMessage>({
        api: apiUrl('/assistant/chat'),
        body: { surface: 'ask-libre', conversationId },
      }),
    }),
  )

  // Le throttle évite un re-rendu par token : le flux arrive plus vite que React ne peint.
  return useChat<KpiloteUIMessage>({ chat: chatRef.current, experimental_throttle: 250 })
}
```

> Adapter `apiUrl` et l'injection du jeton porteur à ce que fait déjà `src/api/client.ts` — le transport doit envoyer le même en-tête `Authorization` que les autres appels.

- [ ] **Step 7: Écrire `PanneauSources.tsx`**

```tsx
import type { Source } from '@pilote/kpilote-shared/assistant/sources'
import { Link } from '@tanstack/react-router'

export function PanneauSources({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null

  return (
    <section aria-label="Sources consultées" className="mt-3 border-t border-border pt-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-text-subtle">Sources</h3>
      <ul className="mt-1 flex flex-wrap gap-2">
        {sources.map((source) => {
          const contenu = (
            <>
              <span>{source.libelle}</span>
              <span className="font-mono text-xs text-text-subtle">{source.publicId}</span>
            </>
          )
          return (
            <li key={`${source.type}:${source.publicId}`}>
              {/* Individus et référentiels n'ont pas de page de détail : affichés sans lien
                  plutôt qu'omis, sinon une réponse bien sourcée afficherait « aucune source ». */}
              {source.chemin ? (
                <Link
                  to={source.chemin}
                  className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-sm hover:bg-surface"
                >
                  {contenu}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-sm text-text-subtle">
                  {contenu}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
```

- [ ] **Step 8: Écrire `AssistantMessage.tsx`**

```tsx
import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { LIBELLES_OUTILS, type NomOutil } from '@pilote/kpilote-shared/assistant/tools'

import { clsxm } from '@/lib/clsxm'

import { nettoyerPseudoAppels } from './nettoyerPseudoAppels'
import { PanneauSources } from './PanneauSources'

const libelleOutil = (typePart: string): string => {
  const nom = typePart.replace(/^tool-/u, '') as NomOutil
  return LIBELLES_OUTILS[nom] ?? nom
}

export function AssistantMessage({ message }: { message: KpiloteUIMessage }) {
  if (message.role === 'user') {
    return (
      <p className="ml-auto max-w-[80%] rounded bg-surface px-3 py-2">
        {message.parts
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join(' ')}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {message.parts.map((part, index) => {
        if (part.type === 'text') {
          const texte = nettoyerPseudoAppels(part.text)
          if (texte.length === 0) return null
          return (
            <p key={index} className="whitespace-pre-wrap">
              {texte}
            </p>
          )
        }

        // Part typée grâce au paramètre TOOLS de KpiloteUIMessage : `part.data` est
        // `Source[]`, pas `unknown`.
        if (part.type === 'data-sources') {
          return <PanneauSources key={index} sources={part.data} />
        }

        if (part.type.startsWith('tool-')) {
          const enCours = part.state !== 'output-available' && part.state !== 'output-error'
          return (
            <p
              key={index}
              className={clsxm('text-xs italic text-text-subtle', enCours && 'animate-pulse')}
              aria-live="polite"
            >
              {libelleOutil(part.type)}
              {part.state === 'output-error' ? ' — échec' : enCours ? '…' : ''}
            </p>
          )
        }

        return null
      })}
    </div>
  )
}
```

- [ ] **Step 9: Écrire `BarreFeedback.tsx`**

```tsx
import {
  CATEGORIES_PROBLEME,
  LIBELLES_CATEGORIES,
  type CategorieProbleme,
} from '@pilote/kpilote-shared/assistant/feedback'
import { useState } from 'react'

import { apiUrl } from '@/api/client'
import { Button } from '@/components/ui/button'
import { clsxm } from '@/lib/clsxm'

type Etat = 'inactif' | 'positif' | 'negatif' | 'envoye'

export function BarreFeedback({ conversationId }: { conversationId: string }) {
  const [etat, setEtat] = useState<Etat>('inactif')
  const [categories, setCategories] = useState<CategorieProbleme[]>([])
  const [commentaire, setCommentaire] = useState('')

  const envoyer = async (corps: Record<string, unknown>) => {
    await fetch(apiUrl(`/assistant/conversations/${conversationId}/evaluation`), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(corps),
    })
    setEtat('envoye')
  }

  // « Autre » sans texte n'apprend rien : on bloque l'envoi plutôt que de collecter du bruit.
  const envoiNegatifBloque =
    categories.length === 0 || (categories.includes('AUTRE') && commentaire.trim().length === 0)

  if (etat === 'envoye') return <p className="text-sm text-text-subtle">Merci pour votre retour.</p>

  if (etat === 'inactif') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-subtle">Cette réponse vous a-t-elle aidé ?</span>
        <Button variant="ghost" size="sm" onClick={() => setEtat('positif')}>
          Oui
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setEtat('negatif')}>
          Non
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-border p-3">
      {etat === 'negatif' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">
            Quel type de problème avez-vous rencontré ?
          </legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES_PROBLEME.map((categorie) => {
              const coche = categories.includes(categorie)
              return (
                <button
                  key={categorie}
                  type="button"
                  aria-pressed={coche}
                  onClick={() =>
                    setCategories((precedentes) =>
                      coche
                        ? precedentes.filter((valeur) => valeur !== categorie)
                        : [...precedentes, categorie],
                    )
                  }
                  className={clsxm(
                    'rounded border px-2 py-1 text-left text-sm',
                    coche ? 'border-accent bg-surface' : 'border-border',
                  )}
                >
                  <span className="block font-medium">{LIBELLES_CATEGORIES[categorie].titre}</span>
                  <span className="block text-xs text-text-subtle">
                    {LIBELLES_CATEGORIES[categorie].aide}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <label className="flex flex-col gap-1 text-sm">
        {etat === 'positif' ? "Qu'avez-vous apprécié ? (optionnel)" : 'Décrivez le problème'}
        <textarea
          value={commentaire}
          onChange={(evenement) => setCommentaire(evenement.target.value)}
          className="rounded border border-border p-2"
          rows={3}
        />
      </label>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setEtat('inactif')}>
          Annuler
        </Button>
        <Button
          size="sm"
          disabled={etat === 'negatif' && envoiNegatifBloque}
          onClick={() =>
            envoyer(
              etat === 'positif'
                ? { evaluation: 'POSITIVE', commentaire: commentaire || undefined }
                : { evaluation: 'NEGATIVE', categories, commentaire: commentaire || undefined },
            )
          }
        >
          Envoyer
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 10: Écrire `AssistantPanel.tsx`**

```tsx
import { useState } from 'react'

import { Button } from '@/components/ui/button'

import { AssistantMessage } from './AssistantMessage'
import { BarreFeedback } from './BarreFeedback'
import { useAssistant } from './useAssistant'

export function AssistantPanel({
  conversationId,
  questionInitiale,
}: {
  conversationId: string
  questionInitiale?: string
}) {
  const { messages, sendMessage, status, error } = useAssistant(conversationId)
  const [saisie, setSaisie] = useState(questionInitiale ?? '')

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex-1 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <AssistantMessage key={message.id} message={message} />
        ))}
        {status === 'submitted' && <p className="text-sm text-text-subtle">Réflexion en cours…</p>}
        {error && <p className="text-sm text-danger">Erreur : {error.message}</p>}
      </div>

      {messages.length > 0 && status === 'ready' && (
        <BarreFeedback conversationId={conversationId} />
      )}

      <form
        className="flex gap-2"
        onSubmit={(evenement) => {
          evenement.preventDefault()
          if (saisie.trim().length === 0) return
          void sendMessage({ text: saisie.trim() })
          setSaisie('')
        }}
      >
        <input
          value={saisie}
          onChange={(evenement) => setSaisie(evenement.target.value)}
          placeholder="Posez votre question…"
          className="flex-1 rounded border border-border px-3 py-2"
        />
        <Button type="submit" disabled={status !== 'ready'}>
          Envoyer
        </Button>
      </form>
    </div>
  )
}
```

> Adapter `Button` et les tokens de couleur (`bg-surface`, `border-border`, `text-text-subtle`, `text-danger`, `border-accent`) à ce qui existe réellement dans `src/components/ui` et dans la config Tailwind. Conventions du projet : Tailwind et composants partagés, jamais de classes DSFR `fr-*`, jamais de couleur en dur, et le helper de composition de classes s'appelle `clsxm`.

- [ ] **Step 11: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-webapp lint
git add apps/kpilote-webapp/src/assistant apps/kpilote-webapp/package.json pnpm-lock.yaml
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): rendu type de la conversation et panneau de sources"
```

---

## Task 17: Point d'entrée dans la palette

**Files:**
- Create: `apps/kpilote-webapp/src/components/command-palette/useAssistantCommand.ts`
- Modify: `apps/kpilote-webapp/src/lib/commands/types.ts:10` — ajouter `'assistant'` à `CommandGroup`
- Modify: `apps/kpilote-webapp/src/components/command-palette/CommandPalette.tsx`

**Interfaces:**
- Consumes: `type Command` (`@/lib/commands/types`), `AssistantPanel` (Task 16)
- Produces: `useAssistantCommand(query, ouvrirAssistant): Command`

- [ ] **Step 1: Étendre le type de groupe**

Dans `apps/kpilote-webapp/src/lib/commands/types.ts`, ligne 10 :

```ts
export type CommandGroup =
  | 'navigation'
  | 'recents'
  | 'indicateurs'
  | 'collections'
  | 'centre-aide'
  | 'assistant'
```

- [ ] **Step 2: Écrire la commande**

Create `apps/kpilote-webapp/src/components/command-palette/useAssistantCommand.ts`:

```ts
import { Sparkles } from 'lucide-react'
import { useMemo } from 'react'

import type { Command } from '@/lib/commands/types'

/**
 * Entrée « Demander à l'IA » de la palette. La question tapée est transmise telle quelle
 * avec sa surface : le moteur ne devine rien de l'intention.
 */
export const useAssistantCommand = (
  query: string,
  ouvrirAssistant: (question: string) => void,
): Command =>
  useMemo(
    () => ({
      id: 'assistant:ask',
      label: query.trim().length > 0 ? `Demander à l'IA : « ${query.trim()} »` : "Demander à l'IA",
      group: 'assistant',
      keywords: ['ia', 'assistant', 'question', 'chat'],
      icon: Sparkles,
      hint: 'Entrée',
      run: () => ouvrirAssistant(query.trim()),
    }),
    [query, ouvrirAssistant],
  )
```

- [ ] **Step 3: Brancher dans la palette**

Ajouter la prop au type, `apps/kpilote-webapp/src/components/command-palette/CommandPalette.tsx:33` :

```tsx
type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  ouvrirAssistant: (question: string) => void
}
```

Puis, à la suite des autres hooks de commandes :

```tsx
const assistantCommand = useAssistantCommand(query, (question) => {
  close()
  ouvrirAssistant(question)
})
```

Ajouter `assistantCommand` en tête de `rootCommands` **et** de son tableau de dépendances — sans quoi le `Tab` ne résoudra pas l'entrée surlignée :

```tsx
  const rootCommands = useMemo<Command[]>(
    () => [
      assistantCommand,
      ...navigationCommands,
      ...(showRecents ? recentCommands : []),
      ...indicateurCommands,
      ...collectionCommands,
      ...centreAideResults,
    ],
    [
      assistantCommand,
      navigationCommands,
      showRecents,
      recentCommands,
      indicateurCommands,
      collectionCommands,
      centreAideResults,
    ],
  )
```

Enfin, rendre le groupe avant le groupe Navigation dans le JSX :

```tsx
<CommandPrimitive.Group heading="Assistant" className={GROUP_HEADING_CLASS}>
  <CommandPrimitive.Item
    key={assistantCommand.id}
    value={assistantCommand.id}
    onSelect={assistantCommand.run}
  >
    <Sparkles className="size-4" aria-hidden />
    <span>{assistantCommand.label}</span>
  </CommandPrimitive.Item>
</CommandPrimitive.Group>
```

Le parent qui monte `AssistantPanel` fournit `ouvrirAssistant` — un état local dans le layout authentifié suffit : la palette se ferme, le panneau s'ouvre avec la question pré-remplie.

- [ ] **Step 4: Vérifier**

Run: `pnpm --filter @pilote/kpilote-webapp lint`
Expected: PASS

Puis lancer l'application et vérifier à la main : `⌘K` fait apparaître « Demander à l'IA », `Entrée` ouvre le panneau, une question renvoie une réponse suivie de son panneau de sources cliquable.

- [ ] **Step 5: Commit**

```bash
git add apps/kpilote-webapp/src
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): entree Demander a l'IA dans la palette de commandes"
```
