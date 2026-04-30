import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { refreshAccessToken } from '@/auth/refresh'
import { tokenStore } from '@/auth/tokenStore'

describe.sequential('refreshAccessToken', () => {
  beforeEach(() => {
    tokenStore.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('coalesces concurrent calls into a single network request', async () => {
    let resolveRequest: ((value: Response) => void) | undefined
    const fetchSpy = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve
        }),
    )
    vi.stubGlobal('fetch', fetchSpy)

    const calls = [refreshAccessToken(), refreshAccessToken(), refreshAccessToken()]
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    resolveRequest!(
      new Response(JSON.stringify({ accessToken: 'new-token', expiresIn: 60 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const tokens = await Promise.all(calls)
    expect(tokens).toEqual(['new-token', 'new-token', 'new-token'])
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

  it('clears the token and returns null when the response is malformed', async () => {
    tokenStore.set('stale')
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ unexpected: 'shape' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        ),
      ),
    )

    const token = await refreshAccessToken()
    expect(token).toBeNull()
    expect(tokenStore.get()).toBeNull()
  })

  it('allows a new refresh after the previous one settles', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ accessToken: 'a', expiresIn: 60 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchSpy)

    await refreshAccessToken()
    await refreshAccessToken()
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})
