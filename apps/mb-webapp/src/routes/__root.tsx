import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  Link,
  Outlet,
  useNavigate,
  useRouter,
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
  const navigate = useNavigate()
  const router = useRouter()

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
                    void router.invalidate()
                    void navigate({ to: '/' })
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
