import { describe, expect, it } from 'vitest'

import { referentielRoutes } from '@/referentiel/routes'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

const buildApp = () => buildTestApp(referentielRoutes)

describe.concurrent('GET /referentiels', () => {
  it(
    'transmet scope=me au filtre : seuls les référentiels reliés à un indicateur lisible sont renvoyés',
    integrationTest(async () => {
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: 'IND-SCOPE-ME', visibilite: 'PUBLIC' },
        referentiel: { publicId: 'REF-SCOPE-AVEC', nom: 'Avec indicateur' },
      })
      await fixtures.referentiel({ publicId: 'REF-SCOPE-SANS', nom: 'Sans indicateur' })
      await fixtures.apiKey({ rawKey: 'pilote_live_referentiels_scope_me_ok' })

      const response = await buildApp().request('/referentiels?scope=me', {
        headers: { Authorization: 'Bearer pilote_live_referentiels_scope_me_ok' },
      })

      expect(response.status).toBe(200)
      const body = (await response.json()) as { items: Array<{ id: string }> }
      const ids = body.items.map((r) => r.id)
      expect(ids).toContain('REF-SCOPE-AVEC')
      expect(ids).not.toContain('REF-SCOPE-SANS')
    }),
  )

  it(
    'sans scope : renvoie tous les référentiels, y compris ceux sans indicateur',
    integrationTest(async () => {
      await fixtures.referentiel({ publicId: 'REF-NOSCOPE-SANS', nom: 'Sans indicateur' })
      await fixtures.apiKey({ rawKey: 'pilote_live_referentiels_no_scope_ok' })

      const response = await buildApp().request('/referentiels', {
        headers: { Authorization: 'Bearer pilote_live_referentiels_no_scope_ok' },
      })

      expect(response.status).toBe(200)
      const body = (await response.json()) as { items: Array<{ id: string }> }
      expect(body.items.map((r) => r.id)).toContain('REF-NOSCOPE-SANS')
    }),
  )
})
