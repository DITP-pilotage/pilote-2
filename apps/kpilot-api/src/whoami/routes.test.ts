import { describe, expect, it } from 'vitest'

import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { whoamiRoutes } from '@/whoami/routes'

const buildApp = () => buildTestApp(whoamiRoutes)

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
