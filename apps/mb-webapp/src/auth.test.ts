import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { auth, refreshAccessToken } from '@/auth'
import { tokenStore } from '@/auth/tokenStore'

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

const meBody = (userId: string) => ({ userId, source: 'jwt' })
const refreshBody = (token: string) => ({ accessToken: token, expiresIn: 60 })
const logoutBody = (logoutUrl: string | null) => ({ logoutUrl })

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
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
      )

      await auth.bootstrap()

      expect(auth.isAuthenticated).toBe(false)
      expect(auth.user).toBeNull()
      expect(tokenStore.get()).toBeNull()
    })

    it('authenticates the user when refresh + me succeed', async () => {
      const fetchMock = vi.fn<typeof fetch>((input) => {
        const url = input instanceof Request ? input.url : String(input)
        if (url.endsWith('/auth/refresh')) {
          return Promise.resolve(jsonResponse(refreshBody('access-1')))
        }
        return Promise.resolve(jsonResponse(meBody('sub-123')))
      })
      vi.stubGlobal('fetch', fetchMock)

      await auth.bootstrap()

      expect(auth.isAuthenticated).toBe(true)
      expect(auth.user).toEqual({ id: 'sub-123' })
      expect(tokenStore.get()).toBe('access-1')
    })
  })

  describe('refreshAccessToken', () => {
    it('coalesces concurrent calls into a single network request', async () => {
      let resolveRequest: ((value: Response) => void) | undefined
      const fetchSpy = vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveRequest = resolve
          }),
      )
      vi.stubGlobal('fetch', fetchSpy)

      const calls = Promise.all([
        refreshAccessToken(),
        refreshAccessToken(),
        refreshAccessToken(),
      ])

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1)
      })

      resolveRequest!(jsonResponse(refreshBody('new-token')))

      const tokens = await calls
      expect(tokens).toEqual(['new-token', 'new-token', 'new-token'])
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(tokenStore.get()).toBe('new-token')
    })

    it('clears the token and returns null on 401', async () => {
      tokenStore.set('stale')
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
      )

      const token = await refreshAccessToken()
      expect(token).toBeNull()
      expect(tokenStore.get()).toBeNull()
    })

    it('keeps the token on 5xx (transient server failure)', async () => {
      tokenStore.set('still-valid')
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(new Response(null, { status: 503 }))),
      )

      const token = await refreshAccessToken()
      expect(token).toBeNull()
      expect(tokenStore.get()).toBe('still-valid')
    })

    it('clears the token and returns null when the response is malformed', async () => {
      tokenStore.set('stale')
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(jsonResponse({ unexpected: 'shape' }))),
      )

      const token = await refreshAccessToken()
      expect(token).toBeNull()
      expect(tokenStore.get()).toBeNull()
    })

    it('allows a new refresh after the previous one settles', async () => {
      const fetchSpy = vi.fn(() => Promise.resolve(jsonResponse(refreshBody('a'))))
      vi.stubGlobal('fetch', fetchSpy)

      await refreshAccessToken()
      await refreshAccessToken()
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('logout', () => {
    it('clears state and redirects to the IdP end-session URL', async () => {
      tokenStore.set('whatever')
      const fetchSpy = vi.fn(() =>
        Promise.resolve(jsonResponse(logoutBody('https://idp/end-session'))),
      )
      vi.stubGlobal('fetch', fetchSpy)
      const assignSpy = vi.fn()
      vi.stubGlobal('window', { ...window, location: { assign: assignSpy } })

      await auth.logout()

      expect(tokenStore.get()).toBeNull()
      expect(auth.user).toBeNull()
      expect(assignSpy).toHaveBeenCalledWith('https://idp/end-session')
    })

    it('falls back to "/" when the BFF logout call fails', async () => {
      tokenStore.set('whatever')
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(new Response(null, { status: 500 }))),
      )
      const assignSpy = vi.fn()
      vi.stubGlobal('window', { ...window, location: { assign: assignSpy } })

      await auth.logout()

      expect(tokenStore.get()).toBeNull()
      expect(assignSpy).toHaveBeenCalledWith('/')
    })
  })
})
