# Page détail indicateur — sélection d'individu, valeurs et métadonnées — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Brancher la page `/_authenticated/indicateurs/$id` sur les endpoints `/indicateurs/:id/individus` et `/indicateurs/:id/valeurs` : un `Select` Radix pour choisir l'individu (avec sélection initiale via search param), deux onglets Radix (`Valeurs` / `Métadonnées`).

**Architecture:** Helper de pagination générique (`fetchAllPaginatedItems`) dans `queries/utils.ts`. Couche `api/` reste unitaire (1 page = 1 appel HTTP). Boucle multi-pages dans le `queryFn`. Deux nouveaux composants UI Radix wrappés (`Select`, `Tabs`) suivant le pattern existant de `Button.tsx` (Radix + cva-style classes via `clsxm`).

**Tech Stack:** React 19, TanStack Router/Query, `@radix-ui/react-select`, `@radix-ui/react-tabs`, Tailwind 4 (tokens sémantiques), `clsx`, `tailwind-merge`.

**Spec:** `docs/superpowers/specs/2026-05-06-detail-indicateur-individus-valeurs-design.md`

**Conventions de commit (préférences user) :**
- **Pas de Co-Authored-By** dans les messages.
- **`pnpm --filter @pilote/mb-webapp lint` doit passer avant chaque commit.**
- Utiliser le skill `commit-billable` pour le commit final si demandé.

---

## File Structure

**Créés :**
- `apps/mb-webapp/src/components/ui/Select.tsx` — wrapper Radix Select.
- `apps/mb-webapp/src/components/ui/Tabs.tsx` — wrapper Radix Tabs.

**Modifiés :**
- `apps/mb-webapp/package.json` — ajout `@radix-ui/react-select`, `@radix-ui/react-tabs`.
- `apps/mb-webapp/src/queries/utils.ts` — ajout `fetchAllPaginatedItems`.
- `apps/mb-webapp/src/api/indicateurs.ts` — ajout `fetchIndividusForIndicateur`, `fetchValeursForIndicateur`.
- `apps/mb-webapp/src/queries/indicateurs.ts` — ajout `indicateurIndividusQueryOptions`, `indicateurValeursQueryOptions`.
- `apps/mb-webapp/src/routes/_authenticated/indicateurs/$id.tsx` — réécriture complète.

---

## Task 1: Installer les dépendances Radix

**Files:**
- Modify: `apps/mb-webapp/package.json` (via pnpm)

- [ ] **Step 1: Ajouter les deux deps**

Run depuis la racine du repo :
```bash
pnpm --filter @pilote/mb-webapp add @radix-ui/react-select @radix-ui/react-tabs
```

Expected: les 2 packages apparaissent dans `dependencies` de `apps/mb-webapp/package.json`, `pnpm-lock.yaml` est mis à jour.

- [ ] **Step 2: Vérifier**

Run :
```bash
grep -E '@radix-ui/react-select|@radix-ui/react-tabs' apps/mb-webapp/package.json
```

Expected: deux lignes affichées.

- [ ] **Step 3: Lint**

Run :
```bash
pnpm --filter @pilote/mb-webapp lint
```

Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add apps/mb-webapp/package.json pnpm-lock.yaml
git commit -m "chore(mb-webapp): add radix select et tabs"
```

---

## Task 2: Helper de pagination générique

**Files:**
- Modify: `apps/mb-webapp/src/queries/utils.ts`

- [ ] **Step 1: Réécrire le fichier**

Contenu complet de `apps/mb-webapp/src/queries/utils.ts` :

```ts
export const DEFAULT_STALE_TIME = 5 * 60 * 1000

type PaginatedPage<T> = {
  items: T[]
  pagination: { hasMore: boolean; cursor: string | null }
}

export const fetchAllPaginatedItems = async <T>(
  fetchPage: (cursor: string | undefined) => Promise<PaginatedPage<T>>,
): Promise<T[]> => {
  const items: T[] = []
  let cursor: string | undefined
  do {
    const page = await fetchPage(cursor)
    items.push(...page.items)
    cursor =
      page.pagination.hasMore && page.pagination.cursor
        ? page.pagination.cursor
        : undefined
  } while (cursor)
  return items
}
```

- [ ] **Step 2: Lint**

Run :
```bash
pnpm --filter @pilote/mb-webapp lint
```

Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add apps/mb-webapp/src/queries/utils.ts
git commit -m "feat(mb-webapp): util fetchAllPaginatedItems pour parcourir toutes les pages"
```

---

## Task 3: Fonctions API individus + valeurs

**Files:**
- Modify: `apps/mb-webapp/src/api/indicateurs.ts`

