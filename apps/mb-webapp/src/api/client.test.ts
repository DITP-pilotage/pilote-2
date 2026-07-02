import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient, isApiOrigin } from '@/api/client'
import { tokenStore } from '@/auth/tokenStore'
import { buildMe } from '@/tests/factories/api'
import { buildRefreshResponse } from '@/tests/factories/bff'
import { apiUrl, bffUrl, server } from '@/tests/server'

describe('isApiOrigin', () => {
  it('returns true for URLs on the API origin', () => {
    expect(isApiOrigin(apiUrl('/me'))).toBe(true)
    expect(isApiOrigin(apiUrl('/anything?x=1'))).toBe(true)
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
    tokenStore.clear()
  })

  it('attaches the Authorization header on requests to the API origin', async () => {
    tokenStore.set('test-access-token')
    let receivedAuth: string | null = null
    server.use(
      http.get(apiUrl('/me'), ({ request }) => {
        receivedAuth = request.headers.get('Authorization')
        return HttpResponse.json(buildMe())
      }),
    )

    await apiClient.get('me')

    expect(receivedAuth).toBe('Bearer test-access-token')
  })

  it('does not attach the Authorization header when no token is stored', async () => {
    let receivedAuth: string | null = 'sentinel'
    server.use(
      http.get(apiUrl('/me'), ({ request }) => {
        receivedAuth = request.headers.get('Authorization')
        return HttpResponse.json(buildMe())
      }),
    )

    await apiClient.get('me')

    expect(receivedAuth).toBeNull()
  })
})

describe.sequential('apiClient retry on 401', () => {
  beforeEach(() => {
    tokenStore.clear()
  })

  afterEach(() => {
    tokenStore.clear()
  })

  it('refreshes the token and retries the request on 401', async () => {
    tokenStore.set('stale')
    let meCallCount = 0
    const authHeadersSeen: (string | null)[] = []
    server.use(
      http.post(bffUrl('/auth/refresh'), () =>
        HttpResponse.json(buildRefreshResponse({ accessToken: 'fresh' })),
      ),
      http.get(apiUrl('/me'), ({ request }) => {
        meCallCount += 1
        authHeadersSeen.push(request.headers.get('Authorization'))
        if (meCallCount === 1) return new HttpResponse(null, { status: 401 })
        return HttpResponse.json(buildMe())
      }),
    )

    const data = await apiClient.get('me').json<{ userId: string }>()
    expect(data).toEqual(buildMe())
    expect(meCallCount).toBe(2)
    expect(authHeadersSeen).toEqual(['Bearer stale', 'Bearer fresh'])
  })

  it("redirige vers /auth/login avec le chemin courant en cas d'échec du refresh", async () => {
    tokenStore.set('stale')
    const assignSpy = vi.fn()
    vi.stubGlobal('window', {
      ...window,
      location: { assign: assignSpy, pathname: '/indicateurs', search: '?statut=actif' },
    })
    server.use(
      http.post(bffUrl('/auth/refresh'), () => new HttpResponse(null, { status: 401 })),
      http.get(apiUrl('/me'), () => new HttpResponse(null, { status: 401 })),
    )

    await apiClient.get('me').catch(() => {})

    expect(assignSpy).toHaveBeenCalledWith(
      `/auth/login?redirect=${encodeURIComponent('/indicateurs?statut=actif')}`,
    )

    vi.unstubAllGlobals()
  })
})
