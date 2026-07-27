import { describe, expect, it } from 'vitest'

import { relationRoutes } from '@/relation/routes'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testApiKeyRawKey, testDeptIds, testReferentielId, testRegId } from '@/test/randomIds'

const buildApp = () => buildTestApp(relationRoutes)

// `testReferentielId()` produit un slug minuscule, refusé par
// `referentielPublicIdSchema` qui valide la réponse des routes.
const refId = () => testReferentielId().toUpperCase()

describe.concurrent('GET /relations', () => {
  it(
    'retourne les relations avec enfant, parent et référentiels',
    integrationTest(async () => {
      const refDept = refId()
      const refReg = refId()
      const [dept] = testDeptIds(1)
      const reg = testRegId()
      const rawKey = testApiKeyRawKey()
      await fixtures.relation({
        parent: { publicId: reg, nom: 'Normandie', referentiel: { publicId: refReg } },
        child: { publicId: dept, nom: 'Orne', referentiel: { publicId: refDept } },
      })
      await fixtures.apiKey({ rawKey })

      const response = await buildApp().request('/relations?recherche=Orne', {
        headers: { Authorization: `Bearer ${rawKey}` },
      })

      expect(response.status).toBe(200)
      const body = (await response.json()) as { items: unknown[] }
      expect(body.items).toEqual([
        {
          enfant: { id: dept, nom: 'Orne', referentiel: refDept },
          parent: { id: reg, nom: 'Normandie', referentiel: refReg },
        },
      ])
    }),
  )

  it(
    'refuse une requête non authentifiée',
    integrationTest(async () => {
      const response = await buildApp().request('/relations')

      expect(response.status).toBe(401)
    }),
  )
})
