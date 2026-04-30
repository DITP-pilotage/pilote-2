# TanStack Router pour mb-webapp — Design

**Date :** 2026-04-30
**Branche :** `mb-webapp-tanstack-router`
**Statut :** Spec — à valider

## Contexte

`mb-webapp` est au stade squelette : React 19, TanStack Query, Vite, Tailwind 4, sans solution de routage. On souhaite poser les bases d'une architecture de routage durable pour le futur produit Pilote MB (marque blanche) qui aura plusieurs dizaines de routes.

L'objectif de cette première itération : intégrer TanStack Router avec son setup avancé (file-based, route context, loaders, search params Zod, auth guards), en démontrant son fonctionnement via deux pages (Home + Indicateur list/detail) reliées à un endpoint réel dans `mb-api`.

## Décisions clés

- **TanStack Router en SPA** (pas TanStack Start) — l'archi backend est déjà séparée (`mb-api` en Hono), TanStack Start ferait double emploi avec un BFF supplémentaire sans bénéfice.
- **File-based routing** via `@tanstack/router-plugin` (Vite). Génération automatique de `routeTree.gen.ts`.
- **Pas de TanStack DB** — TanStack DB est conçu pour des architectures sync-engine (Electric SQL, Zero…). Notre backend est REST classique. À réévaluer si on intègre un sync engine plus tard.
- **Auth simulée via module `auth.ts`** (singleton). Implémentation localStorage maintenant ; remplacée par ProConnect plus tard sans toucher aux routes.
- **Pattern data fetching :** `loader` + `ensureQueryData` + `useSuspenseQuery`. Zéro spinner dans les composants, gestion centralisée via `pendingComponent` / `errorComponent` au niveau route.

## Architecture

### Packages à ajouter (mb-webapp)

```
@tanstack/react-router          # router
@tanstack/router-plugin         # vite plugin (devDep)
@tanstack/router-devtools       # devtools overlay (devDep)
```

### Configuration Vite

```ts
// apps/mb-webapp/vite.config.ts
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }), // AVANT react()
    react(),
    tailwindcss(),
  ],
  // ...
})
```

### Route context

```ts
type RouterContext = {
  queryClient: QueryClient
  auth: Auth
}
```

Injecté à la création du router dans `main.tsx`. Accessible dans tous les `beforeLoad` et `loader`.

### Bootstrap router (`main.tsx`)

```ts
const queryClient = new QueryClient()
const router = createRouter({
  routeTree,
  context: { queryClient, auth },
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
```

`QueryClientProvider` enveloppe le `<RouterProvider router={router} />`.

## Arbre de routes

```
src/routes/
├── __root.tsx                 # Layout racine : header + Outlet + Devtools
├── index.tsx                  # /          (publique)
├── login.tsx                  # /login     (publique, redirect si déjà auth)
└── _authenticated.tsx         # Layout pathless : beforeLoad auth guard
    └── _authenticated/
        └── indicateurs/
            ├── index.tsx      # /indicateurs       (liste)
            └── $id.tsx        # /indicateurs/$id   (détail)
```

**Logique d'accès :**
- `/`, `/login` : publiques
- Tout sous `_authenticated` : `beforeLoad` vérifie `context.auth.isAuthenticated`, sinon `redirect({ to: '/login', search: { redirect: location.href } })`
- `/login` : si déjà authentifié, `beforeLoad` redirige vers `/indicateurs`

## Module auth (`src/auth.ts`)

```ts
export type AuthUser = { name: string; email: string }

export type Auth = {
  isAuthenticated: boolean
  user: AuthUser | null
  login: () => void
  logout: () => void
}

export const auth: Auth = /* singleton avec lecture/écriture localStorage */
```

- `login()` : stocke un flag + faux user en localStorage, met à jour l'état en mémoire
- `logout()` : efface localStorage + état
- État initialisé au load du module depuis localStorage
- Faux user par défaut : `{ name: 'Marie Curie', email: 'marie@pilote-mb.fr' }`

