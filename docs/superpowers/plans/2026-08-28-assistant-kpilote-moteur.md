# Assistant kpilote — moteur et surface `ask-libre` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer un moteur d'assistant conversationnel dans `kpilote-api`, atteignable par une surface déclarée, avec des outils dérivés de l'OpenAPI et des outils métier composés, et un panneau de sources dérivé des identifiants publics.

**Architecture:** Le contrat (surfaces, noms d'outils, format de message, sources) vit dans `@pilote/kpilote-shared/assistant`. Le moteur vit dans `apps/kpilote-api/src/assistant/` : il compose un prompt en trois couches, résout les outils autorisés par la surface, streame via le SDK `ai`, puis extrait et résout les sources. Les outils atteignent les données par `app.request()` in-process (chaîne de middlewares complète, donc habilitations appliquées) ou par appel direct aux queries (scope `AsyncLocalStorage` du principal). Le front consomme le flux via `@ai-sdk/react`.

**Tech Stack:** TypeScript, Hono + `@hono/zod-openapi`, Prisma 7, `ai` v6 + `@ai-sdk/openai` (provider Albert Etalab), `neverthrow`, `zod` v4, `vitest`, React 19 + TanStack Router, `pnpm`.

**Spec:** `docs/superpowers/specs/2026-08-28-assistant-kpilote-design.md`

## Global Constraints

- Gestionnaire de paquets : **`pnpm`** (v10). Jamais `npm`.
- Nommage : **verbes et termes techniques en anglais, noms d'entités en français** (`getSyntheseIndicateur`, `listIndicateurs`).
- `apps/kpilote-api/tsconfig.json` mappe `@/` **par dossier explicite** : tout nouveau sous-système exige son entrée dans `paths`.
- Prisma : après `prisma migrate dev`, relancer **`pnpm prisma:generate`** (le script porte `--sql`).
- `pnpm lint` avant chaque commit (`eslint` + `tsc --noEmit` + `prettier --check`).
- Pas de `Co-Authored-By` dans les commits.
- Pas de plan de tests pour les composants front.
- Provider LLM : `https://albert.api.etalab.gouv.fr/v1`, clé dans `env.ALBERT_API_KEY` (déjà déclarée, `optional()`).
- Modèle par défaut : `openweight-large`, en constante surchargeable.
- Borne d'exécution du modèle : `stepCountIs(12)` pour la surface `ask-libre`.
- Rétention des conversations : 14 jours.

---

## File Structure

**`packages/kpilote-shared/src/assistant/`** — contrat, sans dépendance runtime
- `sources.ts` — types `ReferenceSource` / `Source`, extraction guidée par les clés
- `surfaces.ts` — identifiants de surface, `chatRequestSchema`
- `tools.ts` — `NOMS_OUTILS`, `LIBELLES_OUTILS`
- `message.ts` — `KpiloteUIMessage`
- `feedback.ts` — `evaluerBodySchema`, catégories

**`apps/kpilote-api/src/assistant/`** — moteur
- `routes.ts` — `POST /assistant/chat`, `POST /assistant/conversations/{id}/evaluation`
- `runtime/modele.ts` — provider et modèle
- `runtime/AssistantRuntime.ts` — orchestration d'un tour
- `runtime/sources.ts` — résolution des références en sources
- `prompts/socle.ts`, `prompts/runtime.ts`, `prompts/surfaces/askLibre.ts`
- `tools/deriverTool.ts` — `createRoute` → `tool`
- `tools/whitelist.ts` — routes exposées et nom d'outil
- `tools/metier/searchIndicateurs.ts`, `searchCollections.ts`
- `tools/metier/getSyntheseIndicateur.ts`, `getSyntheseCollection.ts`
- `tools/registry.ts` — assemblage par surface
- `commands/enregistrerConversation.ts`, `commands/evaluerReponse.ts`

**`apps/kpilote-webapp/src/assistant/`** — surfaces
- `useAssistant.ts`, `AssistantPanel.tsx`, `AssistantMessage.tsx`, `PanneauSources.tsx`, `BarreFeedback.tsx`, `nettoyerPseudoAppels.ts`
- `src/components/command-palette/useAssistantCommand.ts`

**Modifications**
- `packages/kpilote-shared/package.json` — 5 entrées `exports`, `ai` en `peerDependencies`
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

/** Une source résolue, prête à être affichée et cliquée. */
export type Source = ReferenceSource & { libelle: string; chemin: string }

// L'extraction est guidée par les CLÉS et non par les valeurs : `individuPublicIdSchema`
// accepte `^[A-Z][A-Z0-9-]{0,19}$`, donc un balayage de toutes les chaînes ramasserait
// `READ`, `PUBLIC` ou `SOLEIL`. Seules les clés qui portent une identité sont lues.
const CLES_PAR_TYPE: Record<TypeSource, ReadonlyArray<string>> = {
  indicateur: ['indicateurId', 'indicateurPublicId'],
  collection: ['collectionId', 'collectionPublicId'],
  referentiel: ['referentielId', 'referentielPublicId'],
  individu: ['individuId', 'individuPublicId'],
}

const SCHEMAS_PAR_TYPE: Record<TypeSource, { safeParse: (v: unknown) => { success: boolean } }> = {
  indicateur: indicateurPublicIdSchema,
  collection: collectionPublicIdSchema,
  referentiel: referentielPublicIdSchema,
  individu: individuPublicIdSchema,
}

// `publicId` et `id` sont ambigus : on résout le type par le préfixe de la valeur.
// L'individu n'a pas de préfixe discriminant, il n'est donc atteignable que par une
// clé qui le nomme explicitement.
const TYPES_A_PREFIXE: ReadonlyArray<TypeSource> = ['indicateur', 'collection', 'referentiel']
const CLES_AMBIGUES: ReadonlyArray<string> = ['publicId', 'id']

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

    for (const [cle, contenu] of Object.entries(noeud as Record<string, unknown>)) {
      if (typeof contenu === 'string') {
        const typeExplicite = typeDepuisCle(cle)
        if (typeExplicite) {
          ajouter(typeExplicite, contenu)
          continue
        }
        if (CLES_AMBIGUES.includes(cle)) {
          const typeDeduit = typeDepuisValeur(contenu)
          if (typeDeduit) ajouter(typeDeduit, contenu)
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

## Task 2: Contrat de surface, noms d'outils et format de message

**Files:**
- Create: `packages/kpilote-shared/src/assistant/surfaces.ts`
- Create: `packages/kpilote-shared/src/assistant/tools.ts`
- Create: `packages/kpilote-shared/src/assistant/message.ts`
- Test: `packages/kpilote-shared/src/assistant/surfaces.test.ts`
- Modify: `packages/kpilote-shared/package.json`

**Interfaces:**
- Consumes: `Source` (Task 1)
- Produces: `SURFACES`, `type Surface`, `chatRequestSchema`, `type ChatRequest`, `NOMS_OUTILS`, `type NomOutil`, `LIBELLES_OUTILS`, `type KpiloteUIMessage`

- [ ] **Step 1: Write the failing test**

Create `packages/kpilote-shared/src/assistant/surfaces.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { chatRequestSchema } from './surfaces'

const conversationId = '018f3a2b-0000-7000-8000-000000000000'

describe('chatRequestSchema', () => {
  it('accepte une requête ask-libre', () => {
    const resultat = chatRequestSchema.safeParse({
      surface: 'ask-libre',
      conversationId,
      messages: [],
    })
    expect(resultat.success).toBe(true)
  })

  it('rejette une surface inconnue', () => {
    const resultat = chatRequestSchema.safeParse({
      surface: 'ask-entite',
      conversationId,
      messages: [],
    })
    expect(resultat.success).toBe(false)
  })

  it('rejette un conversationId qui n’est pas un uuid', () => {
    const resultat = chatRequestSchema.safeParse({
      surface: 'ask-libre',
      conversationId: 'pas-un-uuid',
      messages: [],
    })
    expect(resultat.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-shared test -- surfaces`
Expected: FAIL — `Failed to resolve import "./surfaces"`

- [ ] **Step 3: Write `surfaces.ts`**

```ts
import { z } from 'zod'

// Une surface est un point d'entrée de l'assistant. L'appelant la DÉCLARE : le moteur
// ne déduit jamais l'intention du texte. Les surfaces suivantes s'ajoutent comme
// branches de l'union discriminée, sans nouvelle route.
export const SURFACES = ['ask-libre'] as const
export type Surface = (typeof SURFACES)[number]

export const chatRequestSchema = z.discriminatedUnion('surface', [
  z.object({
    surface: z.literal('ask-libre'),
    conversationId: z.uuid().describe('Identifiant de la conversation, généré par le client.'),
    messages: z.array(z.unknown()).describe('Historique au format UIMessage du SDK ai.'),
  }),
])

export type ChatRequest = z.infer<typeof chatRequestSchema>
```

- [ ] **Step 4: Write `tools.ts`**

```ts
// Source unique de vérité des noms d'outils. Le serveur les enregistre, le front en
// dérive ses libellés et son nettoyage des pseudo-appels : aucune liste dupliquée ne
// peut diverger.
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
```

- [ ] **Step 5: Write `message.ts`**

```ts
import type { UIMessage } from 'ai'

import type { Source } from './sources'

/** Parts de données émises par le moteur en plus du texte et des appels d'outils. */
export type KpiloteDataParts = { sources: Source[] }

export type KpiloteUIMessage = UIMessage<never, KpiloteDataParts>
```

- [ ] **Step 6: Ajouter `ai` en peerDependency et déclarer les exports**

Dans `packages/kpilote-shared/package.json`, sous `peerDependencies` :

```json
  "peerDependencies": {
    "ai": "^6.0.161",
    "zod": "^4.3.6"
  },
```

Et trois entrées dans `exports`, à la suite de `"./assistant/sources"` :

```json
    "./assistant/surfaces": {
      "types": "./src/assistant/surfaces.ts",
      "default": "./src/assistant/surfaces.ts"
    },
    "./assistant/tools": {
      "types": "./src/assistant/tools.ts",
      "default": "./src/assistant/tools.ts"
    },
    "./assistant/message": {
      "types": "./src/assistant/message.ts",
      "default": "./src/assistant/message.ts"
    },
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-shared test -- surfaces`
Expected: PASS — 3 tests

- [ ] **Step 8: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-shared lint
git add packages/kpilote-shared/src/assistant packages/kpilote-shared/package.json
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): contrat partage de l'assistant (surfaces, outils, message)"
```

---

## Task 3: Modèles de persistance

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
  id             String   @id @db.Uuid
  utilisateurId  String   @db.Uuid
  titre          String
  surface        String
  messages       Json
  contexte       Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

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

Demander d'abord à l'utilisateur de confirmer que le Docker de la base est allumé — ne rien manipuler soi-même sur les conteneurs.

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

## Task 4: Provider Albert et mapping de chemins

**Files:**
- Create: `apps/kpilote-api/src/assistant/runtime/modele.ts`
- Modify: `apps/kpilote-api/tsconfig.json`

**Interfaces:**
- Consumes: `env.ALBERT_API_KEY`
- Produces: `creerModeleAssistant(nomModele?: string): LanguageModel`, `MODELE_PAR_DEFAUT`, `TEMPERATURE_CONVERSATION`, `TEMPERATURE_STRUCTUREE`, `MAX_ETAPES`

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
import { type LanguageModel } from 'ai'

import { env } from '@/env'

const ALBERT_BASE_URL = 'https://albert.api.etalab.gouv.fr/v1'

/** Point de bascule unique quand un meilleur modèle Etalab arrive. */
export const MODELE_PAR_DEFAUT = 'openweight-large'

export const TEMPERATURE_CONVERSATION = 0.2
export const TEMPERATURE_STRUCTUREE = 0
export const MAX_ETAPES = 12

// Throw si la clé n'est pas configurée : c'est une erreur de déploiement (500), pas un
// état métier. Même parti pris que `valeurImport/helpers/albert.ts`.
export const creerModeleAssistant = (nomModele: string = MODELE_PAR_DEFAUT): LanguageModel => {
  if (!env.ALBERT_API_KEY) {
    throw new Error('ALBERT_API_KEY manquante — assistant non configuré côté API.')
  }
  const provider = createOpenAI({ baseURL: ALBERT_BASE_URL, apiKey: env.ALBERT_API_KEY })
  return provider.chat(nomModele)
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

## Task 5: Dérivation d'un outil depuis une route OpenAPI

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/deriverTool.ts`
- Create: `apps/kpilote-api/src/assistant/tools/whitelist.ts`
- Test: `apps/kpilote-api/src/assistant/tools/deriverTool.test.ts`
- Modify: `apps/kpilote-api/src/indicateur/routes.ts:52,76` — exporter `getIndicateursRoute`, `getIndicateurByIdRoute`
- Modify: `apps/kpilote-api/src/collection/routes.ts:100,123` — exporter `getCollectionsRoute`, `getCollectionByIdRoute`
- Modify: `apps/kpilote-api/src/referentiel/routes.ts:34,105` — exporter `getReferentielsRoute`, `getIndividusForReferentielRoute`
- Modify: `apps/kpilote-api/src/valeurAvancement/routes.ts:105,319` — exporter `getValeursForIndicateurRoute`, `getDernieresValeursForIndividuRoute`

**Interfaces:**
- Consumes: `NomOutil` (Task 2)
- Produces: `construireUrl(chemin: string, params: Record<string, unknown>): string`, `deriverTool(entree: EntreeWhitelist, jeton: string): Tool`, `type EntreeWhitelist`, `WHITELIST: ReadonlyArray<EntreeWhitelist>`

- [ ] **Step 1: Write the failing test**

Create `apps/kpilote-api/src/assistant/tools/deriverTool.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { construireUrl } from '@/assistant/tools/deriverTool'
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

describe('WHITELIST', () => {
  it('expose huit entrées aux noms uniques', () => {
    const noms = WHITELIST.map((entree) => entree.nom)
    expect(noms).toHaveLength(8)
    expect(new Set(noms).size).toBe(8)
  })

  it('ne référence que des routes de lecture', () => {
    expect(WHITELIST.every((entree) => entree.route.method === 'get')).toBe(true)
  })

  it('porte une description non vide sur chaque route, lue par le modèle', () => {
    expect(WHITELIST.every((entree) => (entree.route.description ?? '').length > 40)).toBe(true)
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

- [ ] **Step 4: Écrire `deriverTool.ts`**

```ts
import { type RouteConfig } from '@hono/zod-openapi'
import { type NomOutil } from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'
import { z } from 'zod'

import { app } from '@/app'

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
 *
 * `app.request()` est le mécanisme in-process de Hono — pas de socket, mais toute la
 * chaîne de middlewares s'exécute (databaseContext, authContext, requireAuthentication,
 * puis les filtres de permission des queries). L'outil ne peut donc pas voir plus que
 * l'appelant dont il porte le jeton.
 */
export const deriverTool = ({ route }: EntreeWhitelist, jeton: string): Tool =>
  tool({
    description: route.description ?? route.summary ?? '',
    inputSchema: fusionnerSchemas(route),
    execute: async (params: Record<string, unknown>) => {
      const reponse = await app.request(construireUrl(route.path, params), {
        headers: { authorization: `Bearer ${jeton}` },
      })
      if (!reponse.ok) {
        return { erreur: `L'appel a échoué avec le statut ${reponse.status}.` }
      }
      return reponse.json()
    },
  })
```

- [ ] **Step 5: Écrire `whitelist.ts`**

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

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-api test -- deriverTool`
Expected: PASS — 9 tests

- [ ] **Step 7: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/assistant/tools apps/kpilote-api/src/indicateur/routes.ts apps/kpilote-api/src/collection/routes.ts apps/kpilote-api/src/referentiel/routes.ts apps/kpilote-api/src/valeurAvancement/routes.ts
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): derivation des outils depuis les routes OpenAPI"
```

---

## Task 6: Outils de recherche d'entité

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/metier/searchIndicateurs.ts`
- Create: `apps/kpilote-api/src/assistant/tools/metier/searchCollections.ts`
- Test: `apps/kpilote-api/src/assistant/tools/metier/searchIndicateurs.test.ts`

**Interfaces:**
- Consumes: `listIndicateurs` (`@/indicateur/queries/listIndicateurs`), `listCollections` (`@/collection/queries/listCollections`), `creerModeleAssistant`, `TEMPERATURE_STRUCTUREE` (Task 4)
- Produces: `filtrerHallucinations<T>(candidats, catalogue, obtenirId)`, `creerSearchIndicateursTool(): Tool`, `creerSearchCollectionsTool(): Tool`

- [ ] **Step 1: Write the failing test**

Create `apps/kpilote-api/src/assistant/tools/metier/searchIndicateurs.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { filtrerHallucinations } from '@/assistant/tools/metier/searchIndicateurs'

describe('filtrerHallucinations', () => {
  const catalogue = [
    { publicId: 'IND-1', nom: 'Fraude fiscale' },
    { publicId: 'IND-2', nom: 'Délais de paiement' },
  ]

  it('conserve les candidats présents au catalogue, dans leur ordre de pertinence', () => {
    const candidats = [{ id: 'IND-2' }, { id: 'IND-1' }]
    expect(filtrerHallucinations(candidats, catalogue, (c) => c.id)).toEqual([
      { publicId: 'IND-2', nom: 'Délais de paiement' },
      { publicId: 'IND-1', nom: 'Fraude fiscale' },
    ])
  })

  it('écarte un identifiant inventé par le sous-modèle', () => {
    const candidats = [{ id: 'IND-1' }, { id: 'IND-999' }]
    expect(filtrerHallucinations(candidats, catalogue, (c) => c.id)).toEqual([
      { publicId: 'IND-1', nom: 'Fraude fiscale' },
    ])
  })

  it('renvoie un tableau vide quand aucun candidat ne correspond', () => {
    expect(filtrerHallucinations([{ id: 'COL-3' }], catalogue, (c) => c.id)).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-api test -- searchIndicateurs`
Expected: FAIL — module introuvable

- [ ] **Step 3: Écrire `searchIndicateurs.ts`**

```ts
import { generateText, Output, stepCountIs, tool, type Tool } from 'ai'
import { z } from 'zod'

import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'
import { creerModeleAssistant, TEMPERATURE_STRUCTUREE } from '@/assistant/runtime/modele'

const TAILLE_CATALOGUE = 500
const MAX_RESULTATS = 10

/**
 * Ne garde que les candidats présents au catalogue réellement récupéré. Un sous-modèle
 * peut inventer un identifiant plausible ; le catalogue, lui, est déjà filtré par les
 * habilitations. C'est le garde-fou qui rend l'invention sans effet.
 */
export const filtrerHallucinations = <TCandidat, TReference>(
  candidats: ReadonlyArray<TCandidat>,
  catalogue: ReadonlyArray<TReference & { publicId: string }>,
  obtenirId: (candidat: TCandidat) => string,
): TReference[] => {
  const parId = new Map(catalogue.map((entree) => [entree.publicId, entree]))
  return candidats.flatMap((candidat) => {
    const reference = parId.get(obtenirId(candidat))
    return reference === undefined ? [] : [reference]
  })
}

const sortieSchema = z.object({
  resultats: z
    .array(z.object({ id: z.string() }))
    .max(MAX_RESULTATS)
    .describe('Identifiants retenus, du plus pertinent au moins pertinent.'),
})

const SYSTEM_PROMPT = `Tu reçois une requête utilisateur en langage naturel et un catalogue d'indicateurs kpilote.
Ta tâche : renvoyer les identifiants du catalogue qui correspondent à la requête, du plus pertinent au moins pertinent, au maximum ${MAX_RESULTATS}.
Recopie les identifiants EXACTEMENT tels qu'ils apparaissent dans le catalogue. N'en invente jamais.
Prends en compte les acronymes, les synonymes métier et les thématiques de politique publique.
Si aucun indicateur ne correspond, renvoie une liste vide.`

const DESCRIPTION = `Identifie des indicateurs (IND-XXX) à partir d'une requête en langage naturel, quand l'utilisateur ne connaît pas leur identifiant.

Utilise cet outil quand l'utilisateur mentionne une thématique, un acronyme ou un libellé approximatif sans donner d'identifiant — « l'indicateur sur la fraude fiscale », « les délais de paiement ».

N'utilise PAS cet outil quand l'utilisateur a déjà fourni un IND-XXX explicite : appelle directement get_indicateur ou get_synthese_indicateur.

Renvoie au maximum ${MAX_RESULTATS} indicateurs, avec leur identifiant et leur nom uniquement. Aucune donnée de valeur ou d'avancement — utilise les autres outils pour cela.`

export const creerSearchIndicateursTool = (): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: z.object({
      requete: z
        .string()
        .min(1)
        .describe('La formulation de l’utilisateur, telle quelle, sans reformulation.'),
    }),
    execute: async ({ requete }, { abortSignal }) => {
      // Le catalogue est déjà restreint aux indicateurs lisibles par le principal : la
      // query applique withIndicateurReadPermission.
      const page = await listIndicateurs({ pageSize: TAILLE_CATALOGUE }).match(
        (data) => data,
        () => null,
      )
      const catalogue = (page?.items ?? []).map((item) => ({
        publicId: item.publicId,
        nom: item.nom,
      }))

      if (catalogue.length === 0) return { indicateurs: [] }

      const sortie = await generateText({
        model: creerModeleAssistant(),
        system: SYSTEM_PROMPT,
        prompt: `${requete}\n\n<catalogue>\n${JSON.stringify(catalogue)}\n</catalogue>`,
        output: Output.object({ schema: sortieSchema }),
        stopWhen: stepCountIs(3),
        temperature: TEMPERATURE_STRUCTUREE,
        abortSignal,
      })

      return {
        indicateurs: filtrerHallucinations(
          sortie.output.resultats,
          catalogue,
          (candidat) => candidat.id,
        ),
      }
    },
  })
