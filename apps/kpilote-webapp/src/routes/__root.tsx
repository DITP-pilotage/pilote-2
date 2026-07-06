import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useSearch,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { CommandPalette } from '@/components/command-palette/CommandPalette'
import { UserMenu } from '@/components/UserMenu'
import { Button } from '@/components/ui/Button'
import { Marianne } from '@/components/ui/Marianne'
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
  const navigate = useNavigate()
  const [paletteOpen, setPaletteOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-3 sm:px-10">
          <Link
            to="/"
            className="flex items-stretch gap-5 transition-opacity hover:opacity-80"
            aria-label="Accueil Pilote"
          >
            <Marianne />
            <span className="hidden w-px bg-border sm:block" aria-hidden />
            <span className="hidden flex-col justify-center gap-0.5 sm:flex">
              <span className="text-xl font-bold uppercase leading-none tracking-tight text-text">
                Pilote
              </span>
              <span className="text-sm font-normal text-text-muted">
                Piloter l'action publique par les résultats
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {auth.isAuthenticated ? (
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                aria-label="Ouvrir la recherche"
                className="hidden items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-subtle transition-colors hover:border-border-strong hover:text-text sm:flex"
              >
                <Search className="size-4" />
                <span>Rechercher…</span>
                <kbd className="ml-4 rounded border border-border bg-surface-tinted px-1.5 py-0.5 font-mono text-[10px] font-medium text-text-muted">
                  ⌘K
                </kbd>
              </button>
            ) : null}

            <NavLink>Tableau de bord</NavLink>

            <div className="mx-2 hidden h-6 w-px bg-border sm:block" />

            {auth.isAuthenticated && auth.user ? (
              <UserMenu
                user={auth.user}
                onLogout={() => {
                  void auth.logout()
                }}
              />
            ) : (
              <Button size="sm" type="button" onClick={() => void navigate({ to: '/login' })}>
                Se connecter
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-6 sm:px-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface-tinted">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <span>Pilote — République Française</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span>Accessibilité</span>
            <span>Mentions légales</span>
            <span>Données personnelles</span>
          </div>
        </div>
      </footer>

      {auth.isAuthenticated ? (
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      ) : null}

      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </div>
  )
}

function NavLink({ children }: { children: ReactNode }) {
  const search = useSearch({ strict: false })
  const { pathname } = useLocation()
  const isActive = pathname.startsWith('/indicateurs') || pathname.startsWith('/paniers')
  return (
    <Link
      to="/indicateurs"
      search={{ individu: search.individu, referentiel: search.referentiel }}
      data-status={isActive ? 'active' : undefined}
      className="rounded-md px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-tinted hover:text-primary data-[status=active]:bg-primary-tinted data-[status=active]:text-primary"
    >
      {children}
    </Link>
  )
}
