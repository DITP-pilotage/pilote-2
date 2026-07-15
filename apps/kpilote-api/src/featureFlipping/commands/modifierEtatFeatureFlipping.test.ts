import { describe, expect, it } from 'vitest'

import { modifierEtatFeatureFlipping } from '@/featureFlipping/commands/modifierEtatFeatureFlipping'
import { ForbiddenError } from '@/framework/errors/AppError'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const ADMIN_ID = '00000000-0000-0000-0000-000000000201'

describe.concurrent('modifierEtatFeatureFlipping', () => {
  it(
    'change l’état du feature flipping',
    integrationTest(async () => {
      const ff = await fixtures.featureFlipping({ key: 'x', nom: 'X', etat: 'DESACTIVE' })

      const result = await runAsAdmin(ADMIN_ID, () =>
        modifierEtatFeatureFlipping(ff.id, { etat: 'ACTIVE' }),
      )

      expect(result._unsafeUnwrap().etat).toBe('ACTIVE')
    }),
  )

  it(
    'rejette quand le FF est introuvable',
    integrationTest(async () => {
      await expect(
        runAsAdmin(ADMIN_ID, () =>
          modifierEtatFeatureFlipping('00000000-0000-0000-0000-000000000000', { etat: 'ACTIVE' }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      const ff = await fixtures.featureFlipping()
      await expect(
        runAsContributor(ADMIN_ID, () => modifierEtatFeatureFlipping(ff.id, { etat: 'ACTIVE' })),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})