```

- [ ] **Step 4: Écrire `searchCollections.ts`**

Même structure, en substituant l'entité. Le fichier est repris en entier plutôt que référencé : il sera lu isolément.

```ts
import { generateText, Output, stepCountIs, tool, type Tool } from 'ai'
import { z } from 'zod'

import { listCollections } from '@/collection/queries/listCollections'
import { creerModeleAssistant, TEMPERATURE_STRUCTUREE } from '@/assistant/runtime/modele'
import { filtrerHallucinations } from '@/assistant/tools/metier/searchIndicateurs'

const TAILLE_CATALOGUE = 500
const MAX_RESULTATS = 10

const sortieSchema = z.object({
  resultats: z
    .array(z.object({ id: z.string() }))
    .max(MAX_RESULTATS)
    .describe('Identifiants retenus, du plus pertinent au moins pertinent.'),
})

const SYSTEM_PROMPT = `Tu reçois une requête utilisateur en langage naturel et un catalogue de collections kpilote.
Ta tâche : renvoyer les identifiants du catalogue qui correspondent à la requête, du plus pertinent au moins pertinent, au maximum ${MAX_RESULTATS}.
Recopie les identifiants EXACTEMENT tels qu'ils apparaissent dans le catalogue. N'en invente jamais.
Si aucune collection ne correspond, renvoie une liste vide.`

