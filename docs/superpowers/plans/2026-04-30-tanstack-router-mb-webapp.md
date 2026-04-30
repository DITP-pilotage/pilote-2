# TanStack Router pour mb-webapp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Intégrer TanStack Router (file-based, advanced) dans `mb-webapp` avec deux pages de démonstration (Home + Indicateurs liste/détail) reliées à de nouveaux endpoints REST dans `mb-api`.

**Architecture:** SPA React 19 avec TanStack Router file-based + route context (queryClient + auth singleton) + loaders `ensureQueryData` + `useSuspenseQuery` + search params Zod + auth guards via `beforeLoad`. Nouvelle factory générique `createPaginatedAPIListSchema` dans `mb-shared` consommée par les endpoints paginés.

**Tech Stack:** TanStack Router 1.x, TanStack Query 5.x, Zod 4.x, Hono + zod-openapi (mb-api), Vite 8, Vitest 4, React 19, Tailwind 4.

**Spec source:** `docs/superpowers/specs/2026-04-30-tanstack-router-mb-webapp-design.md`

---

## File Structure

### Modifications

```
apps/mb-webapp/
├── package.json                  # MODIFIÉ : 3 deps + 1 devDep
├── vite.config.ts                # MODIFIÉ : tanstackRouter plugin
├── .gitignore                    # MODIFIÉ : routeTree.gen.ts
├── src/
│   ├── auth.ts                   # NEW
│   ├── auth.test.ts              # NEW
│   ├── main.tsx                  # MODIFIÉ : RouterProvider
│   ├── App.tsx                   # SUPPRIMÉ
│   ├── App.test.tsx              # SUPPRIMÉ
│   ├── api/
│   │   └── indicateurs.ts        # NEW
│   ├── queries/
│   │   └── indicateurs.ts        # NEW
│   ├── tests/
│   │   └── routing.test.tsx      # NEW (smoke tests routes/auth guard)
│   └── routes/                   # NEW (file-based, généré par plugin)
│       ├── __root.tsx
│       ├── index.tsx
│       ├── login.tsx
│       ├── _authenticated.tsx
│       └── _authenticated/
│           └── indicateurs/
│               ├── index.tsx
│               └── $id.tsx

apps/mb-api/
├── src/
│   ├── app.ts                    # MODIFIÉ : registre route indicateurs
│   └── indicateur/               # NEW
│       ├── data/
│       │   └── indicateursFixtures.ts
│       └── routes/
│           ├── getIndicateurs.ts
│           ├── getIndicateurs.test.ts
│           ├── getIndicateurById.ts
│           └── getIndicateurById.test.ts

packages/mb-shared/
└── src/index.ts                  # MODIFIÉ : factory + indicateurAPISchema
```

### Auto-générés
- `apps/mb-webapp/src/routeTree.gen.ts` (plugin Vite, gitignoré)

---

## Task 1: Étendre mb-shared avec la factory paginée et le schéma Indicateur

**Files:**
- Modify: `packages/mb-shared/src/index.ts`

- [ ] **Step 1: Ajouter la factory + le schéma indicateur**

```ts
// packages/mb-shared/src/index.ts
import { z } from 'zod'

export const SHARED_GREETING = 'Hello from @pilote/mb-shared'

export const sharedMessageSchema = z.object({
  greeting: z.string(),
})

export type SharedMessage = z.infer<typeof sharedMessageSchema>

// --- Paginated lists ---

export const paginationSchema = z.object({
  cursor: z.string().nullable(),
  hasMore: z.boolean(),
})

export const createPaginatedAPIListSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: paginationSchema,
    total: z.number(),
  })

export type PaginatedAPIList<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof createPaginatedAPIListSchema<T>>
>

// --- Indicateur ---

export const indicateurStatutSchema = z.enum(['actif', 'inactif', 'archive'])
export type IndicateurStatut = z.infer<typeof indicateurStatutSchema>

export const indicateurAPISchema = z.object({
  id: z.number(),
  nom: z.string(),
  valeur: z.number(),
  unite: z.string(),
  statut: indicateurStatutSchema,
  description: z.string(),
  updatedAt: z.string(),
})
export type IndicateurAPI = z.infer<typeof indicateurAPISchema>

export const indicateurListAPISchema = createPaginatedAPIListSchema(indicateurAPISchema)
export type IndicateurListAPI = z.infer<typeof indicateurListAPISchema>
```

