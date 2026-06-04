import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { LogOut } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import { Marianne } from '@/components/ui/Marianne'
import { Text } from '@/components/ui/Typography'
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
            <NavLink to="/indicateurs">Indicateurs</NavLink>
            <NavLink to="/paniers">Paniers</NavLink>

            <div className="mx-2 hidden h-6 w-px bg-border sm:block" />

            {auth.isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Text as="span" variant="caption" tone="muted" className="hidden sm:inline">
                  {auth.user?.prenom} {auth.user?.nom}
                </Text>
                <Button
                  variant="tertiary"
                  size="sm"
                  type="button"
                  onClick={() => {
                    void auth.logout()
                  }}
                >
                  <LogOut /> Se déconnecter
                </Button>
              </div>
            ) : (
              <Button size="sm" type="button" onClick={() => auth.login()}>
                Se connecter
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
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

      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </div>
  )
}

function NavLink({ to, children }: { to: '/indicateurs' | '/paniers'; children: ReactNode }) {
  return (
    <Link
      to={to}
      search={{}}
      className="rounded-md px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-tinted hover:text-primary data-[status=active]:bg-primary-tinted data-[status=active]:text-primary"
      activeProps={{ 'data-status': 'active' }}
    >
      {children}
    </Link>
  )
}