const DESCRIPTION = `Identifie des collections (COL-XXX) à partir d'une requête en langage naturel, quand l'utilisateur ne connaît pas leur identifiant.

Utilise cet outil quand l'utilisateur évoque un regroupement d'indicateurs par son thème ou son intitulé approximatif, sans donner d'identifiant.

N'utilise PAS cet outil quand un COL-XXX explicite est fourni : appelle directement get_collection ou get_synthese_collection.

Renvoie au maximum ${MAX_RESULTATS} collections, avec leur identifiant et leur nom uniquement.`

export const creerSearchCollectionsTool = (): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: z.object({
      requete: z
        .string()
        .min(1)
        .describe('La formulation de l’utilisateur, telle quelle, sans reformulation.'),
    }),
    execute: async ({ requete }, { abortSignal }) => {
      const page = await listCollections({ pageSize: TAILLE_CATALOGUE }).match(
        (data) => data,
        () => null,
      )
      const catalogue = (page?.items ?? []).map((item) => ({
        publicId: item.publicId,
        nom: item.nom,
      }))

      if (catalogue.length === 0) return { collections: [] }

      const sortie = await generateText({
        model: creerModeleAssistant(),
        system: SYSTEM_PROMPT,
        prompt: `${requete}\n\n<catalogue>\n${JSON.stringify(catalogue)}\n</catalogue>`,
        output: Output.object({ schema: sortieSchema }),
        stopWhen: stepCountIs(3),
        temperature: TEMPERATURE_STRUCTUREE,
        abortSignal,
      })

      return {
        collections: filtrerHallucinations(
          sortie.output.resultats,
          catalogue,
          (candidat) => candidat.id,
        ),
      }
    },
  })
