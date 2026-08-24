# Composant Button (Radix Slot) + thème Tailwind sémantique — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduire un composant `<Button>` réutilisable (Radix Slot + cva) et un thème Tailwind sémantique (`primary`, `secondary`, `tertiary`, `disabled`, ...) dans `mb-webapp`, puis migrer les 6 usages de boutons existants.

**Architecture:** Composant `Button` headless basé sur `@radix-ui/react-slot` (pour `asChild`), variants typés via `class-variance-authority`, classes fusionnées via helper `cn()` (clsx + tailwind-merge). Tokens de couleurs définis dans `src/index.css` via la directive `@theme` de Tailwind 4 — les variables CSS deviennent automatiquement des classes utilitaires (`bg-primary`, `text-text-muted`, etc.).

**Tech Stack:** React 19, Tailwind 4 (CSS-first config), TanStack Router, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`.

**Spec:** `docs/superpowers/specs/2026-05-06-mb-webapp-button-radix-design.md`

**Conventions de commit (préférences user) :**
- **Pas de Co-Authored-By** dans les messages.
- **`pnpm --filter @pilote/mb-webapp lint` doit passer avant chaque commit.**
- Utiliser le skill `commit-billable` pour créer les commits enrichis (client/projet/catégorie/tags).

---

## File Structure

**Créés :**
- `apps/mb-webapp/src/lib/cn.ts` — helper `cn()` (clsx + twMerge), réutilisable par tous les futurs composants UI.
- `apps/mb-webapp/src/components/ui/Button.tsx` — composant `Button` + `buttonVariants` (cva).

**Modifiés :**
- `apps/mb-webapp/package.json` — ajout des dépendances.
- `apps/mb-webapp/src/index.css` — ajout du bloc `@theme`.
- `apps/mb-webapp/src/routes/__root.tsx` — migration boutons header.
- `apps/mb-webapp/src/routes/index.tsx` — migration `<Link>` "Voir les indicateurs" + bouton "Se connecter".
- `apps/mb-webapp/src/routes/login-error.tsx` — migration bouton "Se déconnecter" (harmonisation gray→tokens).
- `apps/mb-webapp/src/routes/_authenticated/indicateurs/index.tsx` — migration bouton "Page suivante".

---

## Task 1: Installer les dépendances

**Files:**
- Modify: `apps/mb-webapp/package.json` (via pnpm)

- [ ] **Step 1: Ajouter les dépendances runtime**

Run depuis la racine du repo :
```bash
pnpm --filter @pilote/mb-webapp add @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react
```

Expected: les 5 packages sont ajoutés à `dependencies` dans `apps/mb-webapp/package.json`, et `pnpm-lock.yaml` est mis à jour.

- [ ] **Step 2: Vérifier**

Run :
```bash
grep -E '@radix-ui/react-slot|class-variance-authority|clsx|tailwind-merge|lucide-react' apps/mb-webapp/package.json
```

Expected: les 5 lignes apparaissent dans la sortie.

---

## Task 2: Définir les tokens sémantiques dans `index.css`

**Files:**
- Modify: `apps/mb-webapp/src/index.css`

- [ ] **Step 1: Remplacer le contenu du fichier**

Le fichier actuel ne contient que `@import 'tailwindcss';`. On ajoute le bloc `@theme` qui injecte des variables CSS reconnues par Tailwind 4 et exposées comme classes utilitaires (`bg-primary`, `text-primary`, `border-primary`, etc.).

Contenu complet de `apps/mb-webapp/src/index.css` :

```css
@import 'tailwindcss';

