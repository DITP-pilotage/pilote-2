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

  it('ne rend pas /indicateurs sans être authentifié (le beforeLoad bloque le rendu)', async () => {
    renderAt('/indicateurs', stubAuth(null))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(
      screen.queryByRole('heading', { level: 1, name: 'Indicateurs' }),
    ).toBeNull()
  })

  it("permet d'accéder à /indicateurs après login", async () => {
    renderAt('/indicateurs', stubAuth({ prenom: 'Admin', nom: 'DITP' }))
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Indicateurs' }),
      ).toBeInTheDocument()
    })
  })
})
