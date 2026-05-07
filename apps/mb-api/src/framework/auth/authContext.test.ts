import { Hono } from 'hono'
import { okAsync } from 'neverthrow'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authContext } from '@/framework/auth/authContext'
import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'
import {
  getCurrentPrincipal,
  getCurrentUser,
  requirePrincipal,
  requireUser,
} from '@/framework/auth/userContext'

vi.mock('@/authentication/jwks', () => ({
  verifyAccessToken: vi.fn(),
}))
vi.mock('@/authentication/queries/getUtilisateurByProvider', () => ({
  getUtilisateurByProvider: vi.fn(),
}))
vi.mock('@/framework/auth/apiKey', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/framework/auth/apiKey')>()
  return {
    ...actual,
    verifyApiKey: vi.fn(),
  }
})

const { verifyAccessToken } = await import('@/authentication/jwks')
const { getUtilisateurByProvider } = await import('@/authentication/queries/getUtilisateurByProvider')
const { verifyApiKey } = await import('@/framework/auth/apiKey')
const verifyJwt = vi.mocked(verifyAccessToken)
const lookup = vi.mocked(getUtilisateurByProvider)
const verifyKey = vi.mocked(verifyApiKey)

const buildApp = () => {
  const app = new Hono()
  app.use('*', authContext)
  app.get('/anonymous', (context) =>
    context.json({ user: getCurrentUser() ?? null, principal: getCurrentPrincipal() ?? null }),
  )
  app.get('/protected-user', (context) => {
    try {
      const user = requireUser()
      return context.json(user)
    } catch (error) {
      if (error instanceof UnauthorizedError) return context.json({ error: 'unauthorized' }, 401)
      throw error
    }
  })
  app.get('/protected-principal', (context) => {
    try {
      const principal = requirePrincipal()
      return context.json(principal)
    } catch (error) {
      if (error instanceof UnauthorizedError) return context.json({ error: 'unauthorized' }, 401)
      throw error
    }
  })
  return app
}

describe.sequential('authContext middleware', () => {
  beforeEach(() => {
    verifyJwt.mockReset()
    lookup.mockReset()
    verifyKey.mockReset()
  })

  it('initializes the ALS with null when no Authorization header is present', async () => {
    const app = buildApp()
    const response = await app.request('/anonymous')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ user: null, principal: null })
    expect(verifyJwt).not.toHaveBeenCalled()
    expect(verifyKey).not.toHaveBeenCalled()
  })

  it('initializes the ALS with null when the scheme is not Bearer', async () => {
    const app = buildApp()
    const response = await app.request('/anonymous', {
      headers: { Authorization: 'Basic abc' },
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ user: null, principal: null })
    expect(verifyJwt).not.toHaveBeenCalled()
    expect(verifyKey).not.toHaveBeenCalled()
  })

  it('initializes the ALS with null when the JWT verification fails', async () => {
    verifyJwt.mockRejectedValue(new Error('boom'))
    const app = buildApp()
    const response = await app.request('/anonymous', {
      headers: { Authorization: 'Bearer some.token.value' },
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ user: null, principal: null })
    expect(verifyJwt).toHaveBeenCalledOnce()
    expect(lookup).not.toHaveBeenCalled()
  })

  it('returns 401 on /protected-user when token is valid but user is not provisioned', async () => {
    verifyJwt.mockResolvedValue({
      providerSub: 'sub-123',
      email: 'agent@example.com',
      prenom: 'Admin',
      nom: 'DITP',
    })
    lookup.mockReturnValue(okAsync(null))
    const app = buildApp()
    const response = await app.request('/protected-user', {
      headers: { Authorization: 'Bearer good.token' },
    })
    expect(response.status).toBe(401)
    expect(lookup).toHaveBeenCalledWith({
      providerSub: 'sub-123',
      email: 'agent@example.com',
      prenom: 'Admin',
      nom: 'DITP',
    })
  })

  it('exposes the user to handlers when the lookup succeeds', async () => {
    verifyJwt.mockResolvedValue({
      providerSub: 'sub-123',
      email: 'agent@example.com',
      prenom: 'Admin',
      nom: 'DITP',
    })
    lookup.mockReturnValue(
      okAsync({
        id: '01906f5e-1234-7000-8abc-000000000001',
        email: 'agent@example.com',
      }),
    )
    const app = buildApp()
    const response = await app.request('/protected-user', {
      headers: { Authorization: 'Bearer good.token' },
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      id: '01906f5e-1234-7000-8abc-000000000001',
      email: 'agent@example.com',
      prenom: 'Admin',
      nom: 'DITP',
    })
  })

  it('accepts the Bearer scheme case-insensitively (RFC 6750)', async () => {
    verifyJwt.mockResolvedValue({
      providerSub: 'sub-123',
      email: 'agent@example.com',
      prenom: 'Admin',
      nom: 'DITP',
    })
    lookup.mockReturnValue(
      okAsync({
        id: '01906f5e-1234-7000-8abc-000000000001',
        email: 'agent@example.com',
      }),
    )
    const app = buildApp()
    const response = await app.request('/protected-user', {
      headers: { Authorization: 'bearer good.token' },
    })
    expect(response.status).toBe(200)
    expect(verifyJwt).toHaveBeenCalledWith('good.token')
  })

  it('makes requireUser() throw UnauthorizedError on anonymous requests to protected handlers', async () => {
    const app = buildApp()
    const response = await app.request('/protected-user')
    expect(response.status).toBe(401)
  })

  it('routes mb_live_ tokens to the API key verifier', async () => {
    verifyKey.mockReturnValue(okAsync({ id: 'api-key-id-1', label: 'partner-x' }))
    const app = buildApp()
    const response = await app.request('/protected-principal', {
      headers: { Authorization: 'Bearer mb_live_abc123' },
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      kind: 'apiKey',
      apiKey: { id: 'api-key-id-1', label: 'partner-x' },
    })
    expect(verifyKey).toHaveBeenCalledWith('mb_live_abc123')
    expect(verifyJwt).not.toHaveBeenCalled()
  })

  it('returns null principal when the API key is unknown or revoked', async () => {
    verifyKey.mockReturnValue(okAsync(null))
    const app = buildApp()
    const response = await app.request('/anonymous', {
      headers: { Authorization: 'Bearer mb_live_unknown' },
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ user: null, principal: null })
  })

  it('makes requireUser() throw UnauthorizedError when the principal is an API key', async () => {
    verifyKey.mockReturnValue(okAsync({ id: 'api-key-id-1', label: 'partner-x' }))
    const app = buildApp()
    const response = await app.request('/protected-user', {
      headers: { Authorization: 'Bearer mb_live_abc123' },
    })
    expect(response.status).toBe(401)
  })

  it('makes requirePrincipal() succeed for an API key principal', async () => {
    verifyKey.mockReturnValue(okAsync({ id: 'api-key-id-1', label: 'partner-x' }))
    const app = buildApp()
    const response = await app.request('/protected-principal', {
      headers: { Authorization: 'Bearer mb_live_abc123' },
    })
    expect(response.status).toBe(200)
  })
})
