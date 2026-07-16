import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'

import { AdminHeader } from '@/components/AdminHeader'
import { AppConfigProvider } from '@/context/AppConfigContext'
import type { SessionStore } from '@/session'

export type RouterContext = { queryClient: QueryClient; session: SessionStore }

export const Route = createRootRouteWithContext<RouterContext>()({ component: RootComponent })

function RootComponent() {
  const { session } = Route.useRouteContext()
  const environment = session.current?.environment ?? null
  return (
    <AppConfigProvider environment={environment}>
      <div className="flex min-h-screen flex-col bg-background text-text">
        <AdminHeader
          session={session.current}
          onLogout={() => {
            void session.logout().then(() => {
              window.location.assign('/')
            })
          }}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 sm:px-8 sm:py-10">
          <Outlet />
        </main>
      </div>
    </AppConfigProvider>
  )
}