- [ ] **Step 2: Vérifier que tsc passe (mb-shared n'a pas de runner test, validation par compile)**

Run: `cd apps/mb-api && pnpm tsc --noEmit`
Expected: PASS (mb-api importe mb-shared, donc valide les types)

- [ ] **Step 3: Commit**

```bash
git add packages/mb-shared/src/index.ts
git commit -m "feat(mb-shared): add createPaginatedAPIListSchema factory + indicateur schema"
```

---

## Task 2: Ajouter les fixtures Indicateur dans mb-api

**Files:**
- Create: `apps/mb-api/src/indicateur/data/indicateursFixtures.ts`

- [ ] **Step 1: Créer le fichier de fixtures**

```ts
// apps/mb-api/src/indicateur/data/indicateursFixtures.ts
import type { IndicateurAPI } from '@pilote/mb-shared'

export const indicateursFixtures: IndicateurAPI[] = [
  {
    id: 1,
    nom: 'Taux de chômage',
    valeur: 7.3,
    unite: '%',
    statut: 'actif',
    description: 'Taux de chômage au sens du BIT, France entière',
    updatedAt: '2026-04-15T10:00:00Z',
  },
  {
    id: 2,
    nom: 'Émissions de CO2',
    valeur: 380.5,
    unite: 'Mt',
    statut: 'actif',
    description: 'Émissions annuelles de CO2 du secteur industriel',
    updatedAt: '2026-04-10T08:00:00Z',
  },
  {
    id: 3,
    nom: 'Couverture fibre',
    valeur: 87.2,
    unite: '%',
    statut: 'actif',
    description: 'Pourcentage des logements éligibles à la fibre',
    updatedAt: '2026-04-20T12:00:00Z',
  },
  {
    id: 4,
    nom: 'Délai de traitement préfectures',
    valeur: 18,
    unite: 'jours',
    statut: 'actif',
    description: 'Délai moyen de traitement des dossiers en préfecture',
    updatedAt: '2026-04-05T09:00:00Z',
  },
  {
    id: 5,
    nom: 'Effectif police nationale',
    valeur: 152000,
    unite: 'agents',
    statut: 'actif',
    description: 'Effectif total de la police nationale',
    updatedAt: '2026-03-28T14:00:00Z',
  },
  {
    id: 6,
    nom: 'Indicateur expérimental ancien',
    valeur: 42,
    unite: 'unités',
    statut: 'archive',
    description: 'Indicateur pilote archivé en 2024',
    updatedAt: '2025-12-31T23:59:59Z',
  },
  {
    id: 7,
    nom: 'Indicateur en pause',
    valeur: 0,
    unite: 'unités',
    statut: 'inactif',
    description: 'Indicateur temporairement suspendu',
    updatedAt: '2026-02-10T11:00:00Z',
  },
  {
    id: 8,
    nom: 'Satisfaction usagers services publics',
    valeur: 7.8,
    unite: '/10',
    statut: 'actif',
    description: 'Note moyenne de satisfaction',
    updatedAt: '2026-04-25T16:00:00Z',
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add apps/mb-api/src/indicateur/data/indicateursFixtures.ts
git commit -m "feat(mb-api): add indicateurs fixtures"
```

---

## Task 3: Endpoint GET /indicateurs avec filtres & pagination cursor

**Files:**
- Create: `apps/mb-api/src/indicateur/routes/getIndicateurs.test.ts`
- Create: `apps/mb-api/src/indicateur/routes/getIndicateurs.ts`
- Modify: `apps/mb-api/src/app.ts`

- [ ] **Step 1: Écrire le test (failing)**

```ts
// apps/mb-api/src/indicateur/routes/getIndicateurs.test.ts
import { describe, expect, it } from 'vitest'

import { getIndicateurs } from '@/indicateur/routes/getIndicateurs'

describe('GET /indicateurs', () => {
  it('retourne tous les indicateurs sans filtre', async () => {
    const response = await getIndicateurs.request('/indicateurs')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(8)
    expect(body.pagination.hasMore).toBe(false)
    expect(body.total).toBe(8)
  })

  it('filtre par statut', async () => {
    const response = await getIndicateurs.request('/indicateurs?statut=archive')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(body.items[0].statut).toBe('archive')
  })

  it('filtre par recherche (nom, case-insensitive)', async () => {
    const response = await getIndicateurs.request('/indicateurs?recherche=fibre')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(body.items[0].nom).toContain('fibre')
  })

  it('pagine avec cursor (taille de page 3)', async () => {
    const r1 = await getIndicateurs.request('/indicateurs')
    const b1 = await r1.json()
    expect(b1.items).toHaveLength(8)

    const r2 = await getIndicateurs.request('/indicateurs?cursor=3')
    const b2 = await r2.json()
    expect(b2.items.length).toBeGreaterThan(0)
    expect(b2.items[0].id).toBeGreaterThan(3)
  })
})
```

- [ ] **Step 2: Run test (must FAIL)**

Run: `cd apps/mb-api && pnpm test getIndicateurs`
Expected: FAIL — module not found

- [ ] **Step 3: Implémenter l'endpoint**

```ts
// apps/mb-api/src/indicateur/routes/getIndicateurs.ts
import {
  indicateurListAPISchema,
  indicateurStatutSchema,
} from '@pilote/mb-shared'
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { indicateursFixtures } from '@/indicateur/data/indicateursFixtures'

const IndicateurListSchema = indicateurListAPISchema.openapi('IndicateurList')

const querySchema = z.object({
  recherche: z.string().optional(),
  statut: indicateurStatutSchema.optional(),
  cursor: z.string().optional(),
})

const PAGE_SIZE = 100

const getIndicateursRoute = createRoute({
  method: 'get',
  path: '/indicateurs',
  tags: ['Indicateur'],
  summary: 'Lister les indicateurs',
  request: { query: querySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurListSchema } },
      description: 'Liste paginée des indicateurs',
    },
  },
})

export const getIndicateurs = new OpenAPIHono()

getIndicateurs.openapi(getIndicateursRoute, (context) => {
  const { recherche, statut, cursor } = context.req.valid('query')

  let filtered = indicateursFixtures
  if (recherche) {
    const q = recherche.toLowerCase()
    filtered = filtered.filter((i) => i.nom.toLowerCase().includes(q))
  }
  if (statut) {
    filtered = filtered.filter((i) => i.statut === statut)
  }

  const total = filtered.length

  const cursorId = cursor ? Number(cursor) : 0
  const paged = filtered.filter((i) => i.id > cursorId).slice(0, PAGE_SIZE)
  const hasMore = filtered.filter((i) => i.id > cursorId).length > paged.length
  const nextCursor =
    hasMore && paged.length > 0 ? String(paged[paged.length - 1]!.id) : null

  const data = {
    items: paged,
    pagination: { cursor: nextCursor, hasMore },
    total,
  }

  return jsonResponseOk({
    context,
    data,
    schema: IndicateurListSchema,
    status: 200,
  })
})
```

> Note : `PAGE_SIZE = 100` permet aux 3 premiers tests de passer sans pagination active. Le 4e test couvre le cursor.

- [ ] **Step 4: Run test (must PASS)**

Run: `cd apps/mb-api && pnpm test getIndicateurs`
Expected: PASS (4 tests)

- [ ] **Step 5: Brancher la route dans app.ts**

```ts
// apps/mb-api/src/app.ts
import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'

import { env } from '@/env'
import { health } from '@/healthcheck/routes/health'
import { getIndicateurs } from '@/indicateur/routes/getIndicateurs'
import { sharedMessage } from '@/shared/routes/sharedMessage'

export const app = new OpenAPIHono()

app.use('*', cors({ origin: env.CORS_ORIGINS, credentials: true }))

app.get('/', (context) => context.json({ hello: 'world' }))
app.route('/', health)
app.route('/', sharedMessage)
app.route('/', getIndicateurs)

app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: { title: 'Pilote API', version: '0.1.0' },
})

app.get('/docs', swaggerUI({ url: '/openapi.json' }))
```

- [ ] **Step 6: Lint + commit**

```bash
cd apps/mb-api && pnpm lint
cd ../.. && git add apps/mb-api && git commit -m "feat(mb-api): add GET /indicateurs endpoint with filters and cursor pagination"
```

---

## Task 4: Endpoint GET /indicateurs/:id

**Files:**
- Create: `apps/mb-api/src/indicateur/routes/getIndicateurById.test.ts`
- Create: `apps/mb-api/src/indicateur/routes/getIndicateurById.ts`
- Modify: `apps/mb-api/src/app.ts`

- [ ] **Step 1: Écrire le test (failing)**

```ts
// apps/mb-api/src/indicateur/routes/getIndicateurById.test.ts
import { describe, expect, it } from 'vitest'

import { getIndicateurById } from '@/indicateur/routes/getIndicateurById'

describe('GET /indicateurs/:id', () => {
  it('retourne un indicateur par id', async () => {
    const response = await getIndicateurById.request('/indicateurs/1')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.id).toBe(1)
    expect(body.nom).toBe('Taux de chômage')
  })

  it('retourne 404 si l’indicateur n’existe pas', async () => {
    const response = await getIndicateurById.request('/indicateurs/9999')
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toBe('Indicateur introuvable')
  })

  it('retourne 400 si l’id n’est pas un nombre', async () => {
    const response = await getIndicateurById.request('/indicateurs/abc')

    expect(response.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test (must FAIL)**

Run: `cd apps/mb-api && pnpm test getIndicateurById`
Expected: FAIL — module not found

- [ ] **Step 3: Implémenter l'endpoint**

```ts
// apps/mb-api/src/indicateur/routes/getIndicateurById.ts
import { indicateurAPISchema } from '@pilote/mb-shared'
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { indicateursFixtures } from '@/indicateur/data/indicateursFixtures'

const IndicateurSchema = indicateurAPISchema.openapi('Indicateur')

const NotFoundSchema = z
  .object({ error: z.literal('Indicateur introuvable') })
  .openapi('IndicateurNotFound')

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const getIndicateurByIdRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}',
  tags: ['Indicateur'],
  summary: 'Récupérer un indicateur par id',
  request: { params: paramsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurSchema } },
      description: 'Indicateur trouvé',
    },
    404: {
      content: { 'application/json': { schema: NotFoundSchema } },
      description: 'Indicateur introuvable',
    },
  },
})

