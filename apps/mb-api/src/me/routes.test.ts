import { describe, expect, it } from 'vitest'

import { meRoutes } from '@/me/routes'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds, testPanierId } from '@/test/randomIds'

const buildApp = () => buildTestApp(meRoutes)

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
