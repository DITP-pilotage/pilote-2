import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { type AuthVariables, requireUser } from '@/authentication/middleware/requireUser'

vi.mock('@/authentication/jwks', () => ({
  verifyAccessToken: vi.fn(),
}))

const { verifyAccessToken } = await import('@/authentication/jwks')
const verify = vi.mocked(verifyAccessToken)

const buildApp = () => {
  const app = new Hono<{ Variables: AuthVariables }>()
  app.use('/protected', requireUser)
  app.get('/protected', (context) => context.json(context.get('user')))
  return app
}

describe.sequential('requireUser middleware', () => {
  beforeEach(() => {
    verify.mockReset()
  })

  it('returns 401 when no Authorization header is present', async () => {
    const app = buildApp()
    const response = await app.request('/protected')
    expect(response.status).toBe(401)
    expect(verify).not.toHaveBeenCalled()
  })

  it('returns 401 when the scheme is not Bearer', async () => {
    const app = buildApp()
    const response = await app.request('/protected', {
      headers: { Authorization: 'Basic abc' },
    })
    expect(response.status).toBe(401)
    expect(verify).not.toHaveBeenCalled()
  })

  it('returns 401 when verifyAccessToken throws', async () => {
    verify.mockRejectedValue(new Error('boom'))
    const app = buildApp()
    const response = await app.request('/protected', {
      headers: { Authorization: 'Bearer some.token.value' },
    })
    expect(response.status).toBe(401)
    expect(verify).toHaveBeenCalledOnce()
  })

  it('passes the user to downstream handlers when verification succeeds', async () => {
    verify.mockResolvedValue({ id: 'sub-123', source: 'jwt' })
    const app = buildApp()
    const response = await app.request('/protected', {
      headers: { Authorization: 'Bearer good.token' },
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: 'sub-123', source: 'jwt' })
  })
})
