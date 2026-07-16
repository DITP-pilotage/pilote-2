import { describe, expect, it } from 'vitest'

import { modifierEtatFeature } from '@/feature/commands/modifierEtatFeature'
import { ForbiddenError } from '@/framework/errors/AppError'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const ADMIN_ID = '00000000-0000-0000-0000-000000000201'

describe.concurrent('modifierEtatFeature', () => {
  it(
    'change l’état du feature',
    integrationTest(async () => {
      const feature = await fixtures.feature({ key: 'X', nom: 'X', etat: 'DESACTIVE' })

      const result = await runAsAdmin(ADMIN_ID, () =>
        modifierEtatFeature(feature.id, { etat: 'ACTIVE' }),
      )

      expect(result._unsafeUnwrap().etat).toBe('ACTIVE')
    }),
  )

  it(
    'rejette quand la feature est introuvable',
    integrationTest(async () => {
      await expect(
        runAsAdmin(ADMIN_ID, () =>
          modifierEtatFeature('00000000-0000-0000-0000-000000000000', { etat: 'ACTIVE' }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      const feature = await fixtures.feature()
      await expect(
        runAsContributor(ADMIN_ID, () => modifierEtatFeature(feature.id, { etat: 'ACTIVE' })),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})
