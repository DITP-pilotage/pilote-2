import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { loadAllIndicateurs } from '@/queries/indicateurs'
import { loadMeFeature } from '@/queries/meFeature'
import { loadMePermissions } from '@/queries/mePermissions'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      const hash = location.hash ? `#${location.hash}` : ''
      const target = `${location.pathname}${location.searchStr}${hash}`
      throw redirect({ to: '/login', search: { redirect: target } })
    }
  },
  loader: ({ context }) =>
    Promise.all([
      loadMePermissions({ queryClient: context.queryClient }),
      loadMeFeature({ queryClient: context.queryClient }),
      loadAllIndicateurs({ queryClient: context.queryClient }),
    ]),
  component: () => <Outlet />,
})
