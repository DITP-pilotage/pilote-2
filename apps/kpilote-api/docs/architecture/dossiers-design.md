# Dossiers d'indicateurs — design

Date : 2026-05-27
Statut : proposé

## Contexte

Besoin produit : regrouper des indicateurs en collections nommées (« dossiers »)
pour les exposer côté front, typiquement pour qu'un utilisateur navigue d'une
sélection thématique vers les indicateurs qui la composent.

Périmètre v0 délibérément minimaliste :

- Pas de création/édition côté API. Les dossiers sont **créés par seed**
  uniquement.
- Lecture exposée via API publique (liste paginée + détail).
- Affichage côté front : entrée « Dossiers » dans la top bar, page liste,
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

### D1. Dossiers globaux, pas de scope

Un dossier n'appartient ni à une organisation, ni à un référentiel, ni à un
principal. Tout principal authentifié peut lister et lire tous les dossiers.

### D2. Modèle de permissions sur le dossier (révisé)

**Statut : implémenté.** Initialement reporté à plus tard, le besoin de dossiers
privés est arrivé immédiatement après la mise en production v0. Le modèle
reprend point pour point le pattern indicateur :

- Champ `visibilite: Visibilite` (PUBLIC / PRIVE) sur `Panier`.
- Table `DossierPermission(principalId, panierId, action)` avec `action ∈
  {READ, WRITE}`, PK composite, index sur `principalId`.
- Helper `withDossierReadPermission(where, principalId)` appliqué dans
  `listDossiers` et `getDossierByPublicId`.
- **Propagation panier → indicateurs** : un principal qui a READ ou WRITE sur
  un dossier obtient automatiquement READ sur tous ses indicateurs (la clause
  `withIndicateurReadPermission` ajoute un branche OR via `dossiers.some`). Le
  WRITE indicateur reste exclusivement direct.

Détails et invariants généraux : voir `permissions-design.md`.

### D3. Composition N-N via join table, ordre par `createdAt`

Table de jonction `DossierIndicateur(panierId, indicateurId, createdAt)`.
L'ordre d'affichage des indicateurs dans un dossier = `createdAt ASC` de la
ligne de jonction, c'est-à-dire **l'ordre d'insertion au seed**. Pas de champ
`position` explicite.

Un même indicateur peut appartenir à plusieurs dossiers.

### D4. `publicId` lisible `PAN-XXX`

Format `PAN-001`, `PAN-002`, etc. Généré côté seed (cohérent avec `IND-XXX`,
`REF-XXX`). Pas de séquence Postgres, pas de trigger.

### D5. Pas de création par API en v0

Pas d'endpoint `POST/PUT/DELETE /dossiers`. Cycle de vie 100% via
`prisma/seed.ts`. À introduire plus tard quand un cas d'usage explicite
arrive (admin UI, intégration externe).

### D6. Pas de filtrage des indicateurs contenus par les permissions du principal

`GET /paniers/:publicId` renvoie l'**intégralité** des `indicateurPublicIds`
de la jonction, sans intersection avec les droits du principal courant.

L'invariant « tous les indicateurs d'un panier sont accessibles au principal »
est désormais garanti **par le modèle de permissions** (D2 révisée) : la
visibilité d'un panier propage READ vers ses indicateurs, donc un principal
qui voit un panier voit nécessairement les indicateurs qui le composent.

Conséquence : pas besoin d'intersection sur les `indicateurPublicIds` — la
contention est portée au niveau du panier lui-même.

### D7. Recomposition côté front via bulk fetch `GET /indicateurs?ids=...`

Le payload panier ne porte que des `publicId` d'indicateurs. Le front résout
la donnée des indicateurs via un appel groupé à `GET /indicateurs?ids=PAN-001,IND-XXX,...`.

Conséquence : on **étend `GET /indicateurs`** avec un filtre `ids` optionnel
(liste de `publicId`). Les permissions y restent appliquées normalement —
combiné avec D6, un indicateur non visible n'apparaîtra simplement pas dans
la réponse, et le front doit tolérer que `indicateurs.length <
indicateurPublicIds.length` (cas qui ne se présente pas en v0, mais qui
deviendra la norme à terme).

### D8. Pas de recherche, pas de filtre métier en v0

`GET /paniers` n'expose pas de paramètre `recherche` ni de filtre. Volumétrie
attendue très faible (4-5 paniers seed). À ajouter quand le besoin émerge.

