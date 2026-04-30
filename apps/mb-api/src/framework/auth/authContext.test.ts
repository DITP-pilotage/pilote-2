import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authContext } from '@/framework/auth/authContext'
import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'
import { getCurrentUser, requireUser } from '@/framework/auth/userContext'

vi.mock('@/authentication/jwks', () => ({
  verifyAccessToken: vi.fn(),
}))

const { verifyAccessToken } = await import('@/authentication/jwks')
const verify = vi.mocked(verifyAccessToken)

const buildApp = () => {
  const app = new Hono()
  app.use('*', authContext)
  app.get('/anonymous', (context) => context.json({ user: getCurrentUser() ?? null }))
  app.get('/protected', (context) => {
    try {
      const user = requireUser()
      return context.json(user)
    } catch (error) {
      if (error instanceof UnauthorizedError) return context.json({ error: 'unauthorized' }, 401)
      throw error
    }
  })
  return app
}

describe.sequential('authContext middleware', () => {
  beforeEach(() => {
    verify.mockReset()
  })

  it('initializes the ALS with undefined when no Authorization header is present', async () => {
    const app = buildApp()
    const response = await app.request('/anonymous')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ user: null })
    expect(verify).not.toHaveBeenCalled()
  })

  it('initializes the ALS with undefined when the scheme is not Bearer', async () => {
    const app = buildApp()
    const response = await app.request('/anonymous', {
      headers: { Authorization: 'Basic abc' },
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ user: null })
    expect(verify).not.toHaveBeenCalled()
  })

  it('initializes the ALS with undefined when the JWT verification fails', async () => {
    verify.mockRejectedValue(new Error('boom'))
    const app = buildApp()
    const response = await app.request('/anonymous', {
      headers: { Authorization: 'Bearer some.token.value' },
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ user: null })
    expect(verify).toHaveBeenCalledOnce()
  })

  it('exposes the user to handlers when verification succeeds', async () => {
    verify.mockResolvedValue({ userId: 'sub-123', source: 'jwt' })
    const app = buildApp()
    const response = await app.request('/protected', {
      headers: { Authorization: 'Bearer good.token' },
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ userId: 'sub-123', source: 'jwt' })
  })

  it('accepts the Bearer scheme case-insensitively (RFC 6750)', async () => {
    verify.mockResolvedValue({ userId: 'sub-123', source: 'jwt' })
    const app = buildApp()
    const response = await app.request('/protected', {
      headers: { Authorization: 'bearer good.token' },
    })
    expect(response.status).toBe(200)
    expect(verify).toHaveBeenCalledWith('good.token')
  })

  it('makes requireUser() throw UnauthorizedError on anonymous requests to protected handlers', async () => {
    const app = buildApp()
    const response = await app.request('/protected')
    expect(response.status).toBe(401)
  })
})