export const getIndicateurById = new OpenAPIHono()

getIndicateurById.openapi(getIndicateurByIdRoute, (context) => {
  const { id } = context.req.valid('param')
  const found = indicateursFixtures.find((i) => i.id === id)

  if (!found) {
    return jsonResponseError({
      context,
      error: { error: 'Indicateur introuvable' as const },
      schema: NotFoundSchema,
      status: 404,
    })
  }

  return jsonResponseOk({
    context,
    data: found,
    schema: IndicateurSchema,
    status: 200,
  })
})
```

- [ ] **Step 4: Run test (must PASS)**

Run: `cd apps/mb-api && pnpm test getIndicateurById`
Expected: PASS (3 tests)

- [ ] **Step 5: Brancher la route dans app.ts**

```ts
// apps/mb-api/src/app.ts — ajouter cet import et cette route
import { getIndicateurById } from '@/indicateur/routes/getIndicateurById'
// ...
app.route('/', getIndicateurById)
```

L'ordre final dans `app.ts` :
```ts
app.route('/', health)
app.route('/', sharedMessage)
app.route('/', getIndicateurs)
app.route('/', getIndicateurById)
```

- [ ] **Step 6: Lint + commit**

```bash
cd apps/mb-api && pnpm lint
cd ../.. && git add apps/mb-api && git commit -m "feat(mb-api): add GET /indicateurs/:id endpoint"
```

---

## Task 5: Installer les packages TanStack Router et configurer Vite

**Files:**
- Modify: `apps/mb-webapp/package.json`
- Modify: `apps/mb-webapp/vite.config.ts`
- Modify: `apps/mb-webapp/.gitignore`

- [ ] **Step 1: Ajouter les dépendances**

```bash
cd apps/mb-webapp
pnpm add @tanstack/react-router @tanstack/react-router-devtools
pnpm add -D @tanstack/router-plugin
```

- [ ] **Step 2: Configurer le plugin Vite**

Mettre à jour `apps/mb-webapp/vite.config.ts` :

```ts
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    // tanstackRouter DOIT être avant react()
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    css: true,
  },
})
```

- [ ] **Step 3: Ajouter routeTree.gen.ts au .gitignore**

Mettre à jour `apps/mb-webapp/.gitignore` :

```
dist/
node_modules/
coverage/
*.tsbuildinfo
.env
.env.local
src/routeTree.gen.ts
```

- [ ] **Step 4: Vérifier que tsc passe**

Run: `cd apps/mb-webapp && pnpm tsc --noEmit`
Expected: PASS (le routeTree.gen.ts n'existe pas encore mais aucun import ne le référence à ce stade)

- [ ] **Step 5: Commit**

```bash
git add apps/mb-webapp/package.json apps/mb-webapp/vite.config.ts apps/mb-webapp/.gitignore pnpm-lock.yaml
git commit -m "chore(mb-webapp): install TanStack Router + configure Vite plugin"
```

---

## Task 6: Module auth (TDD)

**Files:**
- Create: `apps/mb-webapp/src/auth.test.ts`
- Create: `apps/mb-webapp/src/auth.ts`

- [ ] **Step 1: Écrire le test (failing)**

```ts
// apps/mb-webapp/src/auth.test.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { auth } from '@/auth'

