import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { LogOut } from 'lucide-react'

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
          <Link to="/" className="text-lg font-semibold text-text hover:text-text-muted">
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
            <Link to="/paniers" search={{}} className="text-secondary-foreground hover:text-text">
              Paniers
            </Link>
            {auth.isAuthenticated ? (
              <span className="flex items-center gap-2">
                <span className="text-text-muted">
                  {auth.user?.prenom} {auth.user?.nom}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => {
                    void auth.logout()
                  }}
                >
                  <LogOut /> Se déconnecter
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
