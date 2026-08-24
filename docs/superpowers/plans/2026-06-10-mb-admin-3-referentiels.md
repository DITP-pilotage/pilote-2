# mb-admin — Plan 3 : Référentiels (listing + formulaire PUT)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Prérequis :** Plan 1 (Foundation) et Plan 2 (Indicateurs) implémentés — on réutilise `bffClient`, `PageHeading`, `IndicateurForm`-patterns, `extractApiError`, le garde-fou Prod (optionnel) et `referentielsInfiniteQueryOptions` (Plan 2 Task 2).

**Goal:** Gérer les référentiels depuis l'admin : un tableau des référentiels existants (via `GET /api/referentiels`) avec recherche et pagination, et un formulaire de création/modification qui exécute `PUT /api/referentiels/{id}` (nom, description, individus). Les individus sont créés/mis à jour par transitivité ; gestion explicite du conflit 409 (individu déjà rattaché à un autre référentiel).

**Architecture:** Front uniquement. Données via TanStack Query → `bffClient`. Schémas/types depuis `@pilote/mb-shared/referentiel` et `@pilote/mb-shared/individu`.

**Tech Stack:** React 19, TanStack Router + Query, ky (`bffClient`), Zod, `@pilote/mb-shared`, Lucide.

**Convention:** verbes/technique en anglais, entités en français. Pas de `export default`. Pas de tests front.

---

## Référence : contrats mb-api (existants)

- `GET /referentiels?recherche&cursor&pageSize` → `ReferentielListApiModel` = `{ items: ReferentielApiModel[], pagination, total }`.
- `GET /referentiels/{id}` → `ReferentielApiModel` = `{ id, nom, description: string|null, nombreIndividus, widgets, createdAt, updatedAt }` (⚠ **ne contient pas** la liste des individus).
- `GET /referentiels/{id}/individus?recherche&cursor&pageSize` → `IndividuListApiModel` = `{ items: IndividuApiModel[], pagination, total }` ; `IndividuApiModel` = `{ id, nom, referentiel, parents, metadata, … }`.
- `PUT /referentiels/{id}` body `UpsertReferentielBody` = `{ nom: string, description: string|null, individus?: { publicId: string, nom: string }[] }`. **409** si un individu listé est déjà rattaché à un autre référentiel → `details.individuIds: string[]`.
- `id` au format `REF-[A-Z0-9-]{1,16}` (max 20 car.) ; `individu.publicId` au format `[A-Z][A-Z0-9-]{0,19}`.
- Imports : `@pilote/mb-shared/referentiel`, `@pilote/mb-shared/individu`.

---

## Task 1 : Couche API référentiels (détail + individus + upsert)

