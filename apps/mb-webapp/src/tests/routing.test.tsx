import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { auth } from '@/auth'
import { routeTree } from '@/routeTree.gen'

const renderAt = (initialPath: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createRouter({
    routeTree,
    context: { queryClient, auth },
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('routing', () => {
  beforeEach(() => {
    localStorage.clear()
    auth.logout()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it("rend la page d'accueil", async () => {
    renderAt('/')
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Pilote MB' }),
      ).toBeInTheDocument()
    })
  })

  it("redirige vers /login quand on accède à /indicateurs sans être authentifié", async () => {
    renderAt('/indicateurs')
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Connexion' }),
      ).toBeInTheDocument()
    })
  })

  it("permet d'accéder à /indicateurs après login", async () => {
    auth.login()
    renderAt('/indicateurs')
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Indicateurs' }),
      ).toBeInTheDocument()
    })
  })
})
