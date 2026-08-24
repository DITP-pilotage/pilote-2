import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { HTTPError } from 'ky'
import { createRoot } from 'react-dom/client'

import type { AnalyticsEvent } from '@pilote/kpilote-shared/analytics'
import { analyticsEvents } from '@pilote/kpilote-shared/analytics'

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

type AnalyticsMutationMeta = Record<string, unknown> & {
  analyticsName?: string
  analyticsSuccess?: AnalyticsEvent
}

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: AnalyticsMutationMeta
  }
}

const statutErreur = (error: unknown): string =>
  error instanceof HTTPError ? String(error.response.status) : 'network'

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _onMutateResult, mutation) => {
      try {
        const event = mutation.meta?.analyticsSuccess
        if (event) analytics.trackEvent(event)
      } catch {
        // L'analytics ne peut pas casser une mutation.
      }
    },
    onError: (error, _variables, _onMutateResult, mutation) => {
      try {
        analytics.trackEvent(
          analyticsEvents.error.mutation({
            mutation: mutation.meta?.analyticsName ?? 'inconnue',
            status: statutErreur(error),
          }),
        )
      } catch {
        // L'analytics ne peut pas casser une mutation.
      }
    },
  }),
})

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
