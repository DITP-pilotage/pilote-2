import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { ToastProvider } from '@/components/ui/Toast'
import '@/index.css'
import { routeTree } from '@/routeTree.gen'
import { session } from '@/session'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root introuvable')

const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  context: { queryClient, session },
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const root = createRoot(rootElement)
void session.bootstrap().then(() => {
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
})