**Files:** Modify `apps/mb-admin/src/api/referentiels.ts` (créé en Plan 2 Task 1 ; on l'étend).

- [ ] **Step 1 : Étendre `src/api/referentiels.ts`**

Ajouter aux exports existants :

```typescript
import type {
  ReferentielApiModel,
  UpsertReferentielBody,
} from '@pilote/mb-shared/referentiel'
import { referentielApiModelSchema } from '@pilote/mb-shared/referentiel'
import type { IndividuListApiModel } from '@pilote/mb-shared/individu'
import { individuListApiModelSchema } from '@pilote/mb-shared/individu'

// ... (fetchReferentiels déjà présent depuis le Plan 2)

export const fetchReferentielById = async (id: string): Promise<ReferentielApiModel> => {
  const json = await bffClient.get(`referentiels/${id}`).json()
  return referentielApiModelSchema.parse(json)
}

export const fetchIndividusForReferentiel = async (
  id: string,
  params: { cursor?: string } = {},
): Promise<IndividuListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get(`referentiels/${id}/individus`, { searchParams }).json()
  return individuListApiModelSchema.parse(json)
}

export const upsertReferentiel = async (
  id: string,
  body: UpsertReferentielBody,
): Promise<ReferentielApiModel> => {
  const json = await bffClient.put(`referentiels/${id}`, { json: body }).json()
  return referentielApiModelSchema.parse(json)
}
```

> Si `UpsertReferentielBody` n'est pas exporté comme type nommé : `import { upsertReferentielBodySchema } from '@pilote/mb-shared/referentiel'; type UpsertReferentielBody = z.infer<typeof upsertReferentielBodySchema>`.

- [ ] **Step 2 : Helper pour charger tous les individus (pagination)**

Create `apps/mb-admin/src/lib/fetchAllPages.ts` :

```typescript
type Page<T> = { items: T[]; pagination: { cursor: string | null; hasMore: boolean } }

export const fetchAllPages = async <T>(
  fetchPage: (cursor?: string) => Promise<Page<T>>,
): Promise<T[]> => {
  const all: T[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await fetchPage(cursor)
    all.push(...page.items)
    if (!page.pagination.hasMore || !page.pagination.cursor) break
    cursor = page.pagination.cursor
  }
  return all
}
```

- [ ] **Step 3 : Vérif type + commit**

```bash
pnpm -F @pilote/mb-admin exec tsc --noEmit
git add apps/mb-admin/src/api/referentiels.ts apps/mb-admin/src/lib/fetchAllPages.ts
git commit -m "feat(mb-admin): API référentiel (détail, individus, upsert) + fetchAllPages"
```

---

## Task 2 : Queries référentiels (détail + individus)

**Files:** Modify `apps/mb-admin/src/queries/referentiels.ts` (créé en Plan 2).

- [ ] **Step 1 : Ajouter les query options**

```typescript
import { queryOptions } from '@tanstack/react-query'

import { fetchIndividusForReferentiel, fetchReferentielById } from '@/api/referentiels'
import { fetchAllPages } from '@/lib/fetchAllPages'

// ... referentielsInfiniteQueryOptions déjà présent (Plan 2)

export const referentielQueryOptions = (id: string) =>
  queryOptions({ queryKey: ['referentiel', id], queryFn: () => fetchReferentielById(id) })

export const referentielIndividusQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['referentiel', id, 'individus'],
    queryFn: () => fetchAllPages((cursor) => fetchIndividusForReferentiel(id, cursor ? { cursor } : {})),
  })
```

- [ ] **Step 2 : Commit**

```bash
git add apps/mb-admin/src/queries/referentiels.ts
git commit -m "feat(mb-admin): queries référentiel détail + individus"
```

---

## Task 3 : Écran listing des référentiels

**Files:** Create `apps/mb-admin/src/routes/_authed/referentiels/index.tsx` (remplace le stub du Plan 1).

- [ ] **Step 1 : Écran listing**

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'

import { PageHeading } from '@/components/PageHeading'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table } from '@/components/ui/Table'
import { referentielsInfiniteQueryOptions } from '@/queries/referentiels'
import { Route as RootRoute } from '@/routes/__root'

export const Route = createFileRoute('/_authed/referentiels/')({ component: ReferentielsListComponent })

