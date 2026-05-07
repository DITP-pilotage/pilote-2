import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { auth, refreshAccessToken } from '@/auth'
import { tokenStore } from '@/auth/tokenStore'
import { buildMe } from '@/tests/factories/api'
import { buildLogoutResponse, buildRefreshResponse } from '@/tests/factories/bff'
import { apiUrl, bffUrl, server } from '@/tests/server'

describe.sequential('auth singleton', () => {
  beforeEach(() => {
    tokenStore.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts unauthenticated', () => {
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
  })

  describe('bootstrap', () => {
    it('leaves the user anonymous when refresh fails', async () => {
      server.use(http.post(bffUrl('/auth/refresh'), () => new HttpResponse(null, { status: 401 })))

      await auth.bootstrap()

      expect(auth.isAuthenticated).toBe(false)
      expect(auth.user).toBeNull()
      expect(tokenStore.get()).toBeNull()
    })

    it('authenticates the user when refresh + me succeed', async () => {
      server.use(
        http.post(bffUrl('/auth/refresh'), () =>
          HttpResponse.json(buildRefreshResponse({ accessToken: 'access-1' })),
        ),
        http.get(apiUrl('/me'), () =>
          HttpResponse.json(buildMe({ userId: 'sub-123', prenom: 'Admin', nom: 'DITP' })),
        ),
      )

      await auth.bootstrap()

      expect(auth.isAuthenticated).toBe(true)
      expect(auth.user).toEqual({ userId: 'sub-123', prenom: 'Admin', nom: 'DITP' })
      expect(tokenStore.get()).toBe('access-1')
    })
  })

  describe('refreshAccessToken', () => {
    it('coalesces concurrent calls into a single network request', async () => {
      let callCount = 0
      let resolveRequest: (() => void) | undefined
      const gate = new Promise<void>((resolve) => {
        resolveRequest = resolve
      })
      server.use(
        http.post(bffUrl('/auth/refresh'), async () => {
          callCount += 1
          await gate
          return HttpResponse.json(buildRefreshResponse({ accessToken: 'new-token' }))
        }),
      )

      const calls = Promise.all([
        refreshAccessToken(),
        refreshAccessToken(),
        refreshAccessToken(),
      ])

      await vi.waitFor(() => {
        expect(callCount).toBe(1)
      })

      resolveRequest!()
      const tokens = await calls
      expect(tokens).toEqual(['new-token', 'new-token', 'new-token'])
      expect(callCount).toBe(1)
      expect(tokenStore.get()).toBe('new-token')
    })

    it('clears the token and returns null on 401', async () => {
      tokenStore.set('stale')
      server.use(http.post(bffUrl('/auth/refresh'), () => new HttpResponse(null, { status: 401 })))

      const token = await refreshAccessToken()

      expect(token).toBeNull()
      expect(tokenStore.get()).toBeNull()
    })

    it('keeps the token on 5xx (transient server failure)', async () => {
      tokenStore.set('still-valid')
      server.use(http.post(bffUrl('/auth/refresh'), () => new HttpResponse(null, { status: 503 })))

      const token = await refreshAccessToken()

      expect(token).toBeNull()
      expect(tokenStore.get()).toBe('still-valid')
    })

    it('clears the token and returns null when the response is malformed', async () => {
      tokenStore.set('stale')
      server.use(
        http.post(bffUrl('/auth/refresh'), () => HttpResponse.json({ unexpected: 'shape' })),
      )

      const token = await refreshAccessToken()

      expect(token).toBeNull()
      expect(tokenStore.get()).toBeNull()
    })

    it('allows a new refresh after the previous one settles', async () => {
      let callCount = 0
      server.use(
        http.post(bffUrl('/auth/refresh'), () => {
          callCount += 1
          return HttpResponse.json(buildRefreshResponse({ accessToken: 'a' }))
        }),
      )

      await refreshAccessToken()
      await refreshAccessToken()

      expect(callCount).toBe(2)
    })
  })

  describe('login', () => {
    it("redirige vers le BFF /auth/login sans param quand aucun redirect n'est fourni", () => {
      const assignSpy = vi.fn()
      vi.stubGlobal('window', { ...window, location: { assign: assignSpy } })

      auth.login()

      expect(assignSpy).toHaveBeenCalledWith('/auth/login')
    })

    it('passe le param redirect encodé au BFF', () => {
      const assignSpy = vi.fn()
      vi.stubGlobal('window', { ...window, location: { assign: assignSpy } })

      auth.login('/indicateurs?statut=actif')

      expect(assignSpy).toHaveBeenCalledWith(
        `/auth/login?redirect=${encodeURIComponent('/indicateurs?statut=actif')}`,
      )
    })
  })

  describe('logout', () => {
    it('clears state and redirects to the IdP end-session URL', async () => {
      tokenStore.set('whatever')
      server.use(
        http.post(bffUrl('/auth/logout'), () =>
          HttpResponse.json(buildLogoutResponse({ logoutUrl: 'https://idp/end-session' })),
        ),
      )
      const assignSpy = vi.fn()
      vi.stubGlobal('window', { ...window, location: { assign: assignSpy } })

      await auth.logout()

      expect(tokenStore.get()).toBeNull()
      expect(auth.user).toBeNull()
      expect(assignSpy).toHaveBeenCalledWith('https://idp/end-session')
    })

    it('falls back to "/" when the BFF logout call fails', async () => {
      tokenStore.set('whatever')
      server.use(http.post(bffUrl('/auth/logout'), () => new HttpResponse(null, { status: 500 })))
      const assignSpy = vi.fn()
      vi.stubGlobal('window', { ...window, location: { assign: assignSpy } })

      await auth.logout()

      expect(tokenStore.get()).toBeNull()
      expect(assignSpy).toHaveBeenCalledWith('/')
    })
  })
})