**Remplacement futur ProConnect :** seule l'implémentation de `auth.ts` change (PKCE flow, token storage). Les routes `beforeLoad` restent identiques.

## API & couche données

### Ajouts dans `mb-shared`

**Factory générique pour les listes paginées :**

```ts
export const createPaginatedAPIListSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      cursor: z.string().nullable(),
      hasMore: z.boolean(),
    }),
    total: z.number(),
  })

export type PaginatedAPIList<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof createPaginatedAPIListSchema<T>>
>
```

**Schéma indicateur API :**

```ts
export const indicateurAPISchema = z.object({
  id: z.number(),
  nom: z.string(),
  valeur: z.number(),
  unite: z.string(),
  statut: z.enum(['actif', 'inactif', 'archive']),
  description: z.string(),
  createdAt: z.string(), // ISO date
  updatedAt: z.string(), // ISO date
})
export type IndicateurAPI = z.infer<typeof indicateurAPISchema>

export const indicateurListAPISchema = createPaginatedAPIListSchema(indicateurAPISchema)
```

### Ajouts dans `mb-api`

Nouveau domaine `src/indicateur/` :
- `routes/getIndicateurs.ts` → `GET /indicateurs?recherche&statut&cursor` retourne `PaginatedAPIList<IndicateurAPI>`
- `routes/getIndicateurById.ts` → `GET /indicateurs/:id` retourne `IndicateurAPI` ou 404
- Données : tableau hardcodé d'environ 8 indicateurs (pas de DB pour cette itération)
- Routes OpenAPI cohérentes avec le pattern existant (`@hono/zod-openapi`, `jsonResponse`)

### Couche client (mb-webapp)

**`src/api/indicateurs.ts` :**

```ts
export const fetchIndicateurs = async (params): Promise<IndicateurListAPI> => {
  const json = await apiClient.get('indicateurs', { searchParams }).json()
  return indicateurListAPISchema.parse(json)
}

export const fetchIndicateurById = async (id: number): Promise<IndicateurAPI> => {
  const json = await apiClient.get(`indicateurs/${id}`).json()
  return indicateurAPISchema.parse(json)
}
```

**`src/queries/indicateurs.ts` (queryOptions factories) :**

```ts
export const indicateursQueryOptions = (params) => queryOptions({
  queryKey: ['indicateurs', params],
  queryFn: () => fetchIndicateurs(params),
})

export const indicateurQueryOptions = (id: number) => queryOptions({
  queryKey: ['indicateur', id],
  queryFn: () => fetchIndicateurById(id),
})
```

> Le wrapper utilitaire `createPaginatedQuery` côté webapp est différé à une itération ultérieure.

## Démos par page

Chaque page intègre un panneau **"Diagnostic TanStack Router"** (style App.tsx actuel) qui prouve que les features fonctionnent.

### `/` — Home (publique)
- Titre + intro Pilote MB
- **Conserve la démo `shared-message`** existante d'App.tsx (`useQuery` qui affiche `SHARED_GREETING` + le message API) pour valider que TanStack Query continue de fonctionner sous TanStack Router
- Boutons nav : "Voir les indicateurs", "Se connecter / Se déconnecter"
- Diagnostic : version `@tanstack/react-router`, état `auth.isAuthenticated`, info "✓ Router initialisé"

### `/login` — Login (publique)
- Bouton "Se connecter" → `auth.login()` puis `navigate({ to: search.redirect ?? '/indicateurs' })`
- Si déjà authentifié : `redirect()` dans `beforeLoad` → `/indicateurs`
- Affiche le faux user qui sera créé
- Diagnostic : "✓ beforeLoad redirect fonctionnel"

