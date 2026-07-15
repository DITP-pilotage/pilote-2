import { describe, expect, it } from 'vitest'

import { listerFeatures } from '@/feature/queries/listerFeatures'
import { ForbiddenError } from '@/framework/errors/AppError'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const ADMIN_ID = '00000000-0000-0000-0000-000000000201'

describe.concurrent('listerFeatures', () => {
  it(
    'renvoie une liste vide quand aucun FF',
    integrationTest(async () => {
      const result = await runAsAdmin(ADMIN_ID, () => listerFeatures())
      expect(result._unsafeUnwrap()).toEqual([])
    }),
  )

  it(
    'renvoie les FF triés par nom ASC',
    integrationTest(async () => {
      await fixtures.feature({ key: 'beta', nom: 'Beta', etat: 'ACTIVE' })
      await fixtures.feature({ key: 'alpha', nom: 'Alpha', etat: 'DESACTIVE' })

      const result = await runAsAdmin(ADMIN_ID, () => listerFeatures())

      expect(result._unsafeUnwrap().map((ff) => ff.nom)).toEqual(['Alpha', 'Beta'])
      expect(result._unsafeUnwrap()[0]).toMatchObject({ key: 'alpha', etat: 'DESACTIVE' })
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
