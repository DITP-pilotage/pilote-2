import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

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
