import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { analytics } from '@/analytics'
import { auth } from '@/auth'
import { ImportModalProvider } from '@/components/import-valeurs/ImportModalProvider'
import { ToastProvider } from '@pilote/kpilote-ui/Toast'
import '@/index.css'
import { routeTree } from '@/routeTree.gen'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found in index.html')
}

const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  context: { queryClient, auth },
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const motifDeRoute = (): string => {
  const matches = router.state.matches
  const derniere = matches[matches.length - 1]
  if (!derniere || derniere.routeId === '__root__') return '/'
  return derniere.routeId.replace(/\/_[^/]+/g, '') || '/'
}

router.subscribe('onResolved', () => {
  analytics.trackPageView({ path: motifDeRoute(), title: document.title })
})

const root = createRoot(rootElement)

void auth.bootstrap().then(() => {
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ImportModalProvider>
            <RouterProvider router={router} />
          </ImportModalProvider>
        </ToastProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
})