describe('auth singleton', () => {
  beforeEach(() => {
    localStorage.clear()
    auth.logout()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('démarre non authentifié', () => {
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
  })

  it('login() authentifie et persiste en localStorage', () => {
    auth.login()

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user).toEqual({
      name: 'Marie Curie',
      email: 'marie@pilote-mb.fr',
    })
    expect(localStorage.getItem('mb-auth')).not.toBeNull()
  })

  it('logout() déconnecte et nettoie localStorage', () => {
    auth.login()
    auth.logout()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
    expect(localStorage.getItem('mb-auth')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test (must FAIL)**

Run: `cd apps/mb-webapp && pnpm test auth`
Expected: FAIL — module not found

- [ ] **Step 3: Implémenter le module**

```ts
// apps/mb-webapp/src/auth.ts
const STORAGE_KEY = 'mb-auth'

export type AuthUser = {
  name: string
  email: string
}

export type Auth = {
  isAuthenticated: boolean
  user: AuthUser | null
  login: () => void
  logout: () => void
}

const FAKE_USER: AuthUser = {
  name: 'Marie Curie',
  email: 'marie@pilote-mb.fr',
}

const readStorage = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    return parsed
  } catch {
    return null
  }
}

const state: { user: AuthUser | null } = {
  user: readStorage(),
}

export const auth: Auth = {
  get isAuthenticated() {
    return state.user !== null
  },
  get user() {
    return state.user
  },
  login() {
    state.user = FAKE_USER
    localStorage.setItem(STORAGE_KEY, JSON.stringify(FAKE_USER))
  },
  logout() {
    state.user = null
    localStorage.removeItem(STORAGE_KEY)
  },
}
```

- [ ] **Step 4: Run test (must PASS)**

Run: `cd apps/mb-webapp && pnpm test auth`
Expected: PASS (3 tests)

- [ ] **Step 5: Lint + commit**

```bash
cd apps/mb-webapp && pnpm lint
cd ../.. && git add apps/mb-webapp/src/auth.ts apps/mb-webapp/src/auth.test.ts
git commit -m "feat(mb-webapp): add auth singleton (localStorage stub for ProConnect)"
```

---

## Task 7: API client + queryOptions pour indicateurs

**Files:**
- Create: `apps/mb-webapp/src/api/indicateurs.ts`
- Create: `apps/mb-webapp/src/queries/indicateurs.ts`

- [ ] **Step 1: Implémenter le client API**

```ts
// apps/mb-webapp/src/api/indicateurs.ts
import {
  type IndicateurAPI,
  indicateurAPISchema,
  type IndicateurListAPI,
  indicateurListAPISchema,
  type IndicateurStatut,
} from '@pilote/mb-shared'

import { apiClient } from '@/api/client'

export type IndicateursQueryParams = {
  recherche?: string
  statut?: IndicateurStatut
  cursor?: string
}

export const fetchIndicateurs = async (
  params: IndicateursQueryParams,
): Promise<IndicateurListAPI> => {
  const searchParams = new URLSearchParams()
  if (params.recherche) searchParams.set('recherche', params.recherche)
  if (params.statut) searchParams.set('statut', params.statut)
  if (params.cursor) searchParams.set('cursor', params.cursor)

  const json = await apiClient.get('indicateurs', { searchParams }).json()
  return indicateurListAPISchema.parse(json)
}

export const fetchIndicateurById = async (id: number): Promise<IndicateurAPI> => {
  const json = await apiClient.get(`indicateurs/${id}`).json()
  return indicateurAPISchema.parse(json)
}
```

- [ ] **Step 2: Implémenter les queryOptions**

```ts
// apps/mb-webapp/src/queries/indicateurs.ts
import { queryOptions } from '@tanstack/react-query'

import {
  fetchIndicateurById,
  fetchIndicateurs,
  type IndicateursQueryParams,
} from '@/api/indicateurs'

export const indicateursQueryOptions = (params: IndicateursQueryParams) =>
  queryOptions({
    queryKey: ['indicateurs', params],
    queryFn: () => fetchIndicateurs(params),
  })

export const indicateurQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['indicateur', id],
    queryFn: () => fetchIndicateurById(id),
  })
```

- [ ] **Step 3: Vérifier la compilation**

Run: `cd apps/mb-webapp && pnpm tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Lint + commit**

```bash
cd apps/mb-webapp && pnpm lint
cd ../.. && git add apps/mb-webapp/src/api/indicateurs.ts apps/mb-webapp/src/queries/indicateurs.ts
git commit -m "feat(mb-webapp): add indicateurs API client and queryOptions"
```

---

## Task 8: Route racine `__root.tsx`

**Files:**
- Create: `apps/mb-webapp/src/routes/__root.tsx`

- [ ] **Step 1: Créer la route racine**

```tsx
// apps/mb-webapp/src/routes/__root.tsx
import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import type { Auth } from '@/auth'

export type RouterContext = {
  queryClient: QueryClient
  auth: Auth
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  const { auth } = Route.useRouteContext()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link
            to="/"
            className="text-lg font-semibold text-slate-900 hover:text-slate-600"
          >
            Pilote MB
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/indicateurs"
              search={{}}
              className="text-slate-700 hover:text-slate-900"
            >
              Indicateurs
            </Link>
            {auth.isAuthenticated ? (
              <span className="flex items-center gap-2">
                <span className="text-slate-600">{auth.user?.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    auth.logout()
                    window.location.assign('/')
                  }}
                  className="rounded border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-100"
                >
                  Se déconnecter
                </button>
              </span>
            ) : (
              <Link
                to="/login"
                search={{}}
                className="rounded bg-slate-900 px-3 py-1 text-white hover:bg-slate-700"
              >
                Se connecter
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>

      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </div>
  )
}
```

- [ ] **Step 2: Commit (le routeTree.gen.ts n'est pas encore généré, normal)**

```bash
git add apps/mb-webapp/src/routes/__root.tsx
git commit -m "feat(mb-webapp): add root route with header and devtools"
```

---

## Task 9: Mettre à jour `main.tsx` avec RouterProvider

**Files:**
- Modify: `apps/mb-webapp/src/main.tsx`

- [ ] **Step 1: Remplacer le contenu**

```tsx
// apps/mb-webapp/src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { auth } from '@/auth'
import '@/index.css'
import { routeTree } from '@/routeTree.gen'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found in index.html')
}

const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  context: { queryClient, auth },
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
```

- [ ] **Step 2: Commit**

```bash
git add apps/mb-webapp/src/main.tsx
git commit -m "feat(mb-webapp): bootstrap RouterProvider with route context"
```

> Note : le build complet ne fonctionnera qu'une fois toutes les routes en place ; les tâches suivantes les ajoutent une par une.

---

## Task 10: Page d'accueil `/` (préserve la démo shared-message)

**Files:**
- Create: `apps/mb-webapp/src/routes/index.tsx`

- [ ] **Step 1: Créer la route home**

```tsx
// apps/mb-webapp/src/routes/index.tsx
import { SHARED_GREETING } from '@pilote/mb-shared'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { fetchSharedMessage } from '@/api/sharedMessage'
import { auth } from '@/auth'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['shared-message'],
    queryFn: fetchSharedMessage,
  })

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-semibold tracking-tight">Pilote MB</h1>
        <p className="mt-3 text-slate-600">
          Webapp Marque Blanche — squelette initial avec TanStack Router.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Démo TanStack Query (préservée)</h2>
        <pre className="rounded bg-slate-900 p-4 text-sm text-slate-100">
          {SHARED_GREETING}
        </pre>
        <pre className="rounded bg-slate-100 p-4 text-sm text-slate-800">
          {isPending && 'Chargement…'}
          {isError && `Erreur: ${error.message}`}
          {data && data.greeting}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Diagnostic TanStack Router</h2>
        <ul className="rounded border border-slate-200 bg-white p-4 text-sm">
          <li>✓ Router initialisé</li>
          <li>
            État auth : <strong>{auth.isAuthenticated ? 'authentifié' : 'anonyme'}</strong>
          </li>
        </ul>
        <div className="flex gap-3">
          <Link
            to="/indicateurs"
            search={{}}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            Voir les indicateurs
          </Link>
          {!auth.isAuthenticated && (
            <Link
              to="/login"
              search={{}}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Se connecter
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mb-webapp/src/routes/index.tsx
git commit -m "feat(mb-webapp): add home route preserving shared-message demo"
```

---

## Task 11: Page de login `/login`

**Files:**
- Create: `apps/mb-webapp/src/routes/login.tsx`

- [ ] **Step 1: Créer la route login**

```tsx
// apps/mb-webapp/src/routes/login.tsx
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/indicateurs', search: {} })
    }
  },
  component: LoginComponent,
})

function LoginComponent() {
  const { auth } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = useNavigate()

  const handleLogin = () => {
    auth.login()
    navigate({ to: '/indicateurs', search: {} })
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Connexion</h1>
        <p className="mt-2 text-sm text-slate-600">
          Auth simulée — un faux utilisateur sera créé. ProConnect remplacera
          cette implémentation plus tard.
        </p>
      </header>

      <div className="rounded border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-700">
          Vous serez connecté en tant que :
        </p>
        <p className="mt-1 font-medium">Marie Curie</p>
        <p className="text-sm text-slate-500">marie@pilote-mb.fr</p>

        <button
          type="button"
          onClick={handleLogin}
          className="mt-4 w-full rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
        >
          Se connecter
        </button>
      </div>

      <div className="rounded border border-slate-200 bg-slate-100 p-4 text-sm">
        <p className="font-medium">Diagnostic TanStack Router</p>
        <ul className="mt-2 list-inside list-disc text-slate-700">
          <li>✓ beforeLoad redirect fonctionnel (si déjà connecté → redirect)</li>
          <li>
            search.redirect : <code>{search.redirect ?? '(vide)'}</code>
          </li>
        </ul>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mb-webapp/src/routes/login.tsx
git commit -m "feat(mb-webapp): add login route with beforeLoad redirect"
```

---

## Task 12: Layout pathless `_authenticated`

**Files:**
- Create: `apps/mb-webapp/src/routes/_authenticated.tsx`

- [ ] **Step 1: Créer le layout d'authentification**

```tsx
// apps/mb-webapp/src/routes/_authenticated.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: () => <Outlet />,
})
```

- [ ] **Step 2: Commit**

```bash
git add apps/mb-webapp/src/routes/_authenticated.tsx
git commit -m "feat(mb-webapp): add _authenticated layout with beforeLoad guard"
```

---

## Task 13: Liste indicateurs `/indicateurs`

**Files:**
- Create: `apps/mb-webapp/src/routes/_authenticated/indicateurs/index.tsx`

- [ ] **Step 1: Créer la route liste**

```tsx
// apps/mb-webapp/src/routes/_authenticated/indicateurs/index.tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { auth } from '@/auth'
import { indicateursQueryOptions } from '@/queries/indicateurs'

const indicateursSearchSchema = z.object({
  recherche: z.string().optional(),
  statut: z.enum(['actif', 'inactif', 'archive']).optional(),
  cursor: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/indicateurs/')({
  validateSearch: indicateursSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(indicateursQueryOptions(deps)),
  pendingComponent: () => (
    <div className="rounded border border-slate-200 bg-white p-6 text-slate-500">
      Chargement des indicateurs…
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="rounded border border-red-200 bg-red-50 p-6 text-red-800">
      <p className="font-medium">Erreur lors du chargement</p>
      <p className="mt-1 text-sm">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
      >
        Réessayer
      </button>
    </div>
  ),
  component: IndicateursListComponent,
})

function IndicateursListComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data } = useSuspenseQuery(indicateursQueryOptions(search))

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Indicateurs</h1>
        <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
          🔒 Authentifié comme {auth.user?.name}
        </span>
      </header>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Rechercher par nom…"
          value={search.recherche ?? ''}
          onChange={(e) => {
            const recherche = e.target.value || undefined
            navigate({ search: (prev) => ({ ...prev, recherche, cursor: undefined }) })
          }}
          className="rounded border border-slate-300 px-3 py-1 text-sm"
        />
        <select
          value={search.statut ?? ''}
          onChange={(e) => {
            const value = e.target.value
            const statut =
              value === 'actif' || value === 'inactif' || value === 'archive'
                ? value
                : undefined
            navigate({ search: (prev) => ({ ...prev, statut, cursor: undefined }) })
          }}
          className="rounded border border-slate-300 px-3 py-1 text-sm"
        >
          <option value="">Tous statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
          <option value="archive">Archivé</option>
        </select>
      </div>

      <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {data.items.map((indicateur) => (
          <li key={indicateur.id}>
            <Link
              to="/indicateurs/$id"
              params={{ id: indicateur.id }}
              className="block px-4 py-3 hover:bg-slate-50"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-slate-900">{indicateur.nom}</span>
                <span className="text-sm text-slate-500">
                  {indicateur.valeur} {indicateur.unite}
                </span>
              </div>
              <span className="text-xs uppercase tracking-wide text-slate-500">
                {indicateur.statut}
              </span>
            </Link>
          </li>
        ))}
        {data.items.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            Aucun indicateur ne correspond aux filtres.
          </li>
        )}
      </ul>

      {data.pagination.hasMore && data.pagination.cursor && (
        <button
          type="button"
          onClick={() => {
            const next = data.pagination.cursor
            if (next) navigate({ search: (prev) => ({ ...prev, cursor: next }) })
          }}
          className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
        >
          Page suivante
        </button>
      )}

      <section className="rounded border border-slate-200 bg-slate-100 p-4 text-sm">
        <p className="font-medium">Diagnostic TanStack Router</p>
        <ul className="mt-2 list-inside list-disc text-slate-700">
          <li>✓ Loader exécuté ({data.total} indicateur(s) chargés)</li>
          <li>
            Search params parsés : <code>{JSON.stringify(search)}</code>
          </li>
          <li>✓ useSuspenseQuery branché</li>
          <li>🔒 Guard _authenticated franchi</li>
        </ul>
        <button
          type="button"
          onClick={() => {
            // Force une erreur en envoyant un statut invalide
            navigate({
              search: (prev) => ({
                ...prev,
                statut: 'broken' as never,
              }),
            })
          }}
          className="mt-3 rounded border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
        >
          🐛 Forcer une erreur (search param invalide)
        </button>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mb-webapp/src/routes/_authenticated/indicateurs/index.tsx
