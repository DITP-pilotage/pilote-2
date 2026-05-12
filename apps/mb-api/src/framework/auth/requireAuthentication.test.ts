import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { type Principal, runWithPrincipal } from '@/framework/auth/userContext'

const buildApp = (principal: Principal | null) => {
  const app = new Hono()
  app.use('*', async (_, next) => runWithPrincipal(principal, next))
  app.use('*', requireAuthentication)
  app.onError((error, context) => {
    if (error instanceof UnauthorizedError) return context.json({ error: 'unauthorized' }, 401)
    throw error
  })
  app.get('/protected', (context) => context.json({ ok: true }))
  return app
}

describe.concurrent('middleware requireAuthentication', () => {
  it('renvoie 401 quand aucun principal est présent dans le contexte', async () => {
    const app = buildApp(null)
    const response = await app.request('/protected')
    expect(response.status).toBe(401)
  })

  it('laisse passer la requête quand un principal user est présent', async () => {
    const app = buildApp({
      kind: 'user',
      user: {
        id: '01906f5e-1234-7000-8abc-000000000001',
        email: 'agent@example.com',
        prenom: 'Admin',
        nom: 'DITP',
      },
    })
    const response = await app.request('/protected')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
  })

  it('laisse passer la requête quand un principal API key est présent', async () => {
    const app = buildApp({
      kind: 'apiKey',
      apiKey: { id: 'api-key-id-1', label: 'partner-x' },
    })
    const response = await app.request('/protected')
    expect(response.status).toBe(200)
  })
})
