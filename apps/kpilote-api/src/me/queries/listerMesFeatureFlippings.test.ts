import { describe, expect, it } from 'vitest'

import { listerMesFeatureFlippings } from '@/me/queries/listerMesFeatureFlippings'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listerMesFeatureFlippings', () => {
  it(
    'inclut les FF ACTIVE, exclut les DESACTIVE, et inclut ACTIVE_POUR_UTILISATEUR seulement si autorisé',
    integrationTest(async () => {
      const moi = await fixtures.utilisateur({ email: 'moi@ditp.gouv.fr' })
      const autre = await fixtures.utilisateur({ email: 'autre@ditp.gouv.fr' })
      await fixtures.featureFlipping({ key: 'global_on', etat: 'ACTIVE' })
      await fixtures.featureFlipping({ key: 'global_off', etat: 'DESACTIVE' })
      await fixtures.featureFlipping({
        key: 'pour_moi',
        etat: 'ACTIVE_POUR_UTILISATEUR',
        utilisateurs: [{ id: moi.id }],
      })
      await fixtures.featureFlipping({
        key: 'pour_autre',
        etat: 'ACTIVE_POUR_UTILISATEUR',
        utilisateurs: [{ id: autre.id }],
      })

      const result = await runAsPrincipal(moi.id, () => listerMesFeatureFlippings())

      expect(result._unsafeUnwrap().features.sort()).toEqual(['global_on', 'pour_moi'])
    }),
  )
})