@theme {
  /* Surfaces / texte généraux */
  --color-background: var(--color-slate-50);
  --color-surface: #fff;
  --color-border: var(--color-slate-200);
  --color-text: var(--color-slate-900);
  --color-text-muted: var(--color-slate-600);

  /* Action primary — CTA principal */
  --color-primary: var(--color-slate-900);
  --color-primary-hover: var(--color-slate-700);
  --color-primary-foreground: #fff;

  /* Action secondary — bouton outline / action secondaire */
  --color-secondary: #fff;
  --color-secondary-hover: var(--color-slate-100);
  --color-secondary-foreground: var(--color-slate-700);
  --color-secondary-border: var(--color-slate-300);

  /* Action tertiary — ghost (pas de fond, hover discret) */
  --color-tertiary-hover: var(--color-slate-100);
  --color-tertiary-foreground: var(--color-slate-700);

  /* État disabled — commun à tous les variants */
  --color-disabled: var(--color-slate-200);
  --color-disabled-foreground: var(--color-slate-400);
}
```

---

## Task 3: Créer le helper `cn()`

**Files:**
- Create: `apps/mb-webapp/src/lib/cn.ts`

- [ ] **Step 1: Créer le dossier et le fichier**

Run :
```bash
mkdir -p apps/mb-webapp/src/lib
```

- [ ] **Step 2: Écrire le helper**

Contenu de `apps/mb-webapp/src/lib/cn.ts` :

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

---

## Task 4: Créer le composant `Button`

**Files:**
- Create: `apps/mb-webapp/src/components/ui/Button.tsx`

- [ ] **Step 1: Créer le dossier**

Run :
```bash
mkdir -p apps/mb-webapp/src/components/ui
```

- [ ] **Step 2: Écrire le composant**

React 19 supporte `ref` comme prop standard, donc pas besoin de `forwardRef`. Le composant utilise `Slot` de Radix pour le pattern `asChild` (qui rend le bouton polymorphe — ex. `<Button asChild><Link/></Button>` rend juste le `<Link/>` enrichi des classes/props du Button).

Contenu de `apps/mb-webapp/src/components/ui/Button.tsx` :

```tsx
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes, Ref } from 'react'

