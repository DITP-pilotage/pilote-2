import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { auth } from '@/auth'
import { tokenStore } from '@/auth/tokenStore'

const meResponse = (id: string) =>
  new Response(JSON.stringify({ id, source: 'jwt' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

const refreshResponse = (token: string) =>
  new Response(JSON.stringify({ accessToken: token, expiresIn: 60 }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

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

  it('bootstrap() leaves the user anonymous when refresh fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
    )

    await auth.bootstrap()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
    expect(tokenStore.get()).toBeNull()
  })

  it('bootstrap() authenticates the user when refresh + me succeed', async () => {
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url
      if (url.endsWith('/auth/refresh')) {
        return Promise.resolve(refreshResponse('access-1'))
      }
      return Promise.resolve(meResponse('sub-123'))
    })
    vi.stubGlobal('fetch', fetchMock)

    await auth.bootstrap()

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user).toEqual({ id: 'sub-123' })
    expect(tokenStore.get()).toBe('access-1')
  })
})
