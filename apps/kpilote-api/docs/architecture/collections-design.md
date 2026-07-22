# Collections d'indicateurs — design

Date : 2026-05-27
Statut : proposé

## Contexte

Besoin produit : regrouper des indicateurs en collections nommées (« collections »)
pour les exposer côté front, typiquement pour qu'un utilisateur navigue d'une
sélection thématique vers les indicateurs qui la composent.

Périmètre v0 délibérément minimaliste :

- Pas de création/édition côté API. Les collections sont **créés par seed**
  uniquement.
- Lecture exposée via API publique (liste paginée + détail).
- Affichage côté front : entrée « Collections » dans la top bar, page liste,
  page détail réutilisant la grid d'indicateurs existante.

## État de l'existant

- Modèle Prisma `Indicateur` avec `id` (uuid) + `publicId` lisible (`IND-XXX`).
  Même pattern sur `Referentiel` (`REF-XXX`), `Widget`, `Individu`.
- Pattern de N-N déjà utilisé : `IndicateurReferentiel` (join table avec
  `createdAt`, propriétés portées sur la relation).
- Routes : Hono + `@hono/zod-openapi`, un fichier `routes.ts` par module
  contenant les Zod schemas, `createRoute`, handlers.
- Pagination cursor-based homogène sur tout le repo
  (`cursor`, `pageSize`, response `{ items, pagination, total }`).
- Queries en `ResultAsync<T, never>` (neverthrow), accès Prisma direct via
  `db()`, permissions appliquées via helpers `with*ReadPermission`.
- Seeds en TS dans `prisma/seed.ts`, idempotent via `upsert`.
- Côté front : TanStack Router file-based, React Query, fetch via Ky +
  validation Zod, composant `IndicateurCard` + `CardGrid` réutilisables.

## Décisions

### D1. Collections globaux, pas de scope

Un collection n'appartient ni à une organisation, ni à un référentiel, ni à un
principal. Tout principal authentifié peut lister et lire tous les collections.

### D2. Modèle de permissions sur le collection (révisé)

**Statut : implémenté.** Initialement reporté à plus tard, le besoin de collections
privés est arrivé immédiatement après la mise en production v0. Le modèle
reprend point pour point le pattern indicateur :

- Champ `visibilite: Visibilite` (PUBLIC / PRIVE) sur `Collection`.
- Table `CollectionPermission(principalId, collectionId, action)` avec `action ∈
  {READ, WRITE}`, PK composite, index sur `principalId`.
- Helper `withCollectionReadPermission(where, principalId)` appliqué dans
  `listCollections` et `getCollectionByPublicId`.
- **Propagation collection → indicateurs** : un principal qui a READ ou WRITE sur
  un collection obtient automatiquement READ sur tous ses indicateurs (la clause
  `withIndicateurReadPermission` ajoute un branche OR via `collections.some`). Le
  WRITE indicateur reste exclusivement direct.

Détails et invariants généraux : voir `permissions-design.md`.

### D3. Composition N-N via join table, ordre par `createdAt`

Table de jonction `CollectionIndicateur(collectionId, indicateurId, createdAt)`.
L'ordre d'affichage des indicateurs dans un collection = `createdAt ASC` de la
ligne de jonction, c'est-à-dire **l'ordre d'insertion au seed**. Pas de champ
`position` explicite.

Un même indicateur peut appartenir à plusieurs collections.

### D4. `publicId` lisible `COL-XXX`

Format `COL-001`, `COL-002`, etc. Généré côté seed (cohérent avec `IND-XXX`,
`REF-XXX`). Pas de séquence Postgres, pas de trigger.

### D5. Pas de création par API en v0

Pas d'endpoint `POST/PUT/DELETE /collections`. Cycle de vie 100% via
`prisma/seed.ts`. À introduire plus tard quand un cas d'usage explicite
arrive (admin UI, intégration externe).

### D6. Pas de filtrage des indicateurs contenus par les permissions du principal

`GET /collections/:publicId` renvoie l'**intégralité** des `indicateurPublicIds`
de la jonction, sans intersection avec les droits du principal courant.

L'invariant « tous les indicateurs d'un collection sont accessibles au principal »
est désormais garanti **par le modèle de permissions** (D2 révisée) : la
visibilité d'un collection propage READ vers ses indicateurs, donc un principal
qui voit un collection voit nécessairement les indicateurs qui le composent.

Conséquence : pas besoin d'intersection sur les `indicateurPublicIds` — la
contention est portée au niveau du collection lui-même.

### D7. Recomposition côté front via bulk fetch `GET /indicateurs?ids=...`

Le payload collection ne porte que des `publicId` d'indicateurs. Le front résout
la donnée des indicateurs via un appel groupé à `GET /indicateurs?ids=COL-001,IND-XXX,...`.

