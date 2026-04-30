import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Auth, AuthUser } from '@/auth'
import { tokenStore } from '@/auth/tokenStore'
import { routeTree } from '@/routeTree.gen'

const stubAuth = (user: AuthUser | null): Auth => ({
  get isAuthenticated() {
    return user !== null
  },
  get user() {
    return user
  },
  bootstrap: vi.fn(() => Promise.resolve()),
  login: vi.fn(),
  logout: vi.fn(() => Promise.resolve()),
})

const renderAt = (initialPath: string, authImpl: Auth) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createRouter({
    routeTree,
    context: { queryClient, auth: authImpl },
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
    tokenStore.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("rend la page d'accueil", async () => {
    renderAt('/', stubAuth(null))
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Pilote MB' }),
      ).toBeInTheDocument()
    })
  })

  it('redirige vers /login quand on accède à /indicateurs sans être authentifié', async () => {
    renderAt('/indicateurs', stubAuth(null))
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Connexion' }),
      ).toBeInTheDocument()
    })
  })

  it("permet d'accéder à /indicateurs après login", async () => {
    renderAt('/indicateurs', stubAuth({ id: 'sub-1' }))
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Indicateurs' }),
      ).toBeInTheDocument()
    })
  })
})
