# mb-admin — Plan 2 : Indicateurs (listing + formulaire PUT)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Prérequis :** Plan 1 (Foundation) implémenté — app `mb-admin`, BFF proxy `/api/*`, session, routing, `BarCard`, header Marianne, `FadeIn`.

**Goal:** Gérer les indicateurs depuis l'admin : un tableau des indicateurs existants (via `GET /api/indicateurs`) avec recherche et pagination, et un formulaire de création/modification qui exécute `PUT /api/indicateurs/{id}` (nom, visibilité, unité, référentiels liés en replace-all). Garde-fou Prod optionnel avant écriture.

**Architecture:** Front uniquement (pas de changement mb-api ; tous les `GET`/`PUT` existent). Données via TanStack Query → `bffClient` (proxy BFF). Schémas et types réutilisés depuis `@pilote/mb-shared`.

**Tech Stack:** React 19, TanStack Router + Query, ky (`bffClient`), Zod, `@pilote/mb-shared`, Lucide.

**Convention:** verbes/technique en anglais, entités en français. Pas de `export default`. Pas de tests front.

---

## Référence : contrats mb-api (existants)

- `GET /indicateurs?recherche&cursor&pageSize&ids` → `IndicateurListApiModel` = `{ items: IndicateurApiModel[], pagination: { cursor: string|null, hasMore: boolean }, total: number }`.
- `GET /indicateurs/{id}` → `IndicateurApiModel` = `{ id, nom, visibilite: 'PUBLIC'|'PRIVE', unite: { code, libelle, abbreviation }|null, referentiels: { referentielPublicId, fonctionAgregation: 'SUM'|'AVG'|'NONE' }[], createdAt, updatedAt }`.
- `PUT /indicateurs/{id}` body `UpsertIndicateurBody` = `{ nom: string, visibilite: 'PUBLIC'|'PRIVE', unite: 'POURCENTAGE'|'ANNEES'|null, referentiels: { referentielPublicId, fonctionAgregation }[] }` (replace-all). `400 VALIDATION_ERROR` avec `details.unknownReferentielIds` si un référentiel n'existe pas.
- `GET /referentiels?recherche&cursor&pageSize` → `ReferentielListApiModel` (pour alimenter le select des référentiels liés).
- `id` au format `IND-\d+` ; `referentielPublicId` au format `REF-[A-Z0-9-]{1,16}`.
- Imports : `@pilote/mb-shared/indicateur`, `@pilote/mb-shared/referentiel`.

---

## Task 1 : Couche API indicateurs (front → BFF)

**Files:**
- Create: `apps/mb-admin/src/api/indicateurs.ts`
- Create: `apps/mb-admin/src/api/referentiels.ts`

- [ ] **Step 1 : `src/api/indicateurs.ts`**

```typescript
import type {
  IndicateurApiModel,
  IndicateurListApiModel,
  UpsertIndicateurBody,
} from '@pilote/mb-shared/indicateur'
import {
  indicateurApiModelSchema,
  indicateurListApiModelSchema,
} from '@pilote/mb-shared/indicateur'

import { bffClient } from '@/api/client'

export type ListIndicateursParams = { recherche?: string; cursor?: string }

export const fetchIndicateurs = async (
  params: ListIndicateursParams,
): Promise<IndicateurListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.recherche) searchParams.recherche = params.recherche
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('indicateurs', { searchParams }).json()
  return indicateurListApiModelSchema.parse(json)
}

export const fetchIndicateurById = async (id: string): Promise<IndicateurApiModel> => {
  const json = await bffClient.get(`indicateurs/${id}`).json()
  return indicateurApiModelSchema.parse(json)
}

export const upsertIndicateur = async (
  id: string,
  body: UpsertIndicateurBody,
): Promise<IndicateurApiModel> => {
  const json = await bffClient.put(`indicateurs/${id}`, { json: body }).json()
  return indicateurApiModelSchema.parse(json)
}
```

> Vérifier le nom exact du type d'entrée du body exporté par mb-shared (`UpsertIndicateurBody`). S'il n'existe pas comme type nommé, le dériver : `import { upsertIndicateurBodySchema } from '@pilote/mb-shared/indicateur'; type UpsertIndicateurBody = z.infer<typeof upsertIndicateurBodySchema>`.