git commit -m "feat(mb-webapp): add indicateurs list route with search params and loader"
```

---

## Task 14: Détail indicateur `/indicateurs/$id`

**Files:**
- Create: `apps/mb-webapp/src/routes/_authenticated/indicateurs/$id.tsx`

- [ ] **Step 1: Créer la route détail**

```tsx
// apps/mb-webapp/src/routes/_authenticated/indicateurs/$id.tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'

import { indicateurQueryOptions } from '@/queries/indicateurs'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const Route = createFileRoute('/_authenticated/indicateurs/$id')({
  params: {
    parse: (raw) => paramsSchema.parse(raw),
    stringify: ({ id }) => ({ id: String(id) }),
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(indicateurQueryOptions(params.id)),
  pendingComponent: () => (
    <div className="rounded border border-slate-200 bg-white p-6 text-slate-500">
      Chargement de l'indicateur…
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="space-y-3">
      <div className="rounded border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-medium">Indicateur introuvable</p>
        <p className="mt-1 text-sm">{error.message}</p>
      </div>
      <Link
        to="/indicateurs"
        search={{}}
        className="inline-block text-sm text-slate-700 underline hover:text-slate-900"
      >
        ← Retour à la liste
      </Link>
    </div>
  ),
  component: IndicateurDetailComponent,
})

function IndicateurDetailComponent() {
  const { id } = Route.useParams()
  const { data } = useSuspenseQuery(indicateurQueryOptions(id))

  return (
    <div className="space-y-6">
      <Link
        to="/indicateurs"
        search={{}}
        className="text-sm text-slate-700 underline hover:text-slate-900"
      >
        ← Retour à la liste
      </Link>

      <header>
        <span className="text-xs uppercase tracking-wide text-slate-500">
          {data.statut}
        </span>
        <h1 className="text-3xl font-semibold">{data.nom}</h1>
        <p className="mt-1 text-2xl text-slate-700">
          {data.valeur} <span className="text-base text-slate-500">{data.unite}</span>
        </p>
      </header>

      <section className="rounded border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-medium text-slate-500">Description</h2>
        <p className="mt-2 text-slate-800">{data.description}</p>
      </section>

      <section className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">
        <p>
          Mis à jour le {new Date(data.updatedAt).toLocaleString('fr-FR')}
        </p>
        <p>ID interne : {data.id}</p>
      </section>

      <section className="rounded border border-slate-200 bg-slate-100 p-4 text-sm">
        <p className="font-medium">Diagnostic TanStack Router</p>
        <ul className="mt-2 list-inside list-disc text-slate-700">
          <li>
            ✓ Route param <code>id</code> parsé en number :{' '}
            <strong>{id}</strong> (typeof : {typeof id})
          </li>
          <li>✓ Loader détail exécuté</li>
          <li>✓ useSuspenseQuery (cache partagé avec liste)</li>
        </ul>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mb-webapp/src/routes/_authenticated/indicateurs/$id.tsx
git commit -m "feat(mb-webapp): add indicateur detail route with typed params"
```

---

## Task 15: Supprimer App.tsx + adapter le test

**Files:**
- Delete: `apps/mb-webapp/src/App.tsx`
- Delete: `apps/mb-webapp/src/App.test.tsx`
- Create: `apps/mb-webapp/src/tests/routing.test.tsx`

- [ ] **Step 1: Écrire un smoke test pour le routing (failing si App.tsx encore importé quelque part)**

```tsx
// apps/mb-webapp/src/tests/routing.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { auth } from '@/auth'
import { routeTree } from '@/routeTree.gen'

const renderAt = (initialPath: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createRouter({
    routeTree,
    context: { queryClient, auth },
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('routing', () => {
  beforeEach(() => {
    localStorage.clear()
    auth.logout()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it("rend la page d'accueil", async () => {
    renderAt('/')
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Pilote MB' }),
      ).toBeInTheDocument()
    })
  })

  it("redirige vers /login quand on accède à /indicateurs sans être authentifié", async () => {
    renderAt('/indicateurs')
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Connexion' }),
      ).toBeInTheDocument()
    })
  })

  it("permet d'accéder à /indicateurs après login", async () => {
    auth.login()
    renderAt('/indicateurs')
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Indicateurs' }),
      ).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Supprimer App.tsx + App.test.tsx**

```bash
rm apps/mb-webapp/src/App.tsx apps/mb-webapp/src/App.test.tsx
```

- [ ] **Step 3: Lancer le dev pour générer routeTree.gen.ts (le plugin Vite le crée au démarrage)**

```bash
cd apps/mb-webapp && pnpm dev &
sleep 5
ls src/routeTree.gen.ts && pkill -f "vite"
```

Expected: `src/routeTree.gen.ts` existe.

- [ ] **Step 4: Run tests (avec mock fetch pour éviter de hit l'API réelle)**

Le test charge `/indicateurs` qui déclenche le loader qui appelle l'API. Pour qu'il passe en isolation, ajouter un mock dans `vitest.setup.ts` :

```ts
// apps/mb-webapp/vitest.setup.ts — ajouter après les imports existants
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

const fetchMock = vi.fn()

beforeAll(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ),
  )
})

afterAll(() => {
  vi.unstubAllGlobals()
})
```

> Vérifier le contenu existant de `vitest.setup.ts` avant d'éditer ; ne pas écraser ce qui est déjà là (probablement `import '@testing-library/jest-dom/vitest'`).

Run: `cd apps/mb-webapp && pnpm test`
Expected: PASS (auth tests + routing tests)

- [ ] **Step 5: Lint + commit**

```bash
cd apps/mb-webapp && pnpm lint
cd ../.. && git add apps/mb-webapp
git commit -m "feat(mb-webapp): replace App.tsx with router + add routing smoke tests"
```

---

## Task 16: Vérification finale (build + lint complets)

**Files:** aucun

- [ ] **Step 1: Build mb-webapp**

Run: `cd apps/mb-webapp && pnpm build`
Expected: PASS

- [ ] **Step 2: Build mb-api**

Run: `cd apps/mb-api && pnpm build`
Expected: PASS

- [ ] **Step 3: Lint global**

Run: `pnpm -r lint`
Expected: PASS sur tous les workspaces

- [ ] **Step 4: Test manuel en local (à faire manuellement, ne pas committer)**

```bash
# Terminal 1
cd apps/mb-api && pnpm dev

# Terminal 2
cd apps/mb-webapp && pnpm dev
```

Vérifier dans le navigateur :
1. `/` → home avec démo shared-message + boutons
2. Cliquer "Voir les indicateurs" → redirect vers `/login`
3. Se connecter → redirect vers `/indicateurs`
4. Vérifier filtres `recherche`, `statut`, pagination cursor (modifier `PAGE_SIZE` à 3 temporairement si besoin pour tester)
5. Cliquer un indicateur → page détail
6. "Retour à la liste" → search params préservés
7. Bouton "Forcer une erreur" → errorComponent affiché
8. Logout → retour anonyme

- [ ] **Step 5: Push de la branche**

```bash
git push -u origin mb-webapp-tanstack-router
```

---

## Hors-scope (rappel)

- ProConnect (auth réelle)
- Persistance Prisma des indicateurs
- Wrapper `createPaginatedQuery` côté webapp
- TanStack DB
- View transitions, scroll restoration custom
- Tests E2E