```

> Si les signatures réelles de `listIndicateurs` / `listCollections` exigent d'autres champs obligatoires que `pageSize`, les renseigner à partir de `listIndicateursQuerySchema` et `listCollectionsQuerySchema` dans `@pilote/kpilote-shared` — ce sont les schémas que les routes valident.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-api test -- searchIndicateurs`
Expected: PASS — 3 tests

- [ ] **Step 6: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/assistant/tools/metier
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): outils de recherche d'entite avec filtrage des hallucinations"
```

---

## Task 7: Outils de synthèse composés

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/metier/getSyntheseIndicateur.ts`
- Create: `apps/kpilote-api/src/assistant/tools/metier/getSyntheseCollection.ts`
- Test: `apps/kpilote-api/src/assistant/tools/metier/getSyntheseIndicateur.test.ts`

**Interfaces:**
- Consumes: `app` (`@/app`), `indicateurPublicIdSchema`, `collectionPublicIdSchema`
- Produces: `composerAppels(jeton, appels): Promise<Record<string, unknown>>`, `creerGetSyntheseIndicateurTool(jeton: string): Tool`, `creerGetSyntheseCollectionTool(jeton: string): Tool`

- [ ] **Step 1: Write the failing test**

Create `apps/kpilote-api/src/assistant/tools/metier/getSyntheseIndicateur.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { indicateurRoutes } from '@/indicateur/routes'
import { creerGetSyntheseIndicateurTool } from '@/assistant/tools/metier/getSyntheseIndicateur'

describe('get_synthese_indicateur', () => {
  it(
    'compose les sous-appels en un seul objet et y conserve le publicId',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_synthese_indicateur_key_ok'
      await fixtures.apiKey({ rawKey: cleBrute, label: 'assistant' })
      const indicateur = await fixtures.indicateur({ nom: 'Fraude fiscale' })

      buildTestApp(indicateurRoutes)
      const outil = creerGetSyntheseIndicateurTool(cleBrute)
      const resultat = (await outil.execute?.(
        { id: indicateur.publicId },
        { toolCallId: 'test', messages: [] },
      )) as Record<string, unknown>

      expect(resultat).toHaveProperty('identite')
      expect(resultat).toHaveProperty('tauxProgression')
      expect(resultat).toHaveProperty('valeursRemarquables')
      expect(resultat).toHaveProperty('objectifs')
      expect(resultat).toHaveProperty('syntheseIndividus')
      expect(JSON.stringify(resultat)).toContain(indicateur.publicId)
    }),
  )

  it('rejette un identifiant au format invalide avant tout appel', () => {
    const outil = creerGetSyntheseIndicateurTool('peu-importe')
    expect(outil.inputSchema.safeParse({ id: 'IND-quarante-deux' }).success).toBe(false)
    expect(outil.inputSchema.safeParse({ id: 'IND-42' }).success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-api test -- getSyntheseIndicateur`
Expected: FAIL — module introuvable

- [ ] **Step 3: Écrire `getSyntheseIndicateur.ts`**

```ts
import { indicateurPublicIdSchema } from '@pilote/kpilote-shared/publicIds'
import { tool, type Tool } from 'ai'
import { z } from 'zod'

import { app } from '@/app'

/**
 * Joue plusieurs appels documentés en parallèle et les assemble sous un seul objet.
 * Les queries sous-jacentes prennent un `params` typé par leur schéma de query string :
 * passer par les routes évite de le reconstruire, et applique les mêmes habilitations.
 * Une branche en échec devient `null` plutôt que de faire tomber la synthèse entière.
 */
export const composerAppels = async (
  jeton: string,
  appels: Record<string, string>,
): Promise<Record<string, unknown>> => {
  const entrees = Object.entries(appels)
  const reponses = await Promise.all(
    entrees.map(async ([, url]) => {
      const reponse = await app.request(url, { headers: { authorization: `Bearer ${jeton}` } })
      return reponse.ok ? ((await reponse.json()) as unknown) : null
    }),
  )
  return Object.fromEntries(entrees.map(([cle], index) => [cle, reponses[index]]))
}

const DESCRIPTION = `Dresse en un seul appel l'état complet d'un indicateur : son identité, son taux de progression, ses valeurs remarquables, ses objectifs et la synthèse par individu.

Préfère TOUJOURS cet outil à l'enchaînement d'appels unitaires quand l'utilisateur demande « où en est » un indicateur, son avancement, son état ou une synthèse.

Nécessite un identifiant au format IND-XXX. Si l'utilisateur n'en fournit pas, résous-le d'abord avec search_indicateurs.`

export const creerGetSyntheseIndicateurTool = (jeton: string): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: z.object({ id: indicateurPublicIdSchema }),
    execute: async ({ id }) =>
      composerAppels(jeton, {
        identite: `/indicateurs/${id}`,
        tauxProgression: `/indicateurs/${id}/taux-progression`,
        valeursRemarquables: `/indicateurs/${id}/valeurs-remarquables`,
        objectifs: `/indicateurs/${id}/objectifs`,
        syntheseIndividus: `/indicateurs/${id}/synthese-individus`,
      }),
  })
```

- [ ] **Step 4: Écrire `getSyntheseCollection.ts`**

```ts
import { collectionPublicIdSchema } from '@pilote/kpilote-shared/publicIds'
import { tool, type Tool } from 'ai'
import { z } from 'zod'

import { composerAppels } from '@/assistant/tools/metier/getSyntheseIndicateur'

const DESCRIPTION = `Dresse en un seul appel l'état d'une collection : son identité, les indicateurs qu'elle regroupe et son taux de progression.

Préfère TOUJOURS cet outil à l'enchaînement d'appels unitaires quand l'utilisateur demande où en est une collection ou son avancement d'ensemble.

Nécessite un identifiant au format COL-XXX. Si l'utilisateur n'en fournit pas, résous-le d'abord avec search_collections.`

export const creerGetSyntheseCollectionTool = (jeton: string): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: z.object({ id: collectionPublicIdSchema }),
    execute: async ({ id }) =>
      composerAppels(jeton, {
        identite: `/collections/${id}`,
        tauxProgression: `/collections/${id}/taux-progression`,
      }),
  })
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-api test -- getSyntheseIndicateur`
Expected: PASS — 2 tests

- [ ] **Step 6: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/assistant/tools/metier
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): outils de synthese composes indicateur et collection"
```

