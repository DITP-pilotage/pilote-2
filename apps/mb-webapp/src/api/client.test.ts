import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient, isApiOrigin } from '@/api/client'
import { tokenStore } from '@/auth/tokenStore'
import { env } from '@/env'

const okJsonResponse = () =>
  new Response(JSON.stringify({ ok: true }), {
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
  beforeEach(() => {
    tokenStore.set('test-access-token')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    tokenStore.clear()
  })

  it('attaches the Authorization header on requests to the API origin', async () => {
    const fetchSpy = vi.fn<typeof fetch>(() => Promise.resolve(okJsonResponse()))
    vi.stubGlobal('fetch', fetchSpy)

    await apiClient.get('me')

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const request = fetchSpy.mock.calls[0]![0] as Request
    expect(new URL(request.url).origin).toBe(new URL(env.apiUrl).origin)
    expect(request.headers.get('Authorization')).toBe('Bearer test-access-token')
  })
})
