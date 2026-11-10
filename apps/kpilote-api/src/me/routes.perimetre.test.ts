import { describe, expect, it } from 'vitest'

import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { meRoutes } from '@/me/routes'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testApiKeyRawKey } from '@/test/randomIds'

// `/me/permissions` expose le périmètre d'écriture d'un WRITE_DATA restreint
// (cf. dimensions-design.md §5.10) ; absent quand le droit n'est pas restreint.

const buildApp = () => buildTestApp(meRoutes)

describe.concurrent('GET /me/permissions — périmètre', () => {
  it(
    'expose `perimetre` (trié) pour un WRITE_DATA restreint, `[]` si restreint sans ligne',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const autre = await fixtures.cubeTerritoireOperateur()
      const libre = await fixtures.cubeTerritoireOperateur()
      const rawKey = testApiKeyRawKey()
      const apiKey = await fixtures.apiKey({
        rawKey,
        permissions: [
          {
            indicateur: { publicId: libre.indicateur },
            action: IndicateurPermissionAction.WRITE_DATA,
          },
        ],
      })
      await fixtures.indicateurPermissionPerimetre({
        principalId: apiKey.id,
        indicateur: { publicId: cube.indicateur },
        membres: [{ publicId: cube.sfr }, { publicId: cube.orange }],
      })
      await fixtures.indicateurPermissionPerimetre({
        principalId: apiKey.id,
        indicateur: { publicId: autre.indicateur },
        membres: [],
      })

      const response = await buildApp().request('/me/permissions', {
        headers: { Authorization: `Bearer ${rawKey}` },
      })

      expect(response.status).toBe(200)
      const body = (await response.json()) as {
        indicateurs: Array<{ id: string; actions: string[]; perimetre?: string[] }>
      }
      const parId = new Map(body.indicateurs.map((entree) => [entree.id, entree]))
      expect(parId.get(cube.indicateur)).toEqual({
        id: cube.indicateur,
        actions: [IndicateurPermissionAction.WRITE_DATA],
        perimetre: [cube.orange, cube.sfr].sort(),
      })
      expect(parId.get(autre.indicateur)).toEqual({
        id: autre.indicateur,
        actions: [IndicateurPermissionAction.WRITE_DATA],
        perimetre: [],
      })
      expect(parId.get(libre.indicateur)).toEqual({
        id: libre.indicateur,
        actions: [IndicateurPermissionAction.WRITE_DATA],
      })
    }),
  )
})