- [ ] **Step 2 : `src/api/referentiels.ts`** (liste pour le select)

```typescript
import type { ReferentielListApiModel } from '@pilote/mb-shared/referentiel'
import { referentielListApiModelSchema } from '@pilote/mb-shared/referentiel'

import { bffClient } from '@/api/client'

export const fetchReferentiels = async (
  params: { recherche?: string; cursor?: string } = {},
): Promise<ReferentielListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.recherche) searchParams.recherche = params.recherche
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('referentiels', { searchParams }).json()
  return referentielListApiModelSchema.parse(json)
}
```

- [ ] **Step 3 : Vérif type + commit**

```bash
pnpm -F @pilote/mb-admin exec tsc --noEmit
git add apps/mb-admin/src/api
git commit -m "feat(mb-admin): couche API indicateurs + référentiels (liste)"
```

---

## Task 2 : Queries TanStack (indicateurs + référentiels)

**Files:**
- Create: `apps/mb-admin/src/queries/indicateurs.ts`
- Create: `apps/mb-admin/src/queries/referentiels.ts`

- [ ] **Step 1 : `src/queries/indicateurs.ts`**

```typescript
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { fetchIndicateurById, fetchIndicateurs } from '@/api/indicateurs'

export const indicateursInfiniteQueryOptions = (recherche: string) =>
  infiniteQueryOptions({
    queryKey: ['indicateurs', { recherche }],
    queryFn: ({ pageParam }) =>
      fetchIndicateurs({ recherche: recherche || undefined, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })

export const indicateurQueryOptions = (id: string) =>
  queryOptions({ queryKey: ['indicateur', id], queryFn: () => fetchIndicateurById(id) })
```

- [ ] **Step 2 : `src/queries/referentiels.ts`**

```typescript
import { infiniteQueryOptions } from '@tanstack/react-query'

import { fetchReferentiels } from '@/api/referentiels'

export const referentielsInfiniteQueryOptions = (recherche: string) =>
  infiniteQueryOptions({
    queryKey: ['referentiels', { recherche }],
    queryFn: ({ pageParam }) =>
      fetchReferentiels({ recherche: recherche || undefined, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })
```

- [ ] **Step 3 : Commit**

```bash
git add apps/mb-admin/src/queries
git commit -m "feat(mb-admin): queries indicateurs + référentiels (infinite)"
```

---

## Task 3 : Écran listing des indicateurs

**Files:**
- Create: `apps/mb-admin/src/routes/_authed/indicateurs/index.tsx` (remplace le stub du Plan 1)
- Create: `apps/mb-admin/src/components/PageHeading.tsx` (titre + sous-titre + action, réutilisable)
- Référence maquette : `header-marianne` / `listing-indicateurs`.

- [ ] **Step 1 : `src/components/PageHeading.tsx`**

```tsx
import type { ReactNode } from 'react'

export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}
```

- [ ] **Step 2 : Écran listing**

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'

import { PageHeading } from '@/components/PageHeading'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table } from '@/components/ui/Table'
import { indicateursInfiniteQueryOptions } from '@/queries/indicateurs'
import { Route as RootRoute } from '@/routes/__root'

export const Route = createFileRoute('/_authed/indicateurs/')({ component: IndicateursListComponent })

const VISIBILITE_BADGE: Record<string, string> = {
  PUBLIC: 'bg-[#e8f5ec] text-[#18753c]',
  PRIVE: 'bg-[#f0eefb] text-[#5246a8]',
}

