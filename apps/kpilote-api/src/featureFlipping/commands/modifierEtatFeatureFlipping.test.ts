import { describe, expect, it } from 'vitest'

import { modifierEtatFeatureFlipping } from '@/featureFlipping/commands/modifierEtatFeatureFlipping'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('modifierEtatFeatureFlipping', () => {
  it(
    'change l’état du feature flipping',
    integrationTest(async () => {
      const ff = await fixtures.featureFlipping({ key: 'x', nom: 'X', etat: 'DESACTIVE' })

      const result = await modifierEtatFeatureFlipping(ff.id, { etat: 'ACTIVE' })

      expect(result._unsafeUnwrap().etat).toBe('ACTIVE')
    }),
  )

  it(
    'rejette quand le FF est introuvable',
    integrationTest(async () => {
      await expect(
        modifierEtatFeatureFlipping('00000000-0000-0000-0000-000000000000', { etat: 'ACTIVE' }),
      ).rejects.toThrow()
    }),
  )
})