---

## Task 8: Registry et composition du prompt

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/registry.ts`
- Create: `apps/kpilote-api/src/assistant/prompts/socle.ts`
- Create: `apps/kpilote-api/src/assistant/prompts/surfaces/askLibre.ts`
- Create: `apps/kpilote-api/src/assistant/prompts/runtime.ts`
- Create: `apps/kpilote-api/src/assistant/prompts/construireSystemPrompt.ts`
- Test: `apps/kpilote-api/src/assistant/prompts/construireSystemPrompt.test.ts`
- Test: `apps/kpilote-api/src/assistant/tools/registry.test.ts`

**Interfaces:**
- Consumes: `WHITELIST`, `deriverTool` (Task 5), les quatre `creer*Tool` (Tasks 6-7), `Surface` (Task 2)
- Produces: `resoudreOutils(surface: Surface, jeton: string): ToolSet`, `construireSystemPrompt({ surface, maintenant }): string`

- [ ] **Step 1: Write the failing tests**

Create `apps/kpilote-api/src/assistant/prompts/construireSystemPrompt.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { construireSystemPrompt } from '@/assistant/prompts/construireSystemPrompt'
import { SOCLE } from '@/assistant/prompts/socle'

const maintenant = new Date('2026-08-28T10:00:00Z')

describe('construireSystemPrompt', () => {
  it('empile le socle, la couche de surface et le contexte runtime', () => {
    const prompt = construireSystemPrompt({ surface: 'ask-libre', maintenant })
    expect(prompt.startsWith(SOCLE)).toBe(true)
    expect(prompt).toContain('2026-08-28')
  })

  it('reste court : le socle part à chaque tour', () => {
    expect(SOCLE.split('\n').length).toBeLessThan(45)
  })

  it("n'embarque ni glossaire métier ni catalogue d'entités", () => {
    const prompt = construireSystemPrompt({ surface: 'ask-libre', maintenant })
    expect(prompt).not.toContain('IND-1')
    expect(prompt).not.toContain('Glossaire')
  })
})
```

Create `apps/kpilote-api/src/assistant/tools/registry.test.ts`:

```ts
import { NOMS_OUTILS } from '@pilote/kpilote-shared/assistant/tools'
import { describe, expect, it } from 'vitest'

import { resoudreOutils } from '@/assistant/tools/registry'