import { cn } from '@/lib/cn'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded font-medium',
    'transition-colors',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    'disabled:bg-disabled disabled:text-disabled-foreground disabled:border-disabled disabled:cursor-not-allowed disabled:hover:bg-disabled',
    '[&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary:
          'bg-secondary text-secondary-foreground border border-secondary-border hover:bg-secondary-hover',
        tertiary: 'text-tertiary-foreground hover:bg-tertiary-hover',
      },
      size: {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    ref?: Ref<HTMLButtonElement>
  }

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ref,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { buttonVariants }
```

- [ ] **Step 3: Lint pour valider que tout compile**

Run :
```bash
pnpm --filter @pilote/mb-webapp lint
```

Expected: PASS (pas d'erreur ESLint ni TS sur les nouveaux fichiers).

Si KO sur `disabled:border-disabled` (Tailwind ne génère cette classe que si on a `--color-disabled` reconnue) : vérifier que la Task 2 a été appliquée et que `index.css` est bien importé via `main.tsx`.

---

## Task 5: Commit du composant Button + thème

- [ ] **Step 1: Stage et commit**

Utiliser le skill `commit-billable` (ne pas générer le `Co-Authored-By`). Fichiers à inclure :
- `apps/mb-webapp/package.json`
- `pnpm-lock.yaml`
- `apps/mb-webapp/src/index.css`
- `apps/mb-webapp/src/lib/cn.ts`
- `apps/mb-webapp/src/components/ui/Button.tsx`

Message : `feat(mb-webapp): composant Button (Radix Slot + cva) et thème Tailwind sémantique`

- [ ] **Step 2: Vérifier**

Run :
```bash
git log -1 --stat
```

Expected: les 5 fichiers ci-dessus apparaissent dans le commit, pas de Co-Authored-By dans le message.

---

## Task 6: Migrer `__root.tsx` (header global)

**Files:**
- Modify: `apps/mb-webapp/src/routes/__root.tsx`

Le header contient deux boutons (logout / login) et utilise `bg-slate-50`, `border-slate-200`, `text-slate-600`, `bg-white`. On migre les boutons vers `<Button>` et les couleurs neutres ad-hoc vers les tokens.

- [ ] **Step 1: Remplacer le contenu**

Contenu complet de `apps/mb-webapp/src/routes/__root.tsx` :

```tsx
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { Button } from '@/components/ui/Button'
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
    <div className="min-h-screen bg-background text-text">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link
            to="/"
            className="text-lg font-semibold text-text hover:text-text-muted"
          >
            Pilote MB
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/indicateurs"
              search={{}}
              className="text-secondary-foreground hover:text-text"
            >
              Indicateurs
            </Link>
            {auth.isAuthenticated ? (
              <span className="flex items-center gap-2">
                <span className="text-text-muted">{auth.user?.id}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => {
                    void auth.logout()
                  }}
                >
                  Se déconnecter
                </Button>
              </span>
            ) : (
              <Button size="sm" type="button" onClick={() => auth.login()}>
                Se connecter
              </Button>
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

- [ ] **Step 2: Lint**

Run :
```bash
pnpm --filter @pilote/mb-webapp lint
```

Expected: PASS.

---

## Task 7: Migrer `index.tsx` (page d'accueil)

**Files:**
- Modify: `apps/mb-webapp/src/routes/index.tsx`

Cette page contient :
- Un `<Link>` "Voir les indicateurs" stylé en bouton primary → devient `<Button asChild>`.
- Un `<button>` "Se connecter" en outline → devient `<Button variant="secondary">`.

Les zones diagnostic (`bg-slate-900`, `bg-slate-100` pour les `<pre>`) ne sont **pas** migrées (rôle non-sémantique).

- [ ] **Step 1: Remplacer le contenu**

Contenu complet de `apps/mb-webapp/src/routes/index.tsx` :

```tsx
import { SHARED_GREETING } from '@pilote/mb-shared'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { fetchSharedMessage } from '@/api/sharedMessage'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const { auth } = Route.useRouteContext()
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['shared-message'],
    queryFn: fetchSharedMessage,
  })

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-semibold tracking-tight">Pilote MB</h1>
        <p className="mt-3 text-text-muted">
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
        <ul className="rounded border border-border bg-surface p-4 text-sm">
          <li>✓ Router initialisé</li>
          <li>
            État auth : <strong>{auth.isAuthenticated ? 'authentifié' : 'anonyme'}</strong>
          </li>
        </ul>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/indicateurs" search={{}}>
              Voir les indicateurs
            </Link>
          </Button>
          {!auth.isAuthenticated && (
            <Button variant="secondary" type="button" onClick={() => auth.login()}>
              Se connecter
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Lint**

Run :
```bash
pnpm --filter @pilote/mb-webapp lint
```

Expected: PASS.

---

## Task 8: Migrer `login-error.tsx`

**Files:**
- Modify: `apps/mb-webapp/src/routes/login-error.tsx`

Le bouton actuel utilise `gray-900` au lieu de `slate-*` et `rounded-md` au lieu de `rounded` — incohérences à harmoniser via les tokens. Le fond de page (`text-gray-900`, `text-gray-700`) bascule aussi sur les tokens car cette page est très simple et le rôle est sémantique (texte principal / muted).

- [ ] **Step 1: Remplacer le contenu**

Contenu complet de `apps/mb-webapp/src/routes/login-error.tsx` :

```tsx
import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/Button'
import { auth } from '@/auth'

export const Route = createFileRoute('/login-error')({
  component: LoginErrorPage,
})

function LoginErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-semibold text-text">Accès refusé</h1>
      <p className="text-text-muted">
        Votre compte n'est pas autorisé à accéder à cette application. Contactez votre
        administrateur si vous pensez qu'il s'agit d'une erreur.
      </p>
      <Button
        type="button"
        onClick={() => {
          void auth.logout()
        }}
      >
        Se déconnecter
      </Button>
    </main>
  )
}
```

- [ ] **Step 2: Lint**

Run :
```bash
pnpm --filter @pilote/mb-webapp lint
```

Expected: PASS.

---

## Task 9: Migrer `indicateurs/index.tsx`

**Files:**
- Modify: `apps/mb-webapp/src/routes/_authenticated/indicateurs/index.tsx`

Le bouton "Page suivante" est en outline → `<Button variant="secondary" size="sm">`. La liste utilise `border-slate-200`, `divide-slate-200`, `bg-white`, `hover:bg-slate-50`, `text-slate-500`, `text-slate-900`. On bascule les rôles sémantiques (border, surface, text-muted) sur les tokens. Le `<input>` de recherche est laissé tel quel (pas un bouton, hors scope visuel direct du composant Button mais on bascule la border quand on y est).

Le badge `bg-emerald-100 text-emerald-800` reste tel quel (couleur fonctionnelle non-sémantique). Le panneau de diagnostic (`bg-slate-100`) aussi.

- [ ] **Step 1: Remplacer le contenu**

Contenu complet de `apps/mb-webapp/src/routes/_authenticated/indicateurs/index.tsx` :

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  createFileRoute,
  Link,
  useNavigate,
} from '@tanstack/react-router'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { indicateursQueryOptions } from '@/queries/indicateurs'

const indicateursSearchSchema = z.object({
  recherche: z.string().optional(),
  cursor: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/indicateurs/')({
  validateSearch: indicateursSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.fetchQuery(indicateursQueryOptions(deps)),
  pendingComponent: () => <RouteLoading message="Chargement des indicateurs…" />,
  errorComponent: RouteError,
  component: IndicateursListComponent,
})

function IndicateursListComponent() {
  const { auth } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data } = useSuspenseQuery(indicateursQueryOptions(search))

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Indicateurs</h1>
        <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
          🔒 Authentifié — sub: {auth.user?.id}
        </span>
      </header>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Rechercher par nom…"
          value={search.recherche ?? ''}
          onChange={(e) => {
            const recherche = e.target.value || undefined
            void navigate({ search: (prev) => ({ ...prev, recherche, cursor: undefined }) })
          }}
          className="rounded border border-secondary-border px-3 py-1 text-sm"
        />
      </div>

      <ul className="divide-y divide-border rounded border border-border bg-surface">
        {data.items.map((indicateur) => (
          <li key={indicateur.id}>
            <Link
              to="/indicateurs/$id"
              params={{ id: indicateur.id }}
              className="block px-4 py-3 hover:bg-secondary-hover"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-text">{indicateur.nom}</span>
                <span className="text-xs uppercase tracking-wide text-text-muted">
                  {indicateur.id}
                </span>
              </div>
            </Link>
          </li>
        ))}
        {data.items.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-text-muted">
            Aucun indicateur ne correspond aux filtres.
          </li>
        )}
      </ul>

      {data.pagination.hasMore && data.pagination.cursor && (
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={() => {
            const next = data.pagination.cursor
            if (next) void navigate({ search: (prev) => ({ ...prev, cursor: next }) })
          }}
        >
          Page suivante
        </Button>
      )}

      <section className="rounded border border-border bg-slate-100 p-4 text-sm">
        <p className="font-medium">Diagnostic TanStack Router</p>
        <ul className="mt-2 list-inside list-disc text-secondary-foreground">
          <li>✓ Loader exécuté ({data.total} indicateur(s) chargés)</li>
          <li>
            Search params parsés : <code>{JSON.stringify(search)}</code>
          </li>
          <li>✓ useSuspenseQuery branché</li>
          <li>🔒 Guard _authenticated franchi</li>
        </ul>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Lint**

Run :
```bash
pnpm --filter @pilote/mb-webapp lint
```

Expected: PASS.

---

## Task 10: Vérification visuelle navigateur

- [ ] **Step 1: Démarrer le dev server**

Run depuis la racine du repo, en background :
```bash
pnpm --filter @pilote/mb-webapp dev
```

Attendre que portless affiche l'URL locale.

- [ ] **Step 2: Vérifier les 4 routes**

Ouvrir successivement dans un navigateur :
- `/` (home) — bouton primary "Voir les indicateurs" + bouton secondary "Se connecter" (si déconnecté).
- Header (présent partout) — boutons sm primary "Se connecter" / secondary "Se déconnecter".
- `/login-error` — bouton primary "Se déconnecter".
- `/indicateurs` (auth requis) — bouton secondary sm "Page suivante" si la pagination est active.

Pour chaque page, vérifier :
- Aucun bouton n'a un rendu cassé (taille, couleur, hover).
- Le `<Button asChild>` sur "Voir les indicateurs" navigue **sans full reload** (pas de flash blanc, devtools router se met à jour).
- Pas d'erreur en console.

Si tout est OK, arrêter le dev server.

---

## Task 11: Commit de la migration

- [ ] **Step 1: Lint final global webapp**

Run :
```bash
pnpm --filter @pilote/mb-webapp lint
```

Expected: PASS.

- [ ] **Step 2: Stage et commit**

Utiliser le skill `commit-billable` (sans `Co-Authored-By`). Fichiers à inclure :
- `apps/mb-webapp/src/routes/__root.tsx`
- `apps/mb-webapp/src/routes/index.tsx`
- `apps/mb-webapp/src/routes/login-error.tsx`
- `apps/mb-webapp/src/routes/_authenticated/indicateurs/index.tsx`

Message : `refactor(mb-webapp): migrer les boutons existants vers <Button> et les tokens sémantiques`

- [ ] **Step 3: Vérifier**

Run :
```bash
git log -2 --oneline
```

Expected: les 2 commits `feat(mb-webapp): composant Button...` et `refactor(mb-webapp): migrer les boutons...` apparaissent.