### D9. Pagination cursor-based standard

Cohérence avec les autres listings : `cursor`, `pageSize` (default 20),
response `{ items, pagination: { cursor, hasMore }, total }`. Même si la
volumétrie est faible, on garde la forme standard pour éviter une forme
divergente.

### D10. Même `ApiModel` pour liste et détail

`PanierApiModel` (publicId, nom, description, indicateurPublicIds[],
createdAt, updatedAt) est renvoyé tel quel par les deux endpoints. Pas de
shape allégée vs détaillée — le payload est petit, l'unification simplifie
le typage côté front.

## Conséquences

- Nouveau module `src/panier/` dans mb-api (routes + queries + tests).
- Migration Prisma : 2 nouvelles tables (`panier`, `panier_indicateur`),
  relation inverse à ajouter sur `Indicateur`.
- Extension de `GET /indicateurs` avec param `ids` optionnel.
- Nouveaux schémas Zod dans `packages/mb-shared/src/panier.ts`.
- Côté front : nouveau composant `PanierCard`, 2 nouvelles routes
  (`/paniers`, `/paniers/$publicId`), entrée dans la top bar.

## Plan d'implémentation

### Backend

#### Modèle Prisma

```prisma
model Panier {
  id          String   @id @db.Uuid
  publicId    String   @unique @map("public_id")
  nom         String
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt      @map("updated_at")

  indicateurs PanierIndicateur[]

  @@map("panier")
}

model PanierIndicateur {
  panierId     String   @map("panier_id")     @db.Uuid
  indicateurId String   @map("indicateur_id") @db.Uuid
  createdAt    DateTime @default(now())       @map("created_at")

  panier     Panier     @relation(fields: [panierId],     references: [id], onDelete: Cascade)
  indicateur Indicateur @relation(fields: [indicateurId], references: [id], onDelete: Cascade)

  @@id([panierId, indicateurId])
  @@index([panierId, createdAt])
  @@map("panier_indicateur")
}
```

Ajout sur `Indicateur` : `paniers PanierIndicateur[]` (relation inverse).

#### Schémas Zod partagés (`packages/mb-shared/src/panier.ts`)

```ts
panierPublicIdSchema      = z.string().regex(/^PAN-\d+$/)

panierApiModelSchema = z.object({
  publicId: panierPublicIdSchema,
  nom: z.string(),
  description: z.string().nullable(),
  indicateurPublicIds: z.array(indicateurPublicIdSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

panierListApiModelSchema  = paginatedSchema(panierApiModelSchema)
listPaniersQuerySchema    = z.object({ cursor: ..., pageSize: ... })
```

Côté `indicateur.ts` : étendre `listIndicateursQuerySchema` avec un
`ids?: z.array(indicateurPublicIdSchema).optional()` (CSV en query string,
décodé via `transform`).

#### Queries

`src/panier/queries/listPaniers.ts` :

```ts
listPaniers({ cursor, pageSize }): ResultAsync<PanierListApiModel, never>
  - db().panier.findMany({
      orderBy: { createdAt: 'asc' },
      include: { indicateurs: { orderBy: { createdAt: 'asc' },
                                include: { indicateur: { select: { publicId: true } } } } },
      ... pagination cursor
    })
  - db().panier.count()
  - toPanierApiModel(row) → ApiModel
```

`src/panier/queries/getPanierByPublicId.ts` :

```ts
getPanierByPublicId({ publicId }): ResultAsync<PanierApiModel | null, never>
  - db().panier.findUnique({ where: { publicId }, include: ... })
```

Pas de helper de permission (D2).

#### Extension `GET /indicateurs?ids=...`

`src/indicateur/queries/listIndicateurs.ts` : si `params.ids` fourni, ajouter
`publicId: { in: params.ids }` au `where`. Les permissions
(`withIndicateurReadPermission`) restent appliquées au-dessus → un id non
accessible est silencieusement filtré.

Pagination conservée (un client pourrait passer une longue liste).

#### Routes

`src/panier/routes.ts` (un seul fichier, convention mb-api) :

- `GET /paniers` → handler appelle `listPaniers(query).match(...)`
- `GET /paniers/{publicId}` → `getPanierByPublicId({ publicId })`, 404 si
  `null`

Enregistrement dans le `app.route(...)` central.

#### Seed

`prisma/seed.ts` : ajout d'un bloc `paniersSeed` avec 4-5 paniers de
démo, chacun référençant 3-6 indicateurs **PUBLIC existants** dans le seed.