function IndicateursListComponent() {
  const navigate = useNavigate()
  const { session } = RootRoute.useRouteContext()
  const isProd = session.current?.environment === 'prod'
  const [recherche, setRecherche] = useState('')
  const query = useInfiniteQuery(indicateursInfiniteQueryOptions(recherche))
  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  return (
    <div>
      <PageHeading
        title="Indicateurs"
        subtitle={
          <>
            {total} indicateur{total > 1 ? 's' : ''} · environnement{' '}
            <b className={isProd ? 'text-accent' : undefined}>{session.current?.environment}</b>
          </>
        }
        action={
          <Button asChild>
            <Link to="/indicateurs/nouveau">
              <Plus className="size-4" /> Créer un indicateur
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
        <Search className="size-4 text-text-subtle" />
        <input
          value={recherche}
          onChange={(event) => setRecherche(event.target.value)}
          placeholder="Rechercher un indicateur…"
          className="w-full bg-transparent focus:outline-none"
        />
      </div>

      {items.length === 0 && !query.isLoading ? (
        <EmptyState title="Aucun indicateur" description="Créez votre premier indicateur." />
      ) : (
        <Table.Root>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>Nom</Table.HeaderCell>
              <Table.HeaderCell>Visibilité</Table.HeaderCell>
              <Table.HeaderCell>Unité</Table.HeaderCell>
              <Table.HeaderCell align="center">Référentiels</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {items.map((indicateur) => (
              <Table.Row
                key={indicateur.id}
                className="cursor-pointer"
                onClick={() => navigate({ to: '/indicateurs/$id', params: { id: indicateur.id } })}
              >
                <Table.Cell><span className="font-mono text-primary">{indicateur.id}</span></Table.Cell>
                <Table.Cell><span className="font-semibold">{indicateur.nom}</span></Table.Cell>
                <Table.Cell>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${VISIBILITE_BADGE[indicateur.visibilite]}`}>
                    {indicateur.visibilite}
                  </span>
                </Table.Cell>
                <Table.Cell>{indicateur.unite?.libelle ?? '—'}</Table.Cell>
                <Table.Cell align="center">{indicateur.referentiels.length}</Table.Cell>
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

> La maquette montrait « Précédent/Suivant » ; l'API étant cursor-based (pas d'offset arrière simple), on implémente un « Charger plus » append. Adapter le composant `Table` à l'API réelle copiée du Plan 1 (props `align`, `onClick` sur `Row`) ; si `Table.Row` n'accepte pas `onClick`, envelopper la cellule dans un `Link` à la place.

- [ ] **Step 3 : Lint + commit**

```bash
pnpm -F @pilote/mb-admin routes:generate
pnpm -F @pilote/mb-admin lint
git add apps/mb-admin/src
git commit -m "feat(mb-admin): listing des indicateurs (recherche + charger plus)"
```

---

## Task 4 : Formulaire indicateur (création & modification)

**Files:**
- Create: `apps/mb-admin/src/components/IndicateurForm.tsx` (formulaire partagé)
- Create: `apps/mb-admin/src/routes/_authed/indicateurs/nouveau.tsx`
- Create: `apps/mb-admin/src/routes/_authed/indicateurs/$id.tsx`
- Référence maquette : `form-indicateur`.

- [ ] **Step 1 : `src/components/IndicateurForm.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query'
import { Trash2, Plus } from 'lucide-react'
import { useState } from 'react'

import type { IndicateurApiModel } from '@pilote/mb-shared/indicateur'

import { fetchReferentiels } from '@/api/referentiels'
import { Button } from '@/components/ui/Button'

type FonctionAgregation = 'SUM' | 'AVG' | 'NONE'
type ReferentielLie = { referentielPublicId: string; fonctionAgregation: FonctionAgregation }

export type IndicateurFormValues = {
  id: string
  nom: string
  visibilite: 'PUBLIC' | 'PRIVE'
  unite: 'POURCENTAGE' | 'ANNEES' | null
  referentiels: ReferentielLie[]
}

const AGREGATION_LABEL: Record<FonctionAgregation, string> = {
  SUM: 'Somme',
  AVG: 'Moyenne',
  NONE: 'Aucune',
}

export function buildInitialValues(indicateur?: IndicateurApiModel): IndicateurFormValues {
  return {
    id: indicateur?.id ?? '',
    nom: indicateur?.nom ?? '',
    visibilite: indicateur?.visibilite ?? 'PUBLIC',
    unite: indicateur?.unite?.code ?? null,
    referentiels: indicateur?.referentiels ?? [],
  }
}

export function IndicateurForm({
  mode,
  initial,
  pending,
  errorMessage,
  onSubmit,
  onCancel,
  isProd,
}: {
  mode: 'create' | 'edit'
  initial: IndicateurFormValues
  pending: boolean
  errorMessage: string | null
  onSubmit: (values: IndicateurFormValues) => void
  onCancel: () => void
  isProd: boolean
}) {
  const [values, setValues] = useState<IndicateurFormValues>(initial)
  const referentielsQuery = useQuery({
    queryKey: ['referentiels', 'all-for-select'],
    queryFn: () => fetchReferentiels({}),
  })
  const referentielsOptions = referentielsQuery.data?.items ?? []

  const update = (patch: Partial<IndicateurFormValues>) => setValues((prev) => ({ ...prev, ...patch }))
  const updateReferentiel = (index: number, patch: Partial<ReferentielLie>) =>
    setValues((prev) => ({
      ...prev,
      referentiels: prev.referentiels.map((ref, i) => (i === index ? { ...ref, ...patch } : ref)),
    }))
  const addReferentiel = () =>
    update({
      referentiels: [
        ...values.referentiels,
        { referentielPublicId: '', fonctionAgregation: 'SUM' },
      ],
    })
  const removeReferentiel = (index: number) =>
    update({ referentiels: values.referentiels.filter((_, i) => i !== index) })

  const canSubmit =
    values.nom.trim().length > 0 &&
    (mode === 'edit' || /^IND-\d+$/.test(values.id)) &&
    values.referentiels.every((ref) => /^REF-[A-Z0-9-]{1,16}$/.test(ref.referentielPublicId))

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
              placeholder="IND-001"
              className="w-48 rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
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

        <div className="mb-6 flex gap-4">
          {/* Visibilité (segmenté) */}
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold">Visibilité</label>
            <div className="flex overflow-hidden rounded-md border border-border text-sm">
              {(['PUBLIC', 'PRIVE'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => update({ visibilite: option })}
                  className={`flex-1 py-2 ${values.visibilite === option ? 'bg-primary font-semibold text-white' : 'text-text-muted'}`}
                >
                  {option === 'PUBLIC' ? 'Public' : 'Privé'}
                </button>
              ))}
            </div>
          </div>
          {/* Unité */}
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold">Unité</label>
            <select
              value={values.unite ?? ''}
              onChange={(event) => update({ unite: event.target.value === '' ? null : (event.target.value as 'POURCENTAGE' | 'ANNEES') })}
              className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Aucune</option>
              <option value="POURCENTAGE">Pourcentage</option>
              <option value="ANNEES">Années</option>
            </select>
          </div>
        </div>

        {/* Référentiels liés (replace-all) */}
        <div className="border-t border-border pt-5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-bold">Référentiels liés</span>
            <button type="button" onClick={addReferentiel} className="flex items-center gap-1 text-sm font-semibold text-primary">
              <Plus className="size-4" /> Ajouter
            </button>
          </div>
          <p className="mb-4 text-xs text-text-subtle">
            ⚠ Cette liste remplace <b>intégralement</b> l'existant (replace-all). Retirer une ligne supprime le lien.
          </p>
          {values.referentiels.map((ref, index) => (
            <div key={index} className="mb-2.5 flex items-center gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2.5">
              <select
                value={ref.referentielPublicId}
                onChange={(event) => updateReferentiel(index, { referentielPublicId: event.target.value })}
                className="flex-[2] rounded-md border border-border bg-surface px-2.5 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="" disabled>Choisir un référentiel…</option>
                {referentielsOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.id} · {option.nom}</option>
                ))}
              </select>
              <select
                value={ref.fonctionAgregation}
                onChange={(event) => updateReferentiel(index, { fonctionAgregation: event.target.value as FonctionAgregation })}
                className="flex-1 rounded-md border border-border bg-surface px-2.5 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {(['SUM', 'AVG', 'NONE'] as const).map((option) => (
                  <option key={option} value={option}>{AGREGATION_LABEL[option]}</option>
                ))}
              </select>
              <button type="button" onClick={() => removeReferentiel(index)} className="text-accent">
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

- [ ] **Step 2 : Route création `nouveau.tsx`**

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { upsertIndicateur } from '@/api/indicateurs'
import { PageHeading } from '@/components/PageHeading'
import {
  buildInitialValues,
  IndicateurForm,
  type IndicateurFormValues,
} from '@/components/IndicateurForm'
import { extractApiError } from '@/lib/apiError'
import { Route as RootRoute } from '@/routes/__root'

export const Route = createFileRoute('/_authed/indicateurs/nouveau')({ component: NewIndicateurComponent })

function NewIndicateurComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = RootRoute.useRouteContext()
  const isProd = session.current?.environment === 'prod'
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (values: IndicateurFormValues) =>
      upsertIndicateur(values.id, {
        nom: values.nom,
        visibilite: values.visibilite,
        unite: values.unite,
        referentiels: values.referentiels,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['indicateurs'] })
      void navigate({ to: '/indicateurs' })
    },
    onError: async (err) => setError(await extractApiError(err)),
  })

  return (
    <div>
      <PageHeading title="Nouvel indicateur" />
      <IndicateurForm
        mode="create"
        initial={buildInitialValues()}
        pending={mutation.isPending}
        errorMessage={error}
        isProd={isProd}
        onCancel={() => navigate({ to: '/indicateurs' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
```

- [ ] **Step 3 : Route modification `$id.tsx`**

```tsx
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { upsertIndicateur } from '@/api/indicateurs'
import { PageHeading } from '@/components/PageHeading'
import {
  buildInitialValues,
  IndicateurForm,
  type IndicateurFormValues,
} from '@/components/IndicateurForm'
import { extractApiError } from '@/lib/apiError'
import { indicateurQueryOptions } from '@/queries/indicateurs'
import { Route as RootRoute } from '@/routes/__root'

export const Route = createFileRoute('/_authed/indicateurs/$id')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(indicateurQueryOptions(params.id)),
  component: EditIndicateurComponent,
})

function EditIndicateurComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = RootRoute.useRouteContext()
  const isProd = session.current?.environment === 'prod'
  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(id))
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (values: IndicateurFormValues) =>
      upsertIndicateur(id, {
        nom: values.nom,
        visibilite: values.visibilite,
        unite: values.unite,
        referentiels: values.referentiels,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['indicateurs'] })
      await queryClient.invalidateQueries({ queryKey: ['indicateur', id] })
      void navigate({ to: '/indicateurs' })
    },
    onError: async (err) => setError(await extractApiError(err)),
  })

  return (
    <div>
      <PageHeading title="Modifier l'indicateur" subtitle={<code>PUT /indicateurs/{id}</code>} />
      <IndicateurForm
        mode="edit"
        initial={buildInitialValues(indicateur)}
        pending={mutation.isPending}
        errorMessage={error}
        isProd={isProd}
        onCancel={() => navigate({ to: '/indicateurs' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
```

- [ ] **Step 4 : Helper `src/lib/apiError.ts`** (lecture du corps d'erreur mb-api)

```typescript
import { HTTPError } from 'ky'
import { z } from 'zod'

const errorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
})

export const extractApiError = async (error: unknown): Promise<string> => {
  if (error instanceof HTTPError) {
    try {
      const body = errorBodySchema.parse(await error.response.json())
      const unknownRefs = (body.details as { unknownReferentielIds?: string[] } | undefined)
        ?.unknownReferentielIds
      if (unknownRefs && unknownRefs.length > 0) {
        return `Référentiels inconnus : ${unknownRefs.join(', ')}`
      }
      return body.message
    } catch {
      return 'Erreur côté serveur.'
    }
  }
  return 'Une erreur est survenue.'
}
```

- [ ] **Step 5 : Lint + commit**

```bash
pnpm -F @pilote/mb-admin routes:generate
pnpm -F @pilote/mb-admin lint
git add apps/mb-admin/src
git commit -m "feat(mb-admin): formulaire indicateur (création + modification PUT)"
```

---

## Task 5 : Garde-fou Prod (optionnel — à confirmer)

> **Statut : optionnel.** La forme exacte du garde-fou Prod n'est pas figée (cf. spec §4.6). Implémenter cette tâche seulement si le besoin est confirmé. Sinon, l'écriture en Prod se fait via le bouton rouge « 🚨 Enregistrer en Prod » sans modale.

**Files:**
- Create: `apps/mb-admin/src/components/ConfirmProdDialog.tsx`
- Modify: `IndicateurForm.tsx` (intercepter le submit en Prod)

- [ ] **Step 1 : `ConfirmProdDialog.tsx`** (modale, re-saisie de l'identifiant)

```tsx
import { useState } from 'react'

import { Button } from '@/components/ui/Button'

export function ConfirmProdDialog({
  identifiant,
  resume,
  pending,
  onConfirm,
  onCancel,
}: {
  identifiant: string
  resume: string
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const [saisie, setSaisie] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-6">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="h-[5px] bg-accent" />
        <div className="p-6">
          <h2 className="text-lg font-extrabold text-accent">Écriture en production</h2>
          <p className="mt-1.5 text-sm text-text-muted">
            Cette action modifie <b>immédiatement</b> les données réelles. Elle est irréversible.
          </p>
          <div className="mt-4 rounded-lg border border-border bg-surface-muted p-3 text-sm">
            <div className="font-mono text-primary">{identifiant}</div>
            <div className="mt-1 text-xs text-text-muted">{resume}</div>
          </div>
          <label className="mt-4 block text-xs font-semibold">
            Pour confirmer, tapez <span className="font-mono text-accent">{identifiant}</span>
          </label>
          <input
            value={saisie}
            onChange={(event) => setSaisie(event.target.value)}
            className="mt-1.5 w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
          />
          <div className="mt-5 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={onCancel}>Annuler</Button>
            <Button
              type="button"
              disabled={saisie !== identifiant || pending}
              onClick={onConfirm}
              className="bg-accent hover:bg-accent disabled:bg-accent/40"
            >
              {pending ? 'Écriture…' : "Confirmer l'écriture"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Brancher dans `IndicateurForm`**

Dans `IndicateurForm`, quand `isProd` : au clic « Enregistrer en Prod », ouvrir la modale (state local `showConfirm`) au lieu d'appeler `onSubmit` directement ; `onConfirm` de la modale appelle `onSubmit(values)`. Passer `identifiant={values.id}` et `resume={\`Nom, visibilité, unité + ${values.referentiels.length} référentiel(s)\`}`.

- [ ] **Step 3 : Lint + commit**

```bash
pnpm -F @pilote/mb-admin lint
git add apps/mb-admin/src
git commit -m "feat(mb-admin): garde-fou de confirmation pour les écritures en Prod"
```

---

## Task 6 : Vérification manuelle

- [ ] **Step 1 :** Login en Local → `/indicateurs` liste les indicateurs ; la recherche filtre ; « Charger plus » pagine.
- [ ] **Step 2 :** « Créer un indicateur » → saisir `IND-999`, nom, visibilité, unité, ajouter 1 référentiel → Enregistrer → retour liste, l'indicateur apparaît.
- [ ] **Step 3 :** Clic sur une ligne → formulaire pré-rempli (id figé) → retirer un référentiel → Enregistrer → la modif est persistée (replace-all).
- [ ] **Step 4 :** Saisir un `referentielPublicId` inexistant → message « Référentiels inconnus : … » (400 remonté).
- [ ] **Step 5 :** (si Task 5) En Prod, le bouton est rouge et la modale exige la re-saisie de l'identifiant avant d'écrire.

---

## Self-review (auteur)

- **Couverture spec §4.5 (formulaire indicateur)** : Tasks 3–4. **Replace-all explicité** : Task 4 Step 1. **Erreurs 400 / unknownReferentielIds** : Task 4 Step 4. **Garde-fou Prod (optionnel)** : Task 5.
- **Dépendances** : `bffClient` (Plan 1 Task 6), `Table`/`Button`/`EmptyState` (Plan 1 Task 7), `BarCard` non requis ici. La route `/indicateurs` remplace le stub du Plan 1.
- **Cohérence des noms** : `upsertIndicateur` (api) / `IndicateurForm` / `IndicateurFormValues` / `indicateurQueryOptions`. `unite` côté GET = objet `{code,…}` → form lit `.code` ; côté PUT = `code|null`. Vérifié dans `buildInitialValues` et les `mutationFn`.
- **Point d'attention impl** : confirmer l'API exacte du composant `Table` copié (props `align`, `onClick` sur `Row`) ; sinon adapter (envelopper dans `Link`).