Conséquence : on **étend `GET /indicateurs`** avec un filtre `ids` optionnel
(liste de `publicId`). Les permissions y restent appliquées normalement —
combiné avec D6, un indicateur non visible n'apparaîtra simplement pas dans
la réponse, et le front doit tolérer que `indicateurs.length <
indicateurPublicIds.length` (cas qui ne se présente pas en v0, mais qui
deviendra la norme à terme).

### D8. Pas de recherche, pas de filtre métier en v0

`GET /collections` n'expose pas de paramètre `recherche` ni de filtre. Volumétrie
attendue très faible (4-5 collections seed). À ajouter quand le besoin émerge.

### D9. Pagination cursor-based standard

Cohérence avec les autres listings : `cursor`, `pageSize` (default 20),
response `{ items, pagination: { cursor, hasMore }, total }`. Même si la
volumétrie est faible, on garde la forme standard pour éviter une forme
divergente.

### D10. Même `ApiModel` pour liste et détail

`CollectionApiModel` (publicId, nom, description, indicateurPublicIds[],
createdAt, updatedAt) est renvoyé tel quel par les deux endpoints. Pas de
shape allégée vs détaillée — le payload est petit, l'unification simplifie
le typage côté front.

## Conséquences

- Nouveau module `src/collection/` dans mb-api (routes + queries + tests).
- Migration Prisma : 2 nouvelles tables (`collection`, `collection_indicateur`),
  relation inverse à ajouter sur `Indicateur`.
- Extension de `GET /indicateurs` avec param `ids` optionnel.
- Nouveaux schémas Zod dans `packages/mb-shared/src/collection.ts`.
- Côté front : nouveau composant `CollectionCard`, 2 nouvelles routes
  (`/collections`, `/collections/$publicId`), entrée dans la top bar.

## Plan d'implémentation

### Backend

#### Modèle Prisma

```prisma
model Collection {
  id          String   @id @db.Uuid
  publicId    String   @unique @map("public_id")
  nom         String
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt      @map("updated_at")

  indicateurs CollectionIndicateur[]

  @@map("collection")
}

model CollectionIndicateur {
  collectionId     String   @map("collection_id")     @db.Uuid
  indicateurId String   @map("indicateur_id") @db.Uuid
  createdAt    DateTime @default(now())       @map("created_at")

  collection     Collection     @relation(fields: [collectionId],     references: [id], onDelete: Cascade)
  indicateur Indicateur @relation(fields: [indicateurId], references: [id], onDelete: Cascade)

  @@id([collectionId, indicateurId])
  @@index([collectionId, createdAt])
  @@map("collection_indicateur")
}
```

Ajout sur `Indicateur` : `collections CollectionIndicateur[]` (relation inverse).

#### Schémas Zod partagés (`packages/mb-shared/src/collection.ts`)

```ts
collectionPublicIdSchema      = z.string().regex(/^COL-\d+$/)

collectionApiModelSchema = z.object({
  publicId: collectionPublicIdSchema,
  nom: z.string(),
  description: z.string().nullable(),
  indicateurPublicIds: z.array(indicateurPublicIdSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

collectionListApiModelSchema  = paginatedSchema(collectionApiModelSchema)
listCollectionsQuerySchema    = z.object({ cursor: ..., pageSize: ... })
```

Côté `indicateur.ts` : étendre `listIndicateursQuerySchema` avec un
`ids?: z.array(indicateurPublicIdSchema).optional()` (CSV en query string,
décodé via `transform`).

#### Queries

`src/collection/queries/listCollections.ts` :

```ts
listCollections({ cursor, pageSize }): ResultAsync<CollectionListApiModel, never>
  - db().collection.findMany({
      orderBy: { createdAt: 'asc' },
      include: { indicateurs: { orderBy: { createdAt: 'asc' },
                                include: { indicateur: { select: { publicId: true } } } } },
      ... pagination cursor
    })
  - db().collection.count()
  - toCollectionApiModel(row) → ApiModel
```

`src/collection/queries/getCollectionByPublicId.ts` :

```ts
getCollectionByPublicId({ publicId }): ResultAsync<CollectionApiModel | null, never>
  - db().collection.findUnique({ where: { publicId }, include: ... })
```

Pas de helper de permission (D2).

#### Extension `GET /indicateurs?ids=...`

`src/indicateur/queries/listIndicateurs.ts` : si `params.ids` fourni, ajouter
`publicId: { in: params.ids }` au `where`. Les permissions
(`withIndicateurReadPermission`) restent appliquées au-dessus → un id non
accessible est silencieusement filtré.

Pagination conservée (un client pourrait passer une longue liste).

#### Routes

`src/collection/routes.ts` (un seul fichier, convention mb-api) :

