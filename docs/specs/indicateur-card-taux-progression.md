# Spec — Barre de progression sur IndicateurCard

## Contexte

`IndicateurCard` affiche actuellement la dernière valeur d'avancement d'un indicateur pour un individu donné (`IndicateurAvancement`). On souhaite y ajouter le taux de progression sous forme d'une barre de progression.

---

## Comportement attendu

### Quand la barre s'affiche

La barre s'affiche uniquement quand :
1. Un `context` (individu) est fourni à la card — même condition que l'avancement actuel.
2. Un objectif est défini pour cet indicateur × individu — le taux doit être calculable.

Si l'une de ces conditions n'est pas remplie, la barre est silencieusement absente. Aucun état "vide" ou "pas d'objectif" n'est affiché.

### Layout du footer

```
┌─────────────────────────────────────┐
│ Nom de l'indicateur                 │
├─────────────────────────────────────┤
│ 42,5 unité · jan. 2025             │  ← IndicateurAvancement (existant)
│ ████████░░░░░░ 73 %                 │  ← Barre (nouveau, si taux disponible)
└─────────────────────────────────────┘
```

- La barre est positionnée **sous** la valeur d'avancement.
- Le pourcentage est affiché **en chiffre** à droite de la barre.
- La couleur de la barre est le même bleu que le texte de la valeur (pas de variante colorée selon seuils).
- Le taux est plafonné à 100 (logique backend, `min(100, valeur/valeurCible×100)`). Aucune distinction visuelle entre "atteint exactement" et "dépassé".

---

## Architecture

### Décision API

On enrichit l'endpoint existant `GET /individus/{id}/dernieres-valeurs` avec le taux de progression.

**Pourquoi pas un endpoint séparé :** dans tous les contextes qui affichent une `IndicateurCard` avec `context`, la valeur et le taux sont toujours affichés ensemble. Créer un second endpoint + un second batcher frontend pour synchroniser deux queries sur la même card ajoute de la complexité sans bénéfice. L'endpoint existant est déjà batché (max 50 indicateurs par requête) — le coût additionnel du chargement des objectifs est amortissable.

**Format de réponse :** `tauxProgression: number | null` ajouté à `DernierValeurIndividuApiModel`. `null` signifie qu'aucun objectif n'est défini pour cet indicateur × individu.

### Factorisation backend