```ts
const paniersSeed = [
  { publicId: 'PAN-001', nom: '...', description: '...',
    indicateurPublicIds: ['IND-001', 'IND-005', ...] },
  ...
]

for (const p of paniersSeed) {
  const panier = await prisma.panier.upsert({
    where: { publicId: p.publicId },
    update: { nom: p.nom, description: p.description },
    create: { id: uuidv7(), publicId: p.publicId, nom: p.nom, description: p.description },
  })
  for (const indPublicId of p.indicateurPublicIds) {
    const ind = await prisma.indicateur.findUniqueOrThrow({ where: { publicId: indPublicId } })
    await prisma.panierIndicateur.upsert({
      where: { panierId_indicateurId: { panierId: panier.id, indicateurId: ind.id } },
      update: {},
      create: { panierId: panier.id, indicateurId: ind.id },
    })
  }
}
```

L'ordre du tableau `indicateurPublicIds` détermine l'ordre d'affichage (via
`createdAt` croissant des upserts).

#### Fixtures de test

`src/test/fixtures.ts` : ajout d'un `fixtures.panier(...)` variadic, mêmes
conventions que les fixtures existantes (defaults hardcodés, upsert).

```ts
fixtures.panier({ publicId?, nom?, description?, indicateurPublicIds? })
```

#### Tests

Queries :

- `listPaniers.test.ts` : liste vide, ordre alphabétique stable, pagination,
  un panier avec 0 indicateurs, contenu de `indicateurPublicIds` dans l'ordre
  d'insertion.
- `getPanierByPublicId.test.ts` : présent, absent (null), ordre des
  indicateurs respecté.

Routes :

- 200 / 404 / 401 sur les deux endpoints (intégration légère, le gros est sur
  les queries).

Indicateurs :

- `listIndicateurs.test.ts` : nouveau cas « filtre `ids` retourne le
  sous-ensemble dans l'ordre par défaut, permissions appliquées ».

### Frontend

#### API client

`src/api/paniers.ts` :

```ts
fetchPaniers(params)  → panierListApiModelSchema.parse(json)
fetchPanier(publicId) → panierApiModelSchema.parse(json)
```

`src/api/indicateurs.ts` : étendre `fetchIndicateurs` pour accepter
`ids?: string[]` (sérialisé en CSV dans la query string).

`src/queries/paniers.ts` :

```ts
paniersQueryOptions(params)
panierQueryOptions(publicId)
```

#### Routes

`src/routes/_authenticated/paniers/index.tsx` :

- Loader : `queryClient.ensureQueryData(paniersQueryOptions(...))`
- Composant : `Page` + `Section` + `CardGrid` de `PanierCard`
- Pagination identique à la page indicateurs

`src/routes/_authenticated/paniers/$publicId.tsx` :

- Loader : chaîne `panierQueryOptions(publicId)` puis (si non-vide)
  `indicateursQueryOptions({ ids: panier.indicateurPublicIds })`
- Composant : header (nom + description) + `CardGrid` de `IndicateurCard`
  (réutilisé tel quel)

#### Composants

`src/components/paniers/PanierCard.tsx` :

```tsx
type PanierCardProps = {
  panier: Pick<PanierApiModel, 'publicId' | 'nom' | 'description' | 'updatedAt'>
}
```

Calqué sur `IndicateurCard`. Click → navigue vers `/paniers/$publicId`.

#### Navigation

`src/routes/__root.tsx` : ajout d'un `<Link to="/paniers">Paniers</Link>` à
côté de l'entrée Indicateurs.

## Hors scope (v0)

- Endpoints de création / édition / suppression (POST/PUT/DELETE).
- Permissions sur le panier lui-même (visibilité, principal-based).
- Filtrage des `indicateurPublicIds` selon les permissions du principal.
- Recherche / filtres sur la liste des paniers.
- Pagination des indicateurs *à l'intérieur* d'un panier (assumé petite
  collection).
- Tri / réordonnancement explicite (l'ordre = `createdAt` de la jonction).

## Prochaines étapes

1. Validation de ce design.
2. Migration Prisma + schémas Zod partagés.
3. Queries + fixtures + tests + routes panier.
4. Extension `GET /indicateurs?ids=...` + tests.
5. Seed (4-5 paniers).
6. Front : api / queries / page liste + `PanierCard` / page détail / top bar.
