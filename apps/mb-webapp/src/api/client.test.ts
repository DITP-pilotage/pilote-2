import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient, isApiOrigin } from '@/api/client'
import { tokenStore } from '@/auth/tokenStore'
import { env } from '@/env'

const okJsonResponse = () =>
  new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

const refreshOkResponse = (token: string) =>
  new Response(JSON.stringify({ accessToken: token, expiresIn: 60 }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

describe('isApiOrigin', () => {
  const apiUrl = new URL(env.apiUrl)

  it('returns true for URLs on the API origin', () => {
    expect(isApiOrigin(`${apiUrl.origin}/me`)).toBe(true)
    expect(isApiOrigin(`${apiUrl.origin}/anything?x=1`)).toBe(true)
  })

  it('returns false for foreign origins', () => {
    expect(isApiOrigin('https://evil.example.com/steal')).toBe(false)
    expect(isApiOrigin('http://localhost:9999/x')).toBe(false)
  })

  it('returns false for invalid URLs', () => {
    expect(isApiOrigin('not-a-url')).toBe(false)
  })
})

describe.sequential('apiClient beforeRequest', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    tokenStore.clear()
  })

  it('attaches the Authorization header on requests to the API origin', async () => {
    tokenStore.set('test-access-token')
    const fetchSpy = vi.fn<typeof fetch>(() => Promise.resolve(okJsonResponse()))
    vi.stubGlobal('fetch', fetchSpy)

    await apiClient.get('me')

    const request = fetchSpy.mock.calls[0]![0] as Request
    expect(new URL(request.url).origin).toBe(new URL(env.apiUrl).origin)
    expect(request.headers.get('Authorization')).toBe('Bearer test-access-token')
  })

  it('does not attach the Authorization header when no token is stored', async () => {
    const fetchSpy = vi.fn<typeof fetch>(() => Promise.resolve(okJsonResponse()))
    vi.stubGlobal('fetch', fetchSpy)

    await apiClient.get('me')

    const request = fetchSpy.mock.calls[0]![0] as Request
    expect(request.headers.get('Authorization')).toBeNull()
  })
})

describe.sequential('apiClient retry on 401', () => {
  beforeEach(() => {
    tokenStore.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    tokenStore.clear()
  })

  it('refreshes the token and retries the request on 401', async () => {
    tokenStore.set('stale')
    let call = 0
    const fetchSpy = vi.fn<typeof fetch>((input) => {
      const url = input instanceof Request ? input.url : String(input)
      if (url.endsWith('/auth/refresh')) {
        return Promise.resolve(refreshOkResponse('fresh'))
      }
      call += 1
      if (call === 1) {
        return Promise.resolve(new Response(null, { status: 401 }))
      }
      return Promise.resolve(okJsonResponse())
    })
    vi.stubGlobal('fetch', fetchSpy)

    const data = await apiClient.get('me').json<{ ok: boolean }>()
    expect(data).toEqual({ ok: true })

    const apiCalls = fetchSpy.mock.calls
      .map(([input]) => (input instanceof Request ? input : new Request(String(input))))
      .filter((req) => isApiOrigin(req.url))
    expect(apiCalls).toHaveLength(2)
    expect(apiCalls[1]!.headers.get('Authorization')).toBe('Bearer fresh')
  })
})
