import { describe, expect, it } from 'vitest'

import { referentielRoutes } from '@/referentiel/routes'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId } from '@/test/randomIds'

const buildApp = () => buildTestApp(referentielRoutes)

const RAW_KEY = 'pilote_live_referentiels_scope_me_key_ok'

describe.concurrent('GET /referentiels', () => {
  it(
    // Régression : le handler doit transmettre `scope` à la query. Un test
    // unitaire sur listReferentiels() ne couvre ni ce câblage ni la validation
    // de la réponse OpenAPI (d'où des publicId au format attendu ici).
    'scope=me ne renvoie que les référentiels reliés à un indicateur lisible',
    integrationTest(async () => {
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: testIndicateurId(), visibilite: 'PUBLIC' },
        referentiel: { publicId: 'REF-SCOPEA', nom: 'Avec indicateur' },
      })
      await fixtures.referentiel({ publicId: 'REF-SCOPEB', nom: 'Sans indicateur' })
      await fixtures.apiKey({ rawKey: RAW_KEY })

      const response = await buildApp().request('/referentiels?scope=me', {
        headers: { Authorization: `Bearer ${RAW_KEY}` },
      })

      expect(response.status).toBe(200)
      const body = (await response.json()) as { items: Array<{ id: string }> }
      const ids = body.items.map((r) => r.id)
      expect(ids).toContain('REF-SCOPEA')
      expect(ids).not.toContain('REF-SCOPEB')
    }),
  )
})