describe('resoudreOutils', () => {
  it('expose douze outils pour la surface ask-libre', () => {
    expect(Object.keys(resoudreOutils('ask-libre', 'jeton'))).toHaveLength(12)
  })

  it('n’expose que des noms déclarés dans le contrat partagé', () => {
    const noms = Object.keys(resoudreOutils('ask-libre', 'jeton'))
    expect(noms.every((nom) => (NOMS_OUTILS as ReadonlyArray<string>).includes(nom))).toBe(true)
  })

  it('donne une description non vide à chaque outil', () => {
    const outils = resoudreOutils('ask-libre', 'jeton')
    expect(Object.values(outils).every((outil) => (outil.description ?? '').length > 0)).toBe(true)
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
//   résolution est le travail de search_indicateurs / search_collections.
export const SOCLE = `Tu es l'assistant de kpilote, l'outil de pilotage d'indicateurs de politiques publiques de la DITP.

Règles invariantes :
- N'invente jamais une donnée. Toute valeur chiffrée que tu cites doit provenir d'un appel d'outil réalisé dans ce tour.
- Si une donnée manque ou qu'un outil ne renvoie rien, dis-le explicitement plutôt que de combler.
- N'écris jamais un appel d'outil en pseudo-code dans ta réponse. Utilise le mécanisme d'appel d'outil.
- Reste dans le périmètre kpilote : indicateurs, collections, valeurs d'avancement, référentiels et individus.
- Tu peux hiérarchiser factuellement sur la base des données. Tu ne formules pas d'avis personnel ni de recommandation que les données ne justifient pas.
- Réponds en français, en prose courte. Un tableau seulement quand il y a plusieurs entités à comparer sur les mêmes colonnes.
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

const COUCHES_SURFACE: Record<Surface, string> = {
  'ask-libre': ASK_LIBRE,
}

export const construireSystemPrompt = ({
  surface,
  maintenant,
}: {
  surface: Surface
  maintenant: Date
}): string => [SOCLE, COUCHES_SURFACE[surface], construireContexteRuntime({ maintenant })].join('\n\n')
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

export const resoudreOutils = (surface: Surface, jeton: string): ToolSet => {
  const metier: ToolSet = {
    search_indicateurs: creerSearchIndicateursTool(),
    search_collections: creerSearchCollectionsTool(),
    get_synthese_indicateur: creerGetSyntheseIndicateurTool(jeton),
    get_synthese_collection: creerGetSyntheseCollectionTool(jeton),
  }
  const derives: ToolSet = Object.fromEntries(
    WHITELIST.map((entree) => [entree.nom, deriverTool(entree, jeton)]),
  )

  const autorises = new Set<string>(OUTILS_PAR_SURFACE[surface])
  return Object.fromEntries(
    Object.entries({ ...metier, ...derives }).filter(([nom]) => autorises.has(nom)),
  )
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `pnpm --filter @pilote/kpilote-api test -- construireSystemPrompt registry`
Expected: PASS — 6 tests

- [ ] **Step 9: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/assistant/prompts apps/kpilote-api/src/assistant/tools/registry.ts apps/kpilote-api/src/assistant/tools/registry.test.ts
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): registry par surface et composition du prompt en couches"
```

---

## Task 9: Résolution des sources

**Files:**
- Create: `apps/kpilote-api/src/assistant/runtime/sources.ts`
- Test: `apps/kpilote-api/src/assistant/runtime/sources.test.ts`

**Interfaces:**
- Consumes: `extraireReferences`, `type ReferenceSource`, `type Source` (Task 1), `listIndicateurs`, `listCollections`
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
    'renvoie un tableau vide sans référence',
    integrationTest(async () => {
      const cle = await fixtures.apiKey({ label: 'assistant' })
      expect(await runAsAdmin(cle.id, () => resoudreSources([]))).toEqual([])
    }),
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-api test -- runtime/sources`
Expected: FAIL — module introuvable

- [ ] **Step 3: Write the implementation**

Create `apps/kpilote-api/src/assistant/runtime/sources.ts`:

```ts
import { type ReferenceSource, type Source } from '@pilote/kpilote-shared/assistant/sources'

import { listCollections } from '@/collection/queries/listCollections'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'

const TAILLE_LOT = 100

// Les référentiels et individus ne sont pas résolus en v1 : ils n'ont pas de page de
// détail dans le front. Ils sont extraits mais écartés ici, faute de destination.
const CHEMINS: Partial<Record<ReferenceSource['type'], (publicId: string) => string>> = {
  indicateur: (publicId) => `/indicateurs/${publicId}`,
  collection: (publicId) => `/collections/${publicId}`,
}

/**
 * Résout les libellés en lot. La résolution repasse par les queries, donc par les
 * filtres d'habilitation : une source que l'utilisateur ne peut pas lire disparaît du
 * panneau. Le sourcing est aussi un dernier filet de sécurité.
 */
export const resoudreSources = async (references: ReferenceSource[]): Promise<Source[]> => {
  const idsIndicateurs = references.filter((r) => r.type === 'indicateur').map((r) => r.publicId)
  const idsCollections = references.filter((r) => r.type === 'collection').map((r) => r.publicId)

  const [indicateurs, collections] = await Promise.all([
    idsIndicateurs.length === 0
      ? Promise.resolve([])
      : listIndicateurs({ ids: idsIndicateurs, pageSize: TAILLE_LOT }).match(
          (data) => data.items,
          () => [],
        ),
    idsCollections.length === 0
      ? Promise.resolve([])
      : listCollections({ ids: idsCollections, pageSize: TAILLE_LOT }).match(
          (data) => data.items,
          () => [],
        ),
  ])

  const libelles = new Map<string, string>([
    ...indicateurs.map((item): [string, string] => [`indicateur:${item.publicId}`, item.nom]),
    ...collections.map((item): [string, string] => [`collection:${item.publicId}`, item.nom]),
  ])

  return references.flatMap((reference) => {
    const construireChemin = CHEMINS[reference.type]
    const libelle = libelles.get(`${reference.type}:${reference.publicId}`)
    if (!construireChemin || libelle === undefined) return []
    return [{ ...reference, libelle, chemin: construireChemin(reference.publicId) }]
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-api test -- runtime/sources`
Expected: PASS — 3 tests

> Si `listCollections` n'accepte pas de paramètre `ids`, filtrer côté appelant après un `listCollections({ pageSize: TAILLE_LOT })` restreint aux identifiants demandés, et ajouter un commentaire expliquant pourquoi.

- [ ] **Step 5: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/assistant/runtime/sources.ts apps/kpilote-api/src/assistant/runtime/sources.test.ts
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): resolution des sources refiltree par les habilitations"
```

---

## Task 10: Runtime, route de conversation et persistance

**Files:**
- Create: `apps/kpilote-api/src/assistant/runtime/AssistantRuntime.ts`
- Create: `apps/kpilote-api/src/assistant/commands/enregistrerConversation.ts`
- Create: `apps/kpilote-api/src/assistant/routes.ts`
- Test: `apps/kpilote-api/src/assistant/routes.test.ts`
- Modify: `apps/kpilote-api/src/app.ts` — enregistrer les routes

**Interfaces:**
- Consumes: `resoudreOutils`, `construireSystemPrompt` (Task 8), `resoudreSources` (Task 9), `extraireReferences` (Task 1), `creerModeleAssistant`, `MAX_ETAPES`, `TEMPERATURE_CONVERSATION` (Task 4)
- Produces: `streamerTour(params): Promise<Response>`, `enregistrerConversation(params): Promise<void>`, `assistantRoutes`

- [ ] **Step 1: Write the failing test**

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

describe('POST /assistant/chat', () => {
  it(
    'renvoie 401 sans authentification',
    integrationTest(async () => {
      const response = await buildApp().request('/assistant/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: corps(),
      })
      expect(response.status).toBe(401)
    }),
  )

  it(
    'renvoie 400 sur une surface inconnue',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_surface_inconnue_ok'
      await fixtures.apiKey({ rawKey: cleBrute, label: 'assistant' })

      const response = await buildApp().request('/assistant/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${cleBrute}` },
        body: corps({ surface: 'ask-entite' }),
      })
      expect(response.status).toBe(400)
    }),
  )

  it(
    'renvoie 400 quand conversationId n’est pas un uuid',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_uuid_invalide_okay'
      await fixtures.apiKey({ rawKey: cleBrute, label: 'assistant' })

      const response = await buildApp().request('/assistant/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${cleBrute}` },
        body: corps({ conversationId: 'pas-un-uuid' }),
      })
      expect(response.status).toBe(400)
    }),
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pilote/kpilote-api test -- assistant/routes`
Expected: FAIL — module `@/assistant/routes` introuvable

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
        const p = part as { type?: string }
        return p.type === 'text'
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
  // Aller-retour JSON explicite : le sérialiseur de Prisma plante sur les schémas zod
  // que le SDK attache aux définitions d'outils présentes dans les parts.
  const blob = JSON.parse(JSON.stringify(messages)) as object
  const titre = deriverTitre(messages)

  await db().assistantConversation.upsert({
    where: { id },
    create: { id, utilisateurId, surface, titre, messages: blob },
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
      transcript: JSON.parse(JSON.stringify(transcript)) as object,
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
import { type Surface } from '@pilote/kpilote-shared/assistant/surfaces'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai'

import { enregistrerAppel, enregistrerConversation } from '@/assistant/commands/enregistrerConversation'
import { construireSystemPrompt } from '@/assistant/prompts/construireSystemPrompt'
import { resoudreSources } from '@/assistant/runtime/sources'
import {
  creerModeleAssistant,
  MAX_ETAPES,
  MODELE_PAR_DEFAUT,
  TEMPERATURE_CONVERSATION,
} from '@/assistant/runtime/modele'
import { resoudreOutils } from '@/assistant/tools/registry'
import { logger } from '@/framework/logger/logger'
import { startTimer } from '@/framework/timer'

export const streamerTour = async ({
  surface,
  conversationId,
  utilisateurId,
  messages,
  jeton,
  abortSignal,
}: {
  surface: Surface
  conversationId: string
  utilisateurId: string
  messages: UIMessage[]
  jeton: string
  abortSignal?: AbortSignal
}): Promise<Response> => {
  const elapsed = startTimer()
  const outils = resoudreOutils(surface, jeton)

  const resultat = streamText({
    model: creerModeleAssistant(),
    system: construireSystemPrompt({ surface, maintenant: new Date() }),
    messages: await convertToModelMessages(messages),
    tools: outils,
    stopWhen: stepCountIs(MAX_ETAPES),
    temperature: TEMPERATURE_CONVERSATION,
    abortSignal,
  })

  const flux = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      writer.merge(resultat.toUIMessageStream())

      // Les sources sont dérivées de ce que les outils ont RÉELLEMENT renvoyé, pas
      // citées par le modèle : ni oubli ni invention possibles.
      const etapes = await resultat.steps
      const sortiesOutils = etapes.flatMap((etape) =>
        etape.toolResults.map((appel) => appel.output as unknown),
      )
      const sources = await resoudreSources(extraireReferences(sortiesOutils))
      if (sources.length > 0) writer.write({ type: 'data-sources', data: sources })

      const usage = await resultat.usage
      logger.info(
        {
          event: 'assistant.tour.done',
          conversationId,
          surface,
          durationMs: elapsed(),
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          outils: etapes.flatMap((etape) => etape.toolCalls.map((appel) => appel.toolName)),
        },
        'Assistant — tour terminé',
      )

      await enregistrerAppel({
        conversationId,
        utilisateurId,
        modele: MODELE_PAR_DEFAUT,
        surface,
        transcript: await resultat.response,
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        dureeMs: elapsed(),
      })
    },
    onFinish: async ({ messages: messagesFinaux }) => {
      await enregistrerConversation({
        id: conversationId,
        utilisateurId,
        surface,
        messages: messagesFinaux,
      })
    },
  })

  return createUIMessageStreamResponse({ stream: flux })
}
```

> `enregistrerAppel` doit précéder `enregistrerConversation` en cas de contrainte de clé étrangère : `AssistantAppel.conversationId` référence `AssistantConversation.id`. Si la contrainte échoue, déplacer l'écriture de l'appel dans le `onFinish`, après l'upsert de la conversation.

- [ ] **Step 5: Écrire `routes.ts`**

```ts
import { createRoute, z } from '@hono/zod-openapi'
import { chatRequestSchema } from '@pilote/kpilote-shared/assistant/surfaces'
import { validateUIMessages, type UIMessage } from 'ai'

import { streamerTour } from '@/assistant/runtime/AssistantRuntime'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { erreur400 } from '@/framework/openapi/responses'

const ChatBodySchema = chatRequestSchema.openapi('AssistantChatBody')

const chatRoute = createRoute({
  method: 'post',
  path: '/assistant/chat',
  tags: ['Assistant'],
  summary: 'Ouvrir un tour de conversation avec l’assistant',
  description:
    "Streame la réponse de l'assistant au format UIMessage du SDK `ai` (flux SSE). La `surface` est déclarée par l'appelant et détermine la couche de prompt et les outils autorisés : le moteur ne déduit jamais l'intention du texte. Les sources consultées sont émises en fin de tour dans une part `data-sources`, dérivée des identifiants publics réellement renvoyés par les outils et refiltrée par les habilitations de l'appelant.",
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
  const jeton = (context.req.header('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const messages = (await validateUIMessages({ messages: corps.messages })) as UIMessage[]

  return streamerTour({
    surface: corps.surface,
    conversationId: corps.conversationId,
    utilisateurId: requireCurrentPrincipalId(),
    messages,
    jeton,
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

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-api test -- assistant/routes`
Expected: PASS — 3 tests

- [ ] **Step 8: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/assistant apps/kpilote-api/src/app.ts
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): route de conversation, runtime et persistance du tour"
```

---

## Task 11: Retour utilisateur

**Files:**
- Create: `packages/kpilote-shared/src/assistant/feedback.ts`
- Create: `apps/kpilote-api/src/assistant/commands/evaluerReponse.ts`
- Modify: `apps/kpilote-api/src/assistant/routes.ts` — ajouter la route d'évaluation
- Modify: `apps/kpilote-api/src/assistant/routes.test.ts` — ajouter les cas
- Modify: `packages/kpilote-shared/package.json` — export `./assistant/feedback`

**Interfaces:**
- Consumes: `AssistantEvaluation`, `AssistantCategorieProbleme` (Task 3)
- Produces: `evaluerBodySchema`, `type EvaluerBody`, `CATEGORIES_PROBLEME`, `evaluerReponse(params): Promise<void>`

- [ ] **Step 1: Write the failing test**

Ajouter à `apps/kpilote-api/src/assistant/routes.test.ts` :

```ts
describe('POST /assistant/conversations/{id}/evaluation', () => {
  it(
    'refuse un feedback négatif sans catégorie',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_eval_sans_categ_ok'
      await fixtures.apiKey({ rawKey: cleBrute, label: 'assistant' })

      const response = await buildApp().request(
        `/assistant/conversations/${conversationId}/evaluation`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', Authorization: `Bearer ${cleBrute}` },
          body: JSON.stringify({ evaluation: 'NEGATIVE', categories: [] }),
        },
      )
      expect(response.status).toBe(400)
    }),
  )

  it(
    'refuse la catégorie AUTRE sans commentaire',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_eval_autre_vide_ok'
      await fixtures.apiKey({ rawKey: cleBrute, label: 'assistant' })

      const response = await buildApp().request(
        `/assistant/conversations/${conversationId}/evaluation`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', Authorization: `Bearer ${cleBrute}` },
          body: JSON.stringify({ evaluation: 'NEGATIVE', categories: ['AUTRE'] }),
        },
      )
      expect(response.status).toBe(400)
    }),
  )

  it(
    'accepte un feedback positif sans commentaire',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_eval_positif_okay'
      await fixtures.apiKey({ rawKey: cleBrute, label: 'assistant' })

      const response = await buildApp().request(
        `/assistant/conversations/${conversationId}/evaluation`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', Authorization: `Bearer ${cleBrute}` },
          body: JSON.stringify({ evaluation: 'POSITIVE' }),
        },
      )
      expect(response.status).toBe(204)
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
    z.object({
      evaluation: z.literal('POSITIVE'),
      commentaire: z.string().optional(),
    }),
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
 * L'évaluation porte sur le dernier tour de la conversation : c'est celui que
 * l'utilisateur a sous les yeux quand il clique.
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

