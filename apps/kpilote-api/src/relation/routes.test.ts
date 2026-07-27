import { describe, expect, it } from 'vitest'

import { app } from '../app'

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

// Les routes d'écriture ouvrent leur propre transaction (`withTransaction`), qui
// ne voit pas les fixtures de la transaction de test : leur comportement est
// couvert par les tests de commande. Ici on vérifie le câblage et le mapping
// d'erreur qui n'a pas besoin de la base.
describe('PUT /relations/{id} — câblage', () => {
  it('déclare la route dans le doc OpenAPI', async () => {
    const response = await app.request('/openapi.json')

    expect(response.status).toBe(200)
    const doc = (await response.json()) as { paths: Record<string, Record<string, unknown>> }
    expect(doc.paths['/relations']?.get).toBeDefined()
    expect(doc.paths['/relations/{id}']?.put).toBeDefined()
    expect(doc.paths['/relations/{id}']?.delete).toBeDefined()
  })

  it('renvoie 401 sur une suppression non authentifiée', async () => {
    const response = await app.request('/relations/DEPT-01', { method: 'DELETE' })

    expect(response.status).toBe(401)
  })

  it('renvoie 401 sans authentification', async () => {
    const response = await app.request('/relations/DEPT-01', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ parent: 'REG-93' }),
    })

    expect(response.status).toBe(401)
  })

  it(
    'mappe AUTO_PARENT sur un 400',
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const rawKey = testApiKeyRawKey()
      await fixtures.individu({ publicId: dept })
      await fixtures.apiKey({ rawKey, role: 'ADMIN' })

      const response = await buildApp().request(`/relations/${dept}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${rawKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent: dept }),
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ code: 'AUTO_PARENT' })
    }),
  )
})
