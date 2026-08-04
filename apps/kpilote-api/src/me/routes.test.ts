import { CollectionPermissionAction, IndicateurPermissionAction } from '@/generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { meRoutes } from '@/me/routes'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds, testCollectionId } from '@/test/randomIds'

const buildApp = () => buildTestApp(meRoutes)

describe.concurrent('GET /me/permissions', () => {
  it(
    'renvoie 200 + les permissions matérialisées du principal',
    integrationTest(async () => {
      const collectionId = testCollectionId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.collection({
        publicId: collectionId,
        indicateurs: [{ publicId: indicateurId }],
      })
      await fixtures.apiKey({
        rawKey: 'pilote_live_meperms_principal_with_perms',
        collectionPermissions: [
          {
            collection: { publicId: collectionId },
            action: CollectionPermissionAction.WRITE_COMMENT,
          },
        ],
      })

      const response = await buildApp().request('/me/permissions', {
        headers: { Authorization: 'Bearer pilote_live_meperms_principal_with_perms' },
      })

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({
        collections: [{ id: collectionId, actions: [CollectionPermissionAction.WRITE_COMMENT] }],
        indicateurs: [{ id: indicateurId, actions: [IndicateurPermissionAction.READ] }],
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
        collections: [],
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
