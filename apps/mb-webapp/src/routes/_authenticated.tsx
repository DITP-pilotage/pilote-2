import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      const hash = location.hash ? `#${location.hash}` : ''
      throw redirect({
        to: '/login',
        search: {
          redirect: `${location.pathname}${location.searchStr}${hash}`,
        },
      })
    }
  },
  component: () => <Outlet />,
})
