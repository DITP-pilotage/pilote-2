import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      const hash = location.hash ? `#${location.hash}` : ''
      const target = `${location.pathname}${location.searchStr}${hash}`
      throw redirect({
        href: `/auth/login?redirect=${encodeURIComponent(target)}`,
        reloadDocument: true,
      })
    }
  },
  component: () => <Outlet />,
})