Dans la boucle de `listDernieresValeursForIndividu`, le contexte de série (`loadResolveSerieContext`) est déjà chargé pour calculer la valeur. On **réutilise cette série** pour le taux — on charge `loadResolveObjectifContext` en parallèle du contexte de série (au lieu d'un appel séparé), puis `resolveObjectifIndividu` (synchrone) consomme directement le contexte objectif.

Cela évite de charger deux fois l'arbre (`loadSousArbre`) et les fonctions d'agrégation (`loadFonctionsAgregation`) par indicateur, sans toucher aux autres appelants de ces fonctions.

---

## Vérifications techniques

### 1. Signature de `resolveTauxProgression`

```ts
// apps/mb-api/src/valeurAvancement/resolveTauxProgression.ts:55
resolveTauxProgression({
  valeurs: ReadonlyArray<ValeurBrute>,
  objectifsParIndividu: Map<string, ReadonlyArray<ObjectifBrut>>,
}): TauxProgressionPoint[]

type ValeurBrute = {
  individuId: string
  individuPublicId: string  // ← champ requis, déjà disponible dans individu.publicId
  date: Bucket
  valeur: Decimal
}

type ObjectifBrut = {
  dateCible: Bucket
  valeurCible: Decimal
}
```

`tauxProgression` sur le dernier point peut être `null` si `valeurCible === 0`.

La conversion `objectifsMap → ObjectifBrut[]` suit le pattern de `computeTauxProgressionPoints:71-76` :

```ts
const objectifsList: ObjectifBrut[] = [...objectifsMap.values()]
  .map((p) => ({ dateCible: p.bucket, valeurCible: p.valeur }))
  .sort((a, b) => compareBuckets(a.dateCible, b.dateCible))
```

### 2. Synchronicité de `resolveObjectifIndividu`

Confirmée — la fonction est entièrement synchrone (aucun `async`/`await`/`Promise`). Elle prend `(individuId, ctx, cache)` et retourne `ReadonlyMap<BucketKey, PointObjectifInterne>` où chaque point expose `{ bucket: Bucket, valeur: Decimal }`.

---

## Plan d'implémentation

### Étape 1 — Schéma partagé (`packages/mb-shared/src/valeurAvancement.ts`)

Ajouter `tauxProgression` à `dernierValeurIndividuApiModelSchema` (ligne 443) :

```ts
export const dernierValeurIndividuApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  valeur: valeurSchema.describe("Dernière valeur connue de l'individu pour cet indicateur."),
  date: dateSchema.describe(
    "Date du bucket de la dernière valeur connue (post-troncature mensuelle).",
  ),
  type: z
    .enum(['saisie', 'derivee'])
    .describe(/* ... */),
  tauxProgression: z
    .number()
    .nullable()
    .describe(
      "Taux de progression vers l'objectif courant (0–100), null si aucun objectif n'est défini " +
        "pour cet indicateur × individu ou si la valeur cible est zéro.",
    ),
})
```

### Étape 2 — Query backend (`apps/mb-api/src/valeurAvancement/queries/listDernieresValeursForIndividu.ts`)

**Nouveaux imports à ajouter :**

```ts
import { loadResolveObjectifContext } from '@/objectifIndicateurIndividu/queries/loadResolveObjectifContext'
import {
  type PointObjectifInterne,
  resolveObjectifIndividu,
} from '@/objectifIndicateurIndividu/resolveObjectifIndividu'
import {
  type ObjectifBrut,
  resolveTauxProgression,
} from '@/valeurAvancement/resolveTauxProgression'
import { type BucketKey } from '@/framework/bucket'
```

**Remplacement de la boucle par indicateur** — actuellement :

```ts
const { ctx } = await loadResolveSerieContext({ indicateurId: indicateur.id, individusCibles: [individu], dateTrunc })
const cache = new Map<string, ReadonlyArray<PointInterne>>()
const serie = await resolveSerieIndividu(individu.id, ctx, cache)
const dernier = serie.at(-1)
if (!dernier) return null
const item: DernierValeurIndividuApiModel = {
  indicateur: indicateur.publicId,
  valeur: dernier.valeur.toNumber(),
  date: formatBucket(dernier.bucket),
  type: dernier.type,
}
return item
```

Remplacer par :

```ts
const [{ ctx: serieCtx }, { ctx: objectifCtx }] = await Promise.all([
  loadResolveSerieContext({ indicateurId: indicateur.id, individusCibles: [individu], dateTrunc }),
  loadResolveObjectifContext({ indicateurId: indicateur.id, individusCibles: [individu], dateTrunc }),
])

const serieCache = new Map<string, ReadonlyArray<PointInterne>>()
const serie = await resolveSerieIndividu(individu.id, serieCtx, serieCache)
const dernier = serie.at(-1)
if (!dernier) return null

const objectifCache = new Map<string, ReadonlyMap<BucketKey, PointObjectifInterne>>()
const objectifsMap = resolveObjectifIndividu(individu.id, objectifCtx, objectifCache)
let tauxProgression: number | null = null
if (objectifsMap.size > 0) {
  const objectifsList: ObjectifBrut[] = [...objectifsMap.values()]
    .map((p) => ({ dateCible: p.bucket, valeurCible: p.valeur }))
    .sort((a, b) => compareBuckets(a.dateCible, b.dateCible))
  const tauxPoints = resolveTauxProgression({
    valeurs: serie.map((p) => ({
      individuId: individu.id,
      individuPublicId: individu.publicId,
      date: p.bucket,
      valeur: p.valeur,
    })),
    objectifsParIndividu: new Map([[individu.id, objectifsList]]),
  })
  tauxProgression = tauxPoints.at(-1)?.tauxProgression ?? null
}

const item: DernierValeurIndividuApiModel = {
  indicateur: indicateur.publicId,
  valeur: dernier.valeur.toNumber(),
  date: formatBucket(dernier.bucket),
  type: dernier.type,
  tauxProgression,
}
return item
```

> `compareBuckets` est déjà importé dans ce fichier via `@/framework/bucket` (à vérifier, sinon l'ajouter).

### Étape 3 — Composant frontend (`apps/mb-webapp/src/components/indicateurs/IndicateurAvancement.tsx`)

Ajouter `Progress` aux imports existants :

```tsx
import { Progress } from 'radix-ui'
```

Après l'affichage de la valeur, ajouter conditionnellement la barre (la couleur exacte est à aligner avec la classe Tailwind déjà utilisée pour le texte de la valeur dans ce composant) :

```tsx
{data.tauxProgression !== null && (
  <div className="flex items-center gap-2 mt-1">
    <Progress.Root
      value={data.tauxProgression}
      max={100}
      className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden"
    >
      <Progress.Indicator
        className="h-full bg-blue-600 transition-transform duration-300"
        style={{ transform: `translateX(-${100 - data.tauxProgression}%)` }}
      />
    </Progress.Root>
    <span className="text-sm text-blue-600 tabular-nums shrink-0">
      {Math.round(data.tauxProgression)} %
    </span>
  </div>
)}
```

---

## Cas limites

| Cas | Comportement |
|-----|-------------|
| Pas d'objectif défini | `tauxProgression: null` → barre absente |
| Objectif avec `valeurCible === 0` | `computeTaux` retourne `null` → barre absente |
| Taux = 0 % | Barre vide affichée |
| Taux = 100 % | Barre pleine |
| Taux > 100 % (dépassement) | Plafonné à 100 % côté backend, barre pleine |
| Pas de valeur d'avancement | `serie.at(-1) === undefined` → retour `null` dès le début, pas de taux |
| Card sans `context` | Footer = "Mis à jour MM/YYYY", aucun appel réseau |

---

## Tests

### Infrastructure de test disponible

- Tests d'intégration avec `integrationTest` (transaction auto-rollback)
- Fixtures : `fixtures.indicateur`, `fixtures.valeurAvancement`, `fixtures.objectifIndicateurIndividu`, `fixtures.relation`, `fixtures.apiKey`
- Générateurs d'ID : `testIndicateurId()`, `testDeptId()`, `testRegId()`, `testReferentielId()`
- Contexte principal : `runAsPrincipal(apiKey.id, fn)`
- Pas de tests frontend identifiés pour `IndicateurAvancement` — la couverture est côté API.

---

### Étape 4a — Mise à jour des tests existants (`listDernieresValeursForIndividu.test.ts`)

**Attention : tous les `toEqual` existants vont casser** dès l'ajout de `tauxProgression` au schéma. Chaque assertion du fichier doit être complétée avec `tauxProgression: null` (aucun objectif n'est défini dans les fixtures actuelles).

Exemple pour le premier test :

```ts
// avant
expect(result._unsafeUnwrap()).toEqual({
  items: [{ indicateur: indId, valeur: 75, date: '2026-03-01', type: 'saisie' }],
})

// après
expect(result._unsafeUnwrap()).toEqual({
  items: [{ indicateur: indId, valeur: 75, date: '2026-03-01', type: 'saisie', tauxProgression: null }],
})
```

**Tests à mettre à jour (6 au total) :**
1. `retourne la dernière valeur saisie d'un individu pour un indicateur`
2. `n'inclut que les indicateurs ayant au moins une valeur pour l'individu`
3. `omet les indicateurs inaccessibles en lecture`
4. `retourne type=derivee pour un individu agrégé sur des enfants ayant des valeurs`

(Les tests `omet l'indicateur si l'individu n'a aucune valeur` et `retourne items vide quand l'individu n'existe pas` retournent `{ items: [] }` — inchangés.)

---

### Étape 4b — Nouveaux tests (`listDernieresValeursForIndividu.test.ts`)

Ajouter dans le même `describe.concurrent` :

#### 1. Taux calculé quand un objectif est défini

```ts
it(
  'retourne le tauxProgression calculé quand un objectif est défini',
  integrationTest(async () => {
    const indId = testIndicateurId()
    const deptId = testDeptId()
    const refA = testReferentielId()
    await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
    await fixtures.valeurAvancement({
      indicateur: { publicId: indId },
      individu: { publicId: deptId, referentiel: { publicId: refA, nom: 'A' } },
      date: '2026-01-01',
      valeur: 75,
    })
    await fixtures.objectifIndicateurIndividu({
      indicateur: { publicId: indId },
      individu: { publicId: deptId },
      dateCible: '2026-12-01',
      valeurCible: 100,
    })
    const apiKey = await fixtures.apiKey()

    const result = await runAsPrincipal(apiKey.id, () =>
      listDernieresValeursForIndividu(deptId, { indicateurs: [indId] }),
    )

    expect(result._unsafeUnwrap()).toEqual({
      items: [{ indicateur: indId, valeur: 75, date: '2026-01-01', type: 'saisie', tauxProgression: 75 }],
    })
  }),
)
```

#### 2. Taux basé sur la dernière valeur de la série

```ts
it(
  'calcule le taux sur la dernière valeur de la série, pas la première',
  integrationTest(async () => {
    const indId = testIndicateurId()
    const deptId = testDeptId()
    const refA = testReferentielId()
    await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
    await fixtures.valeurAvancement(
      { indicateur: { publicId: indId }, individu: { publicId: deptId, referentiel: { publicId: refA, nom: 'A' } }, date: '2026-01-01', valeur: 10 },
      { indicateur: { publicId: indId }, individu: { publicId: deptId }, date: '2026-03-01', valeur: 90 },
    )
    await fixtures.objectifIndicateurIndividu({
      indicateur: { publicId: indId },
      individu: { publicId: deptId },
      dateCible: '2026-12-01',
      valeurCible: 100,
    })
    const apiKey = await fixtures.apiKey()

    const result = await runAsPrincipal(apiKey.id, () =>
      listDernieresValeursForIndividu(deptId, { indicateurs: [indId] }),
    )

    expect(result._unsafeUnwrap()).toEqual({
      items: [{ indicateur: indId, valeur: 90, date: '2026-03-01', type: 'saisie', tauxProgression: 90 }],
    })
  }),
)
```

#### 3. Taux plafonné à 100 quand la valeur dépasse la cible

```ts
it(
  'plafonne tauxProgression à 100 quand la valeur dépasse la cible',
  integrationTest(async () => {
    const indId = testIndicateurId()
    const deptId = testDeptId()
    const refA = testReferentielId()
    await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
    await fixtures.valeurAvancement({
      indicateur: { publicId: indId },
      individu: { publicId: deptId, referentiel: { publicId: refA, nom: 'A' } },
      date: '2026-01-01',
      valeur: 150,
    })
    await fixtures.objectifIndicateurIndividu({
      indicateur: { publicId: indId },
      individu: { publicId: deptId },
      dateCible: '2026-12-01',
      valeurCible: 100,
    })
    const apiKey = await fixtures.apiKey()

    const result = await runAsPrincipal(apiKey.id, () =>
      listDernieresValeursForIndividu(deptId, { indicateurs: [indId] }),
    )

    expect(result._unsafeUnwrap()).toEqual({
      items: [{ indicateur: indId, valeur: 150, date: '2026-01-01', type: 'saisie', tauxProgression: 100 }],
    })
  }),
)
```

#### 4. `tauxProgression: null` quand `valeurCible` vaut zéro

```ts
it(
  'retourne tauxProgression null quand valeurCible vaut zéro',
  integrationTest(async () => {
    const indId = testIndicateurId()
    const deptId = testDeptId()
    const refA = testReferentielId()
    await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
    await fixtures.valeurAvancement({
      indicateur: { publicId: indId },
      individu: { publicId: deptId, referentiel: { publicId: refA, nom: 'A' } },
      date: '2026-01-01',
      valeur: 42,
    })
    await fixtures.objectifIndicateurIndividu({
      indicateur: { publicId: indId },
      individu: { publicId: deptId },
      dateCible: '2026-12-01',
      valeurCible: 0,
    })
    const apiKey = await fixtures.apiKey()

    const result = await runAsPrincipal(apiKey.id, () =>
      listDernieresValeursForIndividu(deptId, { indicateurs: [indId] }),
    )

    expect(result._unsafeUnwrap()).toEqual({
      items: [{ indicateur: indId, valeur: 42, date: '2026-01-01', type: 'saisie', tauxProgression: null }],
    })
  }),
)
```

---

## Ce qui ne change pas

- Le batcher frontend (`@yornaath/batshit`, `dernieresValeurs.ts`) — inchangé, le payload enrichi est transparent.
- La route API (`apps/mb-api/src/valeurAvancement/routes.ts`) — inchangée (le schéma de réponse est inféré depuis `DernierValeurIndividuApiModel`).
- `computeTauxProgressionPoints` et `listTauxProgressionForIndicateur` — inchangés.
- `IndicateurCard` — inchangée (la barre est encapsulée dans `IndicateurAvancement`).