Dans `apps/kpilote-api/src/assistant/routes.ts` :

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

Ajouter les imports correspondants en tête de fichier : `evaluerBodySchema` depuis `@pilote/kpilote-shared/assistant/feedback` et `evaluerReponse` depuis `@/assistant/commands/evaluerReponse`.

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @pilote/kpilote-api test -- assistant/routes`
Expected: PASS — 6 tests

- [ ] **Step 7: Lint et commit**

```bash
pnpm lint
git add packages/kpilote-shared apps/kpilote-api/src/assistant
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): retour utilisateur sur les reponses de l'assistant"
```

---

## Task 12: Harnais d'évaluation

**Files:**
- Create: `apps/kpilote-api/src/assistant/evals/cas.ts`
- Create: `apps/kpilote-api/src/assistant/evals/executer.ts`
- Modify: `apps/kpilote-api/package.json` — script `eval`

**Interfaces:**
- Consumes: `resoudreOutils`, `construireSystemPrompt`, `creerModeleAssistant`, `MAX_ETAPES`
- Produces: `type CasEval`, `CAS: ReadonlyArray<CasEval>`, script `pnpm --filter @pilote/kpilote-api eval`

> Les évals vivent sous `src/` et non à la racine de l'app : le `tsconfig.json` de kpilote-api n'inclut que `src/**/*`, et `pnpm lint` ne parcourt que `src` et `scripts`. Placées ailleurs, les imports `@/assistant/...` ne résoudraient pas et le fichier échapperait au lint.

- [ ] **Step 1: Écrire le jeu de cas**

Create `apps/kpilote-api/src/assistant/evals/cas.ts`:

```ts
import { type NomOutil } from '@pilote/kpilote-shared/assistant/tools'
import { type Surface } from '@pilote/kpilote-shared/assistant/surfaces'

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
    /** Le tour ne doit avoir déclenché aucun appel d'outil. */
    aucunOutil?: boolean
  }
}