### `/indicateurs` — Liste (protégée)
- **Search params validés Zod** :
  ```ts
  validateSearch: z.object({
    recherche: z.string().optional(),
    statut: z.enum(['actif', 'inactif', 'archive']).optional(),
    cursor: z.string().optional(),
  })
  ```
- Filtres bindés aux search params (input recherche, select statut)
- Pagination cursor (bouton "Page suivante" met à jour `cursor`)
- **Loader** : `({ context, deps }) => context.queryClient.ensureQueryData(indicateursQueryOptions(deps))`
- `loaderDeps: ({ search }) => search`
- **Composant** : `useSuspenseQuery(indicateursQueryOptions(search))`
- `pendingComponent` : skeleton pendant le chargement initial
- `errorComponent` : message d'erreur + bouton retry
- Bouton "🐛 Forcer une erreur" → set un search param invalide via navigate
- Diagnostic : valeurs des search params parsées, "✓ Loader exécuté", "🔒 Authentifié as ${user.name}"

### `/indicateurs/$id` — Détail (protégée)
- Param `$id` typé : `params: { parse: z.object({ id: z.coerce.number() }) }`
- Card détail avec tous les champs de l'`IndicateurAPI`
- Loader : `ensureQueryData(indicateurQueryOptions(id))`
- `errorComponent` gère le 404 ("Indicateur introuvable" + lien retour)
- Lien "← Retour à la liste" qui préserve les search params via `<Link to="/indicateurs" search={(prev) => prev}>`
- Diagnostic : "✓ Route param `id` typé number", "✓ Loader détail exécuté"

### `__root.tsx` — Layout global
- Header : nom du user authentifié + bouton "Se déconnecter"
- `<Outlet />` pour le contenu des routes enfants
- `<TanStackRouterDevtools />` (dev only) en overlay
- `<ReactQueryDevtools />` existants conservés

## Tests

- Tests existants (App.test.tsx) à adapter au nouveau bootstrap (router au lieu d'App direct)
- Smoke tests :
  - Render de la home + nav vers `/login`
  - `auth.login()` puis nav vers `/indicateurs` (vérifie que le guard ne bloque pas)
  - Tentative d'accès à `/indicateurs` sans auth → redirect `/login`
- Pas de tests E2E dans cette itération (suffisant pour valider l'archi)

## Hors-scope

- ProConnect (auth réelle) — viendra dans une itération dédiée
- Persistance des indicateurs en DB (Prisma) — données hardcodées suffisent
- Wrapper `createPaginatedQuery` côté webapp — itération ultérieure
- TanStack DB — à réévaluer si un sync engine est intégré
- View transitions API — n'apporte rien à ce stade
- Scroll restoration custom — défaut TanStack Router suffit
- Tests E2E des flows nav/auth — itération ultérieure

## Structure de fichiers cible

```
apps/mb-webapp/
├── src/
│   ├── auth.ts                          # NEW
│   ├── main.tsx                         # MODIFIÉ : RouterProvider
│   ├── App.tsx                          # SUPPRIMÉ (remplacé par routes)
│   ├── api/
│   │   ├── client.ts                    # existant
│   │   ├── sharedMessage.ts             # existant
│   │   └── indicateurs.ts               # NEW
│   ├── queries/
│   │   └── indicateurs.ts               # NEW
│   ├── routes/                          # NEW (file-based)
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── _authenticated.tsx
│   │   └── _authenticated/
│   │       └── indicateurs/
│   │           ├── index.tsx
│   │           └── $id.tsx
│   └── routeTree.gen.ts                 # AUTO-GÉNÉRÉ (gitignored)

apps/mb-api/
└── src/
    └── indicateur/                      # NEW
        ├── data/indicateursFixtures.ts
        └── routes/
            ├── getIndicateurs.ts
            └── getIndicateurById.ts

packages/mb-shared/
└── src/index.ts                         # MODIFIÉ : ajout indicateurAPISchema, createPaginatedAPIListSchema
```
