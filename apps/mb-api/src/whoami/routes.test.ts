import { OpenAPIHono } from '@hono/zod-openapi'
import { describe, expect, it } from 'vitest'

import { authContext } from '@/framework/auth/authContext'
import { registerErrorHandler } from '@/framework/errors/errorHandler'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { whoamiRoutes } from '@/whoami/routes'

// App de test minimale : authContext (qui résout le principal via la base de la
// transaction de test) + la route whoami + le mapping d'erreur standard. On
// n'inclut volontairement PAS databaseContext, qui écraserait le contexte db
// transactionnel d'integrationTest et rendrait les fixtures invisibles.
const buildApp = () => {
  const app = new OpenAPIHono()
  app.use('*', authContext)
  app.route('/', whoamiRoutes)
  registerErrorHandler(app)
  return app
}

describe.concurrent('GET /auth/whoami', () => {
  it(
    'renvoie 200 + label quand la clé API est valide',
    integrationTest(async () => {
      await fixtures.apiKey({
        rawKey: 'pilote_live_whoami_valid_key_value_ok',
        label: 'clé-ops',
      })

      const response = await buildApp().request('/auth/whoami', {
        headers: { Authorization: 'Bearer pilote_live_whoami_valid_key_value_ok' },
      })

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ kind: 'apiKey', label: 'clé-ops' })
    }),
  )

  it(
    'renvoie 401 quand aucune clé n’est fournie',
    integrationTest(async () => {
      const response = await buildApp().request('/auth/whoami')
      expect(response.status).toBe(401)
    }),
  )

  it(
    'renvoie 401 quand la clé est inconnue',
    integrationTest(async () => {
      const response = await buildApp().request('/auth/whoami', {
        headers: { Authorization: 'Bearer pilote_live_unknown_key_value_xxxxxx' },
      })
      expect(response.status).toBe(401)
    }),
  )
})