function ReferentielsListComponent() {
  const navigate = useNavigate()
  const { session } = RootRoute.useRouteContext()
  const isProd = session.current?.environment === 'prod'
  const [recherche, setRecherche] = useState('')
  const query = useInfiniteQuery(referentielsInfiniteQueryOptions(recherche))
  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  return (
    <div>
      <PageHeading
        title="Référentiels"
        subtitle={
          <>
            {total} référentiel{total > 1 ? 's' : ''} · environnement{' '}
            <b className={isProd ? 'text-accent' : undefined}>{session.current?.environment}</b>
          </>
        }
        action={
          <Button asChild>
            <Link to="/referentiels/nouveau">
              <Plus className="size-4" /> Créer un référentiel
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
        <Search className="size-4 text-text-subtle" />
        <input
          value={recherche}
          onChange={(event) => setRecherche(event.target.value)}
          placeholder="Rechercher un référentiel…"
          className="w-full bg-transparent focus:outline-none"
        />
      </div>

      {items.length === 0 && !query.isLoading ? (
        <EmptyState title="Aucun référentiel" description="Créez votre premier référentiel." />
      ) : (
        <Table.Root>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>Nom</Table.HeaderCell>
              <Table.HeaderCell>Description</Table.HeaderCell>
              <Table.HeaderCell align="center">Individus</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {items.map((referentiel) => (
              <Table.Row
                key={referentiel.id}
                className="cursor-pointer"
                onClick={() => navigate({ to: '/referentiels/$id', params: { id: referentiel.id } })}
              >
                <Table.Cell><span className="font-mono text-primary">{referentiel.id}</span></Table.Cell>
                <Table.Cell><span className="font-semibold">{referentiel.nom}</span></Table.Cell>
                <Table.Cell><span className="text-text-muted">{referentiel.description ?? '—'}</span></Table.Cell>
                <Table.Cell align="center">{referentiel.nombreIndividus}</Table.Cell>
                <Table.Cell align="right"><span className="text-primary">→</span></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}

      {query.hasNextPage ? (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" type="button" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
            {query.isFetchingNextPage ? 'Chargement…' : 'Charger plus'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 2 : Lint + commit**

```bash
pnpm -F @pilote/mb-admin routes:generate
pnpm -F @pilote/mb-admin lint
git add apps/mb-admin/src
git commit -m "feat(mb-admin): listing des référentiels (recherche + charger plus)"
```

---

## Task 4 : Formulaire référentiel (création & modification)

**Files:**
- Create: `apps/mb-admin/src/components/ReferentielForm.tsx`
- Create: `apps/mb-admin/src/routes/_authed/referentiels/nouveau.tsx`
- Create: `apps/mb-admin/src/routes/_authed/referentiels/$id.tsx`

- [ ] **Step 1 : `src/components/ReferentielForm.tsx`**

```tsx
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'

type IndividuItem = { publicId: string; nom: string }

export type ReferentielFormValues = {
  id: string
  nom: string
  description: string
  individus: IndividuItem[]
}

export function ReferentielForm({
  mode,
  initial,
  pending,
  errorMessage,
  isProd,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initial: ReferentielFormValues
  pending: boolean
  errorMessage: string | null
  isProd: boolean
  onSubmit: (values: ReferentielFormValues) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<ReferentielFormValues>(initial)

  const update = (patch: Partial<ReferentielFormValues>) => setValues((prev) => ({ ...prev, ...patch }))
  const updateIndividu = (index: number, patch: Partial<IndividuItem>) =>
    setValues((prev) => ({
      ...prev,
      individus: prev.individus.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }))
  const addIndividu = () => update({ individus: [...values.individus, { publicId: '', nom: '' }] })
  const removeIndividu = (index: number) =>
    update({ individus: values.individus.filter((_, i) => i !== index) })

  const canSubmit =
    values.nom.trim().length > 0 &&
    (mode === 'edit' || /^REF-[A-Z0-9-]{1,16}$/.test(values.id)) &&
    values.individus.every(
      (item) => /^[A-Z][A-Z0-9-]{0,19}$/.test(item.publicId) && item.nom.trim().length > 0,
    )

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-surface p-6">
        {/* Identifiant */}
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold">Identifiant</label>
          {mode === 'edit' ? (
            <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-surface-tinted px-3 py-2 font-mono text-sm text-primary">
              {values.id} <span className="font-sans text-xs text-text-subtle">🔒 non modifiable</span>
            </span>
          ) : (
            <input
              value={values.id}
              onChange={(event) => update({ id: event.target.value.toUpperCase() })}
              placeholder="REF-DEPT"
              className="w-56 rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
            />
          )}
        </div>

        {/* Nom */}
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold">Nom <span className="text-accent">*</span></label>
          <input
            value={values.nom}
            onChange={(event) => update({ nom: event.target.value })}
            className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-semibold">Description</label>
          <textarea
            value={values.description}
            onChange={(event) => update({ description: event.target.value })}
            rows={2}
            className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        {/* Individus */}
        <div className="border-t border-border pt-5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-bold">Individus</span>
            <button type="button" onClick={addIndividu} className="flex items-center gap-1 text-sm font-semibold text-primary">
              <Plus className="size-4" /> Ajouter
            </button>
          </div>
          <p className="mb-4 text-xs text-text-subtle">
            Un individu ne peut appartenir qu'à un seul référentiel. En ajouter un déjà rattaché ailleurs sera refusé (409).
          </p>
          {values.individus.map((item, index) => (
            <div key={index} className="mb-2.5 flex items-center gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2.5">
              <input
                value={item.publicId}
                onChange={(event) => updateIndividu(index, { publicId: event.target.value.toUpperCase() })}
                placeholder="DEPT-75"
                className="flex-1 rounded-md border border-border bg-surface px-2.5 py-2 font-mono text-sm focus:border-primary focus:outline-none"
              />
              <input
                value={item.nom}
                onChange={(event) => updateIndividu(index, { nom: event.target.value })}
                placeholder="Paris"
                className="flex-[2] rounded-md border border-border bg-surface px-2.5 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <button type="button" onClick={() => removeIndividu(index)} className="text-accent">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {errorMessage ? <p className="mt-3 text-right text-sm font-medium text-accent">{errorMessage}</p> : null}

      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" type="button" onClick={onCancel}>Annuler</Button>
        <Button
          type="button"
          disabled={!canSubmit || pending}
          onClick={() => onSubmit(values)}
          className={isProd ? 'bg-accent hover:bg-accent' : undefined}
        >
          {pending ? 'Enregistrement…' : isProd ? '🚨 Enregistrer en Prod' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Étendre `src/lib/apiError.ts`** pour le conflit 409 individus

Modifier `extractApiError` (créé Plan 2 Task 4 Step 4) pour gérer `details.individuIds` :

```typescript
// dans extractApiError, après la lecture de body :
const conflictIndividus = (body.details as { individuIds?: string[] } | undefined)?.individuIds
if (conflictIndividus && conflictIndividus.length > 0) {
  return `Individus déjà rattachés à un autre référentiel : ${conflictIndividus.join(', ')}`
}
```

(Placer ce bloc avant le `return body.message`, à côté du bloc `unknownReferentielIds` existant.)

- [ ] **Step 3 : Route création `nouveau.tsx`**

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { upsertReferentiel } from '@/api/referentiels'
import { PageHeading } from '@/components/PageHeading'
import { ReferentielForm, type ReferentielFormValues } from '@/components/ReferentielForm'
import { extractApiError } from '@/lib/apiError'
import { Route as RootRoute } from '@/routes/__root'

export const Route = createFileRoute('/_authed/referentiels/nouveau')({ component: NewReferentielComponent })

function NewReferentielComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = RootRoute.useRouteContext()
  const isProd = session.current?.environment === 'prod'
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (values: ReferentielFormValues) =>
      upsertReferentiel(values.id, {
        nom: values.nom,
        description: values.description.trim() === '' ? null : values.description,
        individus: values.individus,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['referentiels'] })
      void navigate({ to: '/referentiels' })
    },
    onError: async (err) => setError(await extractApiError(err)),
  })

  return (
    <div>
      <PageHeading title="Nouveau référentiel" />
      <ReferentielForm
        mode="create"
        initial={{ id: '', nom: '', description: '', individus: [] }}
        pending={mutation.isPending}
        errorMessage={error}
        isProd={isProd}
        onCancel={() => navigate({ to: '/referentiels' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
```

- [ ] **Step 4 : Route modification `$id.tsx`** (charge détail + individus pour pré-remplir)

```tsx
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { upsertReferentiel } from '@/api/referentiels'
import { PageHeading } from '@/components/PageHeading'
import { ReferentielForm, type ReferentielFormValues } from '@/components/ReferentielForm'
import { extractApiError } from '@/lib/apiError'
import { referentielIndividusQueryOptions, referentielQueryOptions } from '@/queries/referentiels'
import { Route as RootRoute } from '@/routes/__root'

export const Route = createFileRoute('/_authed/referentiels/$id')({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(referentielQueryOptions(params.id)),
      context.queryClient.ensureQueryData(referentielIndividusQueryOptions(params.id)),
    ])
  },
  component: EditReferentielComponent,
})

function EditReferentielComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = RootRoute.useRouteContext()
  const isProd = session.current?.environment === 'prod'
  const { data: referentiel } = useSuspenseQuery(referentielQueryOptions(id))
  const { data: individus } = useSuspenseQuery(referentielIndividusQueryOptions(id))
  const [error, setError] = useState<string | null>(null)

  const initial: ReferentielFormValues = {
    id: referentiel.id,
    nom: referentiel.nom,
    description: referentiel.description ?? '',
    individus: individus.map((individu) => ({ publicId: individu.id, nom: individu.nom })),
  }

  const mutation = useMutation({
    mutationFn: (values: ReferentielFormValues) =>
      upsertReferentiel(id, {
        nom: values.nom,
        description: values.description.trim() === '' ? null : values.description,
        individus: values.individus,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['referentiels'] })
      await queryClient.invalidateQueries({ queryKey: ['referentiel', id] })
      void navigate({ to: '/referentiels' })
    },
    onError: async (err) => setError(await extractApiError(err)),
  })

  return (
    <div>
      <PageHeading title="Modifier le référentiel" subtitle={<code>PUT /referentiels/{id}</code>} />
      <ReferentielForm
        mode="edit"
        initial={initial}
        pending={mutation.isPending}
        errorMessage={error}
        isProd={isProd}
        onCancel={() => navigate({ to: '/referentiels' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
```

> Note replace-all des individus : le `PUT` n'effectue pas de suppression des individus retirés du formulaire (le contrat `upsertReferentiel` upsert/rattache, il ne supprime pas). Conserver tel quel pour le périmètre du jour ; documenter que retirer un individu du formulaire ne le supprime pas côté API. Si une sémantique replace-all des individus est souhaitée plus tard, ce sera un ajout backend (hors périmètre).

- [ ] **Step 5 : Garde-fou Prod (si Task 5 du Plan 2 implémentée)**

Réutiliser `ConfirmProdDialog` : brancher dans `ReferentielForm` comme dans `IndicateurForm` (modale au clic « Enregistrer en Prod », `identifiant={values.id}`, `resume={\`Nom, description + ${values.individus.length} individu(s)\`}`).

- [ ] **Step 6 : Lint + commit**

```bash
pnpm -F @pilote/mb-admin routes:generate
pnpm -F @pilote/mb-admin lint
git add apps/mb-admin/src
git commit -m "feat(mb-admin): formulaire référentiel (création + modification PUT, conflit 409)"
```

---

## Task 5 : Vérification manuelle

- [ ] **Step 1 :** Login en Local → `/referentiels` liste les référentiels ; recherche + « Charger plus » OK.
- [ ] **Step 2 :** « Créer un référentiel » → `REF-TEST`, nom, description, 2 individus → Enregistrer → retour liste.
- [ ] **Step 3 :** Clic sur une ligne → formulaire pré-rempli avec les individus existants (id figé).
- [ ] **Step 4 :** Ajouter un individu dont le `publicId` existe déjà dans un autre référentiel → message « Individus déjà rattachés à un autre référentiel : … » (409 remonté).
- [ ] **Step 5 :** (si garde-fou) En Prod, modale de confirmation avant écriture.

---

## Self-review (auteur)

- **Couverture spec §4.5 (formulaire référentiel)** : Tasks 3–4. **Individus par transitivité** : Task 4 Step 1 + `$id` charge `GET /referentiels/{id}/individus`. **Conflit 409** : Task 4 Step 2 (extractApiError). **Garde-fou Prod (optionnel)** : Task 4 Step 5 (réutilise `ConfirmProdDialog`).
- **Dépendances** : `bffClient`, `PageHeading`, `Table`, `Button`, `EmptyState` (Plans 1–2) ; `extractApiError`, `ConfirmProdDialog` (Plan 2) ; `referentielsInfiniteQueryOptions` (Plan 2 Task 2). La route `/referentiels` remplace le stub du Plan 1.
- **Cohérence des noms** : `upsertReferentiel`, `fetchReferentielById`, `fetchIndividusForReferentiel`, `referentielQueryOptions`, `referentielIndividusQueryOptions`, `ReferentielForm`/`ReferentielFormValues`.
- **Limite documentée** : retirer un individu du formulaire ne le supprime pas côté API (l'upsert ne fait pas de delete) — noté Task 4 Step 4.