- [ ] **Step 1: Ajouter les deux fonctions**

Contenu complet de `apps/mb-webapp/src/api/indicateurs.ts` (remplace l'existant — on conserve `fetchIndicateurs` et `fetchIndicateurById`) :

```ts
import {
  type IndicateurApiModel,
  indicateurApiModelSchema,
  type IndicateurListApiModel,
  indicateurListApiModelSchema,
  type IndividusWithValeursListApiModel,
  individusWithValeursListApiModelSchema,
  type ValeurAvancementListApiModel,
  valeurAvancementListApiModelSchema,
} from '@pilote/mb-shared/api'

import { apiClient } from '@/api/client'

export type IndicateursQueryParams = {
  recherche?: string | undefined
  cursor?: string | undefined
}

export const fetchIndicateurs = async (
  params: IndicateursQueryParams,
): Promise<IndicateurListApiModel> => {
  // ky filters out `undefined` values from object-form searchParams (see
  // Ky.#normalizeSearchParams), so we can pass `params` directly.
  const json = await apiClient.get('indicateurs', { searchParams: params }).json()
  return indicateurListApiModelSchema.parse(json)
}

export const fetchIndicateurById = async (id: string): Promise<IndicateurApiModel> => {
  const json = await apiClient.get(`indicateurs/${id}`).json()
  return indicateurApiModelSchema.parse(json)
}

export const fetchIndividusForIndicateur = async (
  indicateurId: string,
  params: { cursor?: string } = {},
): Promise<IndividusWithValeursListApiModel> => {
  const json = await apiClient
    .get(`indicateurs/${indicateurId}/individus`, { searchParams: params })
    .json()
  return individusWithValeursListApiModelSchema.parse(json)
}

export const fetchValeursForIndicateur = async (
  indicateurId: string,
  params: { individus: string[] },
): Promise<ValeurAvancementListApiModel> => {
  const json = await apiClient
    .get(`indicateurs/${indicateurId}/valeurs`, {
      searchParams: { individus: params.individus.join(',') },
    })
    .json()
  return valeurAvancementListApiModelSchema.parse(json)
}
```

- [ ] **Step 2: Lint**

Run :
```bash
pnpm --filter @pilote/mb-webapp lint
```

Expected: exit code 0. (Si ESLint râle sur les imports, vérifier l'ordre alpha.)

- [ ] **Step 3: Commit (différé)**

Pas de commit ici — on commite avec Task 4 (les query options qui consomment ces fonctions).

---

## Task 4: Query options individus + valeurs

**Files:**
- Modify: `apps/mb-webapp/src/queries/indicateurs.ts`

- [ ] **Step 1: Ajouter les deux query options**

Contenu complet de `apps/mb-webapp/src/queries/indicateurs.ts` :

```ts
import { queryOptions } from '@tanstack/react-query'

import {
  fetchIndicateurById,
  fetchIndicateurs,
  fetchIndividusForIndicateur,
  fetchValeursForIndicateur,
  type IndicateursQueryParams,
} from '@/api/indicateurs'

import { DEFAULT_STALE_TIME, fetchAllPaginatedItems } from './utils'

export const indicateursQueryOptions = (params: IndicateursQueryParams) =>
  queryOptions({
    queryKey: ['indicateurs', params],
    queryFn: () => fetchIndicateurs(params),
    staleTime: DEFAULT_STALE_TIME,
  })

export const indicateurQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['indicateur', id],
    queryFn: () => fetchIndicateurById(id),
    staleTime: DEFAULT_STALE_TIME,
  })

export const indicateurIndividusQueryOptions = (indicateurId: string) =>
  queryOptions({
    queryKey: ['indicateur', indicateurId, 'individus'],
    queryFn: () =>
      fetchAllPaginatedItems((cursor) =>
        fetchIndividusForIndicateur(indicateurId, cursor ? { cursor } : {}),
      ),
    staleTime: DEFAULT_STALE_TIME,
  })

export const indicateurValeursQueryOptions = (
  indicateurId: string,
  individuId: string,
) =>
  queryOptions({
    queryKey: ['indicateur', indicateurId, 'valeurs', individuId],
    queryFn: () =>
      fetchValeursForIndicateur(indicateurId, { individus: [individuId] }),
    staleTime: DEFAULT_STALE_TIME,
  })
```

- [ ] **Step 2: Lint**

Run :
```bash
pnpm --filter @pilote/mb-webapp lint
```

Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add apps/mb-webapp/src/api/indicateurs.ts apps/mb-webapp/src/queries/indicateurs.ts
git commit -m "feat(mb-webapp): api + query options pour individus et valeurs d'un indicateur"
```

---

## Task 5: Composant `Select` (Radix wrapper)

**Files:**
- Create: `apps/mb-webapp/src/components/ui/Select.tsx`

- [ ] **Step 1: Créer le fichier**

Contenu complet de `apps/mb-webapp/src/components/ui/Select.tsx` :

```tsx
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'

import { clsxm } from '@/lib/clsxm'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={clsxm(
        'inline-flex items-center justify-between gap-2 rounded border border-secondary-border bg-surface px-3 py-2 text-sm text-text',
        'hover:bg-secondary-hover',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground',
        'data-[placeholder]:text-text-muted',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="size-4 text-text-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        sideOffset={4}
        className={clsxm(
          'z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded border border-border bg-surface shadow-md',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={clsxm(
        'relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 text-sm text-text outline-none',
        'data-[highlighted]:bg-secondary-hover',
        'data-[state=checked]:font-medium',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
```

- [ ] **Step 2: Lint**

Run :
```bash
pnpm --filter @pilote/mb-webapp lint
```

Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add apps/mb-webapp/src/components/ui/Select.tsx
git commit -m "feat(mb-webapp): composant Select (Radix wrapper)"
```

---

## Task 6: Composant `Tabs` (Radix wrapper)

**Files:**
- Create: `apps/mb-webapp/src/components/ui/Tabs.tsx`

- [ ] **Step 1: Créer le fichier**

Contenu complet de `apps/mb-webapp/src/components/ui/Tabs.tsx` :

```tsx
import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'

import { clsxm } from '@/lib/clsxm'

export const Tabs = TabsPrimitive.Root

export function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={clsxm('flex border-b border-border', className)}
      {...props}
    />
  )
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={clsxm(
        '-mb-px inline-flex items-center border-b-2 border-transparent px-4 py-2 text-sm text-text-muted transition-colors',
        'hover:text-text',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'data-[state=active]:border-primary data-[state=active]:text-text data-[state=active]:font-medium',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={clsxm('pt-4 focus-visible:outline-none', className)}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Lint**

Run :
```bash
pnpm --filter @pilote/mb-webapp lint
```

Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add apps/mb-webapp/src/components/ui/Tabs.tsx
git commit -m "feat(mb-webapp): composant Tabs (Radix wrapper)"
```

---

## Task 7: Réécriture de la page `/indicateurs/$id`

**Files:**
- Modify: `apps/mb-webapp/src/routes/_authenticated/indicateurs/$id.tsx`

- [ ] **Step 1: Réécrire complètement le fichier**

Contenu complet de `apps/mb-webapp/src/routes/_authenticated/indicateurs/$id.tsx` :

```tsx
import {
  indicateurPublicIdSchema,
  individuPublicIdSchema,
} from '@pilote/mb-shared/api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/Tabs'
import {
  indicateurIndividusQueryOptions,
  indicateurQueryOptions,
  indicateurValeursQueryOptions,
} from '@/queries/indicateurs'

const paramsSchema = z.object({
  id: indicateurPublicIdSchema,
})

const searchSchema = z.object({
  individu: individuPublicIdSchema.optional(),
})

export const Route = createFileRoute('/_authenticated/indicateurs/$id')({
  params: {
    parse: (raw) => paramsSchema.parse(raw),
    stringify: ({ id }) => ({ id }),
  },
  validateSearch: searchSchema,
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.fetchQuery(indicateurQueryOptions(params.id)),
      context.queryClient.fetchQuery(indicateurIndividusQueryOptions(params.id)),
    ]),
  pendingComponent: () => <RouteLoading message="Chargement de l'indicateur…" />,
  errorComponent: RouteError,
  component: IndicateurDetailComponent,
})

function IndicateurDetailComponent() {
  const { id } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(id))
  const { data: individus } = useSuspenseQuery(
    indicateurIndividusQueryOptions(id),
  )

  const selectedIndividu =
    (search.individu && individus.find((i) => i.individu.id === search.individu)) ||
    individus[0] ||
    undefined

  return (
    <div className="space-y-6">
      <Link
        to="/indicateurs"
        search={{}}
        className="text-sm text-secondary-foreground underline hover:text-text"
      >
        ← Retour à la liste
      </Link>

      <header>
        <span className="text-xs uppercase tracking-wide text-text-muted">
          {indicateur.id}
        </span>
        <h1 className="text-3xl font-semibold text-text">{indicateur.nom}</h1>
      </header>

      {selectedIndividu === undefined ? (
        <p className="rounded border border-border bg-surface p-6 text-sm text-text-muted">
          Aucun individu n'a de valeur pour cet indicateur.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <label className="text-sm text-text-muted" htmlFor="individu-select">
              Individu
            </label>
            <Select
              value={selectedIndividu.individu.id}
              onValueChange={(value) => {
                void navigate({
                  search: (prev) => ({ ...prev, individu: value }),
                })
              }}
            >
              <SelectTrigger id="individu-select" className="min-w-[16rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {individus.map(({ individu }) => (
                  <SelectItem key={individu.id} value={individu.id}>
                    {individu.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="valeurs">
            <TabsList>
              <TabsTrigger value="valeurs">Valeurs</TabsTrigger>
              <TabsTrigger value="metadonnees">Métadonnées</TabsTrigger>
            </TabsList>

            <TabsContent value="valeurs">
              <ValeursTable
                indicateurId={id}
                individuId={selectedIndividu.individu.id}
              />
            </TabsContent>

            <TabsContent value="metadonnees">
              <MetadonneesPanel indicateur={indicateur} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

function ValeursTable({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const { data } = useSuspenseQuery(
    indicateurValeursQueryOptions(indicateurId, individuId),
  )

  const rows = [...data.items].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  )

  if (rows.length === 0) {
    return (
      <p className="rounded border border-border bg-surface p-6 text-sm text-text-muted">
        Aucune valeur pour cet individu.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded border border-border bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-secondary-hover text-text">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Date</th>
            <th className="px-4 py-2 text-right font-medium">Valeur</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.date}>
              <td className="px-4 py-2 text-text">
                {new Date(row.date).toLocaleDateString('fr-FR')}
              </td>
              <td className="px-4 py-2 text-right text-text">
                {row.valeur.toLocaleString('fr-FR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MetadonneesPanel({
  indicateur,
}: {
  indicateur: { id: string; nom: string; createdAt: string; updatedAt: string }
}) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 rounded border border-border bg-surface p-6 text-sm">
      <dt className="text-text-muted">ID</dt>
      <dd className="text-text">{indicateur.id}</dd>

      <dt className="text-text-muted">Nom</dt>
      <dd className="text-text">{indicateur.nom}</dd>

      <dt className="text-text-muted">Créé le</dt>
      <dd className="text-text">
        {new Date(indicateur.createdAt).toLocaleString('fr-FR')}
      </dd>

      <dt className="text-text-muted">Mis à jour le</dt>
      <dd className="text-text">
        {new Date(indicateur.updatedAt).toLocaleString('fr-FR')}
      </dd>
    </dl>
  )
}
```

- [ ] **Step 2: Régénérer le routeur TanStack**

Run :
```bash
pnpm --filter @pilote/mb-webapp routes:generate
```

Expected: pas d'erreur, `routeTree.gen.ts` mis à jour si la signature du route a changé.

- [ ] **Step 3: Lint**

Run :
```bash
pnpm --filter @pilote/mb-webapp lint
```

Expected: exit code 0.

- [ ] **Step 4: Test manuel**

Lance le dev server :
```bash
pnpm --filter @pilote/mb-webapp dev
```

Navigue vers la page d'un indicateur (depuis la liste). Vérifie :
- Le select affiche le nom du premier individu lié.
- L'onglet `Valeurs` montre un tableau Date | Valeur (date desc) ou un message vide.
- L'onglet `Métadonnées` montre ID, Nom, Créé le, Mis à jour le.
- Changer l'individu dans le select met à jour l'URL avec `?individu=...` et le tableau.
- Recharger la page sur une URL avec `?individu=DEPT-XX` sélectionne bien cet individu.
- Cas d'un indicateur sans aucun individu : message "Aucun individu n'a de valeur pour cet indicateur."

- [ ] **Step 5: Commit**

```bash
git add apps/mb-webapp/src/routes/_authenticated/indicateurs/$id.tsx apps/mb-webapp/src/routeTree.gen.ts
git commit -m "feat(mb-webapp): page detail indicateur avec select individus + onglets valeurs/metadonnees"
```

---

## Task 8: Vérification finale

- [ ] **Step 1: Lint global mb-webapp**

Run :
```bash
pnpm --filter @pilote/mb-webapp lint
```

Expected: exit code 0.

- [ ] **Step 2: Build**

Run :
```bash
pnpm --filter @pilote/mb-webapp build
```

Expected: build réussit sans erreur TypeScript.

- [ ] **Step 3: Smoke test**

Relance `pnpm --filter @pilote/mb-webapp dev` et vérifie l'écran complet une dernière fois sur 2-3 indicateurs avec des volumes de valeurs différents.
