import { describe, expect, it } from 'vitest'

import { listerFeatures } from '@/feature/queries/listerFeatures'
import { ForbiddenError } from '@/framework/errors/AppError'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const ADMIN_ID = '00000000-0000-0000-0000-000000000201'

describe.concurrent('listerFeatures', () => {
  it(
    'renvoie une liste vide quand aucune feature',
    integrationTest(async () => {
      const result = await runAsAdmin(ADMIN_ID, () => listerFeatures())
      expect(result._unsafeUnwrap()).toEqual([])
    }),
  )

  it(
    'renvoie les features triées par nom ASC',
    integrationTest(async () => {
      await fixtures.feature({ key: 'BETA', nom: 'Beta', etat: 'ACTIVE' })
      await fixtures.feature({ key: 'ALPHA', nom: 'Alpha', etat: 'DESACTIVE' })

      const result = await runAsAdmin(ADMIN_ID, () => listerFeatures())

      expect(result._unsafeUnwrap().map((feature) => feature.nom)).toEqual(['Alpha', 'Beta'])
      expect(result._unsafeUnwrap()[0]).toMatchObject({ key: 'ALPHA', etat: 'DESACTIVE' })
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      await expect(runAsContributor(ADMIN_ID, () => listerFeatures())).rejects.toBeInstanceOf(
        ForbiddenError,
      )
    }),
  )
})
