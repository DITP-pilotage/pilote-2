import { describe, expect, it } from 'vitest'

import { listerMesFeatures } from '@/me/queries/listerMesFeatures'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listerMesFeatures', () => {
  it(
    'inclut les features ACTIVE, exclut les DESACTIVE, et inclut ACTIVE_POUR_UTILISATEUR seulement si autorisé',
    integrationTest(async () => {
      const moi = await fixtures.utilisateur({ email: 'moi@ditp.gouv.fr' })
      const autre = await fixtures.utilisateur({ email: 'autre@ditp.gouv.fr' })
      await fixtures.feature({ key: 'GLOBAL_ON', etat: 'ACTIVE' })
      await fixtures.feature({ key: 'GLOBAL_OFF', etat: 'DESACTIVE' })
      await fixtures.feature({
        key: 'POUR_MOI',
        etat: 'ACTIVE_POUR_UTILISATEUR',
        utilisateurs: [{ id: moi.id }],
      })
      await fixtures.feature({
        key: 'POUR_AUTRE',
        etat: 'ACTIVE_POUR_UTILISATEUR',
        utilisateurs: [{ id: autre.id }],
      })

      const result = await runAsPrincipal(moi.id, () => listerMesFeatures())

      expect(result._unsafeUnwrap().features.sort()).toEqual(['GLOBAL_ON', 'POUR_MOI'])
    }),
  )
})
