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
vi.mock('@/framework/auth/verifyApiKey', () => ({
  verifyApiKey: vi.fn(),
}))

const { verifyAccessToken } = await import('@/authentication/jwks')
const { getUtilisateurByProvider } =
  await import('@/authentication/queries/getUtilisateurByProvider')
const { verifyApiKey } = await import('@/framework/auth/verifyApiKey')
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

describe.sequential('middleware authContext', () => {
  beforeEach(() => {
    verifyJwt.mockReset()
    lookup.mockReset()
    verifyKey.mockReset()
  })

  it("initialise l'ALS à null en l'absence de header Authorization", async () => {
    const app = buildApp()
    const response = await app.request('/anonymous')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ user: null, principal: null })
    expect(verifyJwt).not.toHaveBeenCalled()
    expect(verifyKey).not.toHaveBeenCalled()
  })

  it("initialise l'ALS à null quand le scheme n'est pas Bearer", async () => {
    const app = buildApp()
    const response = await app.request('/anonymous', {
      headers: { Authorization: 'Basic abc' },
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ user: null, principal: null })
    expect(verifyJwt).not.toHaveBeenCalled()
    expect(verifyKey).not.toHaveBeenCalled()
  })

  it("initialise l'ALS à null quand la vérification du JWT échoue", async () => {
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

  it("renvoie 401 sur /protected-user quand le token est valide mais l'utilisateur n'est pas provisionné", async () => {
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

  it("expose l'utilisateur aux handlers quand le lookup réussit", async () => {
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

  it('accepte le scheme Bearer de manière insensible à la casse (RFC 6750)', async () => {
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

  it('fait throw UnauthorizedError sur requireUser() pour une requête anonyme', async () => {
    const app = buildApp()
    const response = await app.request('/protected-user')
    expect(response.status).toBe(401)
  })

  it("route les tokens préfixés pilote_live_ vers le vérificateur d'API key", async () => {
    verifyKey.mockReturnValue(okAsync({ id: 'api-key-id-1', label: 'partner-x' }))
    const app = buildApp()
    const response = await app.request('/protected-principal', {
      headers: { Authorization: 'Bearer pilote_live_abc123' },
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      kind: 'apiKey',
      apiKey: { id: 'api-key-id-1', label: 'partner-x' },
    })
    expect(verifyKey).toHaveBeenCalledWith('pilote_live_abc123', expect.any(String))
    expect(verifyJwt).not.toHaveBeenCalled()
  })

  it("renvoie un principal null quand l'API key est inconnue ou révoquée", async () => {
    verifyKey.mockReturnValue(okAsync(null))
    const app = buildApp()
    const response = await app.request('/anonymous', {
      headers: { Authorization: 'Bearer pilote_live_unknown' },
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ user: null, principal: null })
  })

  it('fait throw UnauthorizedError sur requireUser() quand le principal est une API key', async () => {
    verifyKey.mockReturnValue(okAsync({ id: 'api-key-id-1', label: 'partner-x' }))
    const app = buildApp()
    const response = await app.request('/protected-user', {
      headers: { Authorization: 'Bearer pilote_live_abc123' },
    })
    expect(response.status).toBe(401)
  })

  it('fait passer requirePrincipal() avec un principal API key', async () => {
    verifyKey.mockReturnValue(okAsync({ id: 'api-key-id-1', label: 'partner-x' }))
    const app = buildApp()
    const response = await app.request('/protected-principal', {
      headers: { Authorization: 'Bearer pilote_live_abc123' },
    })
    expect(response.status).toBe(200)
  })
})