// On n'évalue pas la prose : elle est instable et la noter demanderait un juge, donc du
// bruit. « Quel outil », « avec quels paramètres », « quelles sources » sont des faits
// binaires, extraits du transcript qu'on stocke déjà.
//
// Les identifiants ci-dessous supposent le jeu de données de recette. Les ajuster à
// l'environnement d'exécution avant le premier passage.
export const CAS: ReadonlyArray<CasEval> = [
  {
    nom: 'résolution depuis un libellé approximatif',
    question: "l'indicateur sur la fraude fiscale, il en est où ?",
    surface: 'ask-libre',
    attendu: {
      outilsAppeles: ['search_indicateurs', 'get_synthese_indicateur'],
    },
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
    attendu: { sourcesContiennent: [] },
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
import { generateText, stepCountIs } from 'ai'

import { CAS, type CasEval } from './cas'
import { construireSystemPrompt } from '@/assistant/prompts/construireSystemPrompt'
import { creerModeleAssistant, MAX_ETAPES } from '@/assistant/runtime/modele'
import { resoudreOutils } from '@/assistant/tools/registry'

const JETON = process.env.EVAL_API_KEY
if (!JETON) throw new Error('EVAL_API_KEY manquante — clé API utilisée pour les appels d’outils.')

type Verdict = { cas: string; ok: boolean; details: string[] }

const evaluer = async (cas: CasEval): Promise<Verdict> => {
  const resultat = await generateText({
    model: creerModeleAssistant(),
    system: construireSystemPrompt({ surface: cas.surface, maintenant: new Date() }),
    prompt: cas.question,
    tools: resoudreOutils(cas.surface, JETON),
    stopWhen: stepCountIs(MAX_ETAPES),
  })

  const appeles = resultat.steps.flatMap((etape) => etape.toolCalls.map((a) => a.toolName))
  const sorties = resultat.steps.flatMap((etape) => etape.toolResults.map((a) => a.output))
  const sources = extraireReferences(sorties).map((reference) => reference.publicId)

  const details: string[] = []
  const { attendu } = cas

  for (const attendus of attendu.outilsAppeles ?? []) {
    if (!appeles.includes(attendus)) details.push(`outil manquant : ${attendus}`)
  }
  for (const interdit of attendu.outilsInterdits ?? []) {
    if (appeles.includes(interdit)) details.push(`outil interdit appelé : ${interdit}`)
  }
  for (const source of attendu.sourcesContiennent ?? []) {
    if (!sources.includes(source)) details.push(`source manquante : ${source}`)
  }
  if (attendu.aucunOutil && appeles.length > 0) {
    details.push(`aucun outil attendu, ${appeles.length} appelé(s) : ${appeles.join(', ')}`)
  }

  return { cas: cas.nom, ok: details.length === 0, details }
}

const principal = async (): Promise<void> => {
  const verdicts: Verdict[] = []
  for (const cas of CAS) verdicts.push(await evaluer(cas))

  for (const verdict of verdicts) {
    // eslint-disable-next-line no-console -- sortie d'un script d'évaluation
    console.log(`${verdict.ok ? 'OK  ' : 'ÉCHEC'} ${verdict.cas}`)
    // eslint-disable-next-line no-console -- sortie d'un script d'évaluation
    for (const detail of verdict.details) console.log(`      ${detail}`)
  }

  const reussis = verdicts.filter((verdict) => verdict.ok).length
  // eslint-disable-next-line no-console -- sortie d'un script d'évaluation
  console.log(`\n${reussis}/${verdicts.length} cas réussis`)
  if (reussis !== verdicts.length) process.exitCode = 1
}

void principal()
```

- [ ] **Step 3: Déclarer le script**

Dans `apps/kpilote-api/package.json`, sous `scripts` :

```json
    "eval": "tsx src/assistant/evals/executer.ts",
```

Ne PAS le brancher dans la CI : chaque exécution consomme des appels Albert.

- [ ] **Step 4: Vérifier la compilation**

Run: `pnpm --filter @pilote/kpilote-api lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/kpilote-api/src/assistant/evals apps/kpilote-api/package.json
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): harnais d'evaluation des decisions de l'assistant"
```

---

## Task 13: Rendu de la conversation dans le webapp

**Files:**
- Create: `apps/kpilote-webapp/src/assistant/useAssistant.ts`
- Create: `apps/kpilote-webapp/src/assistant/nettoyerPseudoAppels.ts`
- Create: `apps/kpilote-webapp/src/assistant/AssistantPanel.tsx`
- Create: `apps/kpilote-webapp/src/assistant/AssistantMessage.tsx`
- Create: `apps/kpilote-webapp/src/assistant/PanneauSources.tsx`
- Create: `apps/kpilote-webapp/src/assistant/BarreFeedback.tsx`
- Test: `apps/kpilote-webapp/src/assistant/nettoyerPseudoAppels.test.ts`
- Modify: `apps/kpilote-webapp/package.json` — `ai`, `@ai-sdk/react`

**Interfaces:**
- Consumes: `KpiloteUIMessage`, `NOMS_OUTILS`, `LIBELLES_OUTILS`, `Source`, `LIBELLES_CATEGORIES`
- Produces: `nettoyerPseudoAppels(texte: string): string`, `useAssistant()`, `<AssistantPanel />`

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

- [ ] **Step 3: Write the implementation**

Create `apps/kpilote-webapp/src/assistant/nettoyerPseudoAppels.ts`:

```ts
import { NOMS_OUTILS } from '@pilote/kpilote-shared/assistant/tools'

// Les modèles reproduisent parfois la syntaxe d'appel d'outil vue à l'entraînement, et
// le bloc apparaît en texte brut à l'utilisateur. Filet de sécurité, alimenté par le
// contrat partagé : la liste ne peut pas diverger de celle que le serveur enregistre.
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

  return conservees.join('\n').replace(/(\n\s*---\s*)+\s*$/u, '').trim()
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

  // Le throttle évite un re-rendu par token : le flux arrive plus vite que React ne
  // peut peindre.
  return useChat<KpiloteUIMessage>({ chat: chatRef.current, experimental_throttle: 250 })
}
```

> Adapter `apiUrl` et l'injection du jeton porteur à ce que fait déjà `src/api/client.ts` — le transport doit envoyer le même en-tête `Authorization` que les autres appels.

- [ ] **Step 7: Écrire les composants de rendu**

`PanneauSources.tsx` :

```tsx
import type { Source } from '@pilote/kpilote-shared/assistant/sources'
import { Link } from '@tanstack/react-router'

export function PanneauSources({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null

  return (
    <section aria-label="Sources consultées" className="mt-3 border-t border-border pt-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-text-subtle">Sources</h3>
      <ul className="mt-1 flex flex-wrap gap-2">
        {sources.map((source) => (
          <li key={`${source.type}:${source.publicId}`}>
            <Link
              to={source.chemin}
              className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-sm hover:bg-surface"
            >
              <span>{source.libelle}</span>
              <span className="font-mono text-xs text-text-subtle">{source.publicId}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

`AssistantMessage.tsx` :

```tsx
import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { LIBELLES_OUTILS, type NomOutil } from '@pilote/kpilote-shared/assistant/tools'

import { clsxm } from '@/lib/clsxm'

import { nettoyerPseudoAppels } from './nettoyerPseudoAppels'
import { PanneauSources } from './PanneauSources'

const libelleOutil = (typePart: string): string => {
  const nom = typePart.replace(/^tool-/, '') as NomOutil
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

`BarreFeedback.tsx` :

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
    categories.length === 0 ||
    (categories.includes('AUTRE') && commentaire.trim().length === 0)

  if (etat === 'envoye') {
    return <p className="text-sm text-text-subtle">Merci pour votre retour.</p>
  }

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
                        ? precedentes.filter((c) => c !== categorie)
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

`AssistantPanel.tsx` :

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

> Adapter `Button` et les tokens de couleur (`bg-surface`, `border-border`, `text-text-subtle`, `text-danger`, `border-accent`) à ce qui existe réellement dans `src/components/ui` et dans la config Tailwind du projet. Convention à respecter : Tailwind et composants partagés, jamais de classes DSFR `fr-*`, jamais de couleur en dur — et le helper de composition de classes s'appelle `clsxm`.

- [ ] **Step 8: Lint et commit**

```bash
pnpm --filter @pilote/kpilote-webapp lint
git add apps/kpilote-webapp/src/assistant apps/kpilote-webapp/package.json pnpm-lock.yaml
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): rendu de la conversation et panneau de sources"
```

---

## Task 14: Point d'entrée dans la palette

**Files:**
- Create: `apps/kpilote-webapp/src/components/command-palette/useAssistantCommand.ts`
- Modify: `apps/kpilote-webapp/src/components/command-palette/CommandPalette.tsx`
- Modify: `apps/kpilote-webapp/src/lib/commands/types.ts` — ajouter `'assistant'` à `CommandGroup`

**Interfaces:**
- Consumes: `type Command`, `type CommandAction` (`@/lib/commands/types`), `AssistantPanel` (Task 13)
- Produces: `useAssistantCommand(query: string, close: () => void): Command`

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
 * Entrée « Demander à l'IA » de la palette. La question tapée est transmise telle
 * quelle : la surface est déclarée par l'appelant, le moteur ne devine rien.
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

Dans `CommandPalette.tsx`, à la suite des autres hooks de commandes :

```tsx
const assistantCommand = useAssistantCommand(query, (question) => {
  close()
  ouvrirAssistant(question)
})
```

Ajouter `assistantCommand` en tête de `rootCommands` et de son tableau de dépendances — sans quoi le `Tab` ne résoudra pas l'entrée surlignée :

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

Puis rendre le groupe, placé avant le groupe Navigation dans le JSX :

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

Ajouter enfin la prop `ouvrirAssistant: (question: string) => void` à `CommandPaletteProps` et la faire remonter au parent :

```tsx
type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  ouvrirAssistant: (question: string) => void
}
```

Le parent qui monte `AssistantPanel` fournit cette fonction — un état local dans le layout authentifié suffit : la palette se ferme, le panneau s'ouvre avec la question pré-remplie.

- [ ] **Step 4: Vérifier**

Run: `pnpm --filter @pilote/kpilote-webapp lint`
Expected: PASS

Puis lancer l'application et vérifier à la main : `⌘K` sur l'état vide fait apparaître « Demander à l'IA », `Entrée` ouvre le panneau, une question renvoie une réponse suivie de son panneau de sources cliquable.

- [ ] **Step 5: Commit**

```bash
git add apps/kpilote-webapp/src
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1684): entree Demander a l'IA dans la palette de commandes"
```
