import { OpenAPIHono } from '@hono/zod-openapi'
import { describe, expect, it } from 'vitest'

import { authContext } from '@/framework/auth/authContext'
import { registerErrorHandler } from '@/framework/errors/errorHandler'
import { meRoutes } from '@/me/routes'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds, testPanierId } from '@/test/randomIds'

// App de test minimale : authContext (qui résout le principal via la base de la
// transaction de test) + les routes /me et /me/permissions + le mapping
// d'erreur standard. On n'inclut pas databaseContext, qui écraserait le
// contexte db transactionnel d'integrationTest.
const buildApp = () => {
  const app = new OpenAPIHono()
  app.use('*', authContext)
  app.route('/', meRoutes)
  registerErrorHandler(app)
  return app
}

describe.concurrent('GET /me/permissions', () => {
  it(
    'renvoie 200 + les permissions matérialisées du principal',
    integrationTest(async () => {
      const panierId = testPanierId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.panier({ publicId: panierId, indicateurs: [{ publicId: indicateurId }] })
      await fixtures.apiKey({
        rawKey: 'pilote_live_meperms_principal_with_perms',
        panierPermissions: [{ panier: { publicId: panierId }, action: 'WRITE' }],
      })

      const response = await buildApp().request('/me/permissions', {
        headers: { Authorization: 'Bearer pilote_live_meperms_principal_with_perms' },
      })

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({
        paniers: [{ id: panierId, actions: ['WRITE'] }],
        indicateurs: [{ id: indicateurId, actions: ['READ'] }],
      })
    }),
  )

  it(
    'renvoie isAdmin: true et des listes vides pour une API key ADMIN',
    integrationTest(async () => {
      await fixtures.apiKey({
        rawKey: 'pilote_live_meperms_admin_key_value_ok',
        role: 'ADMIN',
      })

      const response = await buildApp().request('/me/permissions', {
        headers: { Authorization: 'Bearer pilote_live_meperms_admin_key_value_ok' },
      })

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({
        isAdmin: true,
        paniers: [],
        indicateurs: [],
      })
    }),
  )

  it(
    'renvoie 401 sans authentification',
    integrationTest(async () => {
      const response = await buildApp().request('/me/permissions')
      expect(response.status).toBe(401)
    }),
  )
})