- `GET /collections` → handler appelle `listCollections(query).match(...)`
- `GET /collections/{publicId}` → `getCollectionByPublicId({ publicId })`, 404 si
  `null`

Enregistrement dans le `app.route(...)` central.

#### Seed

`prisma/seed.ts` : ajout d'un bloc `collectionsSeed` avec 4-5 collections de
démo, chacun référençant 3-6 indicateurs **PUBLIC existants** dans le seed.

```ts
const collectionsSeed = [
  { publicId: 'COL-001', nom: '...', description: '...',
    indicateurPublicIds: ['IND-001', 'IND-005', ...] },
  ...
]

for (const p of collectionsSeed) {
  const collection = await prisma.collection.upsert({
    where: { publicId: p.publicId },
    update: { nom: p.nom, description: p.description },
    create: { id: uuidv7(), publicId: p.publicId, nom: p.nom, description: p.description },
  })
  for (const indPublicId of p.indicateurPublicIds) {
    const ind = await prisma.indicateur.findUniqueOrThrow({ where: { publicId: indPublicId } })
    await prisma.collectionIndicateur.upsert({
      where: { collectionId_indicateurId: { collectionId: collection.id, indicateurId: ind.id } },
      update: {},
      create: { collectionId: collection.id, indicateurId: ind.id },
    })
  }
}
```

L'ordre du tableau `indicateurPublicIds` détermine l'ordre d'affichage (via
`createdAt` croissant des upserts).

#### Fixtures de test

`src/test/fixtures.ts` : ajout d'un `fixtures.collection(...)` variadic, mêmes
conventions que les fixtures existantes (defaults hardcodés, upsert).

```ts
fixtures.collection({ publicId?, nom?, description?, indicateurPublicIds? })
```

#### Tests

Queries :

- `listCollections.test.ts` : liste vide, ordre alphabétique stable, pagination,
  un collection avec 0 indicateurs, contenu de `indicateurPublicIds` dans l'ordre
  d'insertion.
- `getCollectionByPublicId.test.ts` : présent, absent (null), ordre des
  indicateurs respecté.

Routes :

- 200 / 404 / 401 sur les deux endpoints (intégration légère, le gros est sur
  les queries).

Indicateurs :

- `listIndicateurs.test.ts` : nouveau cas « filtre `ids` retourne le
  sous-ensemble dans l'ordre par défaut, permissions appliquées ».

### Frontend

#### API client

`src/api/collections.ts` :

```ts
fetchCollections(params)  → collectionListApiModelSchema.parse(json)
fetchCollection(publicId) → collectionApiModelSchema.parse(json)
```

`src/api/indicateurs.ts` : étendre `fetchIndicateurs` pour accepter
`ids?: string[]` (sérialisé en CSV dans la query string).

`src/queries/collections.ts` :

```ts
collectionsQueryOptions(params)
collectionQueryOptions(publicId)
```

#### Routes

`src/routes/_authenticated/collections/index.tsx` :

- Loader : `queryClient.ensureQueryData(collectionsQueryOptions(...))`
- Composant : `Page` + `Section` + `CardGrid` de `CollectionCard`
- Pagination identique à la page indicateurs

`src/routes/_authenticated/collections/$publicId.tsx` :

- Loader : chaîne `collectionQueryOptions(publicId)` puis (si non-vide)
  `indicateursQueryOptions({ ids: collection.indicateurPublicIds })`
- Composant : header (nom + description) + `CardGrid` de `IndicateurCard`
  (réutilisé tel quel)

#### Composants

`src/components/collections/CollectionCard.tsx` :

```tsx
type CollectionCardProps = {
  collection: Pick<CollectionApiModel, 'publicId' | 'nom' | 'description' | 'updatedAt'>
}
```

Calqué sur `IndicateurCard`. Click → navigue vers `/collections/$publicId`.

#### Navigation

`src/routes/__root.tsx` : ajout d'un `<Link to="/collections">Collections</Link>` à
côté de l'entrée Indicateurs.

## Hors scope (v0)

- Endpoints de création / édition / suppression (POST/PUT/DELETE).
- Permissions sur le collection lui-même (visibilité, principal-based).
- Filtrage des `indicateurPublicIds` selon les permissions du principal.
- Recherche / filtres sur la liste des collections.
- Pagination des indicateurs *à l'intérieur* d'un collection (assumé petite
  collection).
- Tri / réordonnancement explicite (l'ordre = `createdAt` de la jonction).

## Prochaines étapes

1. Validation de ce design.
2. Migration Prisma + schémas Zod partagés.
3. Queries + fixtures + tests + routes collection.
4. Extension `GET /indicateurs?ids=...` + tests.
5. Seed (4-5 collections).
6. Front : api / queries / page liste + `CollectionCard` / page détail / top bar.
