import { describe, expect, it } from 'vitest'

import { getReferentielByPublicId } from '@/referentiel/queries/getReferentielByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('getReferentielByPublicId', () => {
  it(
    'retourne le référentiel avec sa population',
    integrationTest(async () => {
      await fixtures.referentiel({
        publicId: 'REF-test',
        nom: 'Référentiel de test',
        description: 'Description test',
      })
      await fixtures.individu({ publicId: 'X-1' }, { publicId: 'X-2' })
      await fixtures.referentielIndividu(
        { referentielPublicId: 'REF-test', individuPublicId: 'X-1' },
        { referentielPublicId: 'REF-test', individuPublicId: 'X-2' },
      )

      const result = await getReferentielByPublicId('REF-test')

      const value = result._unsafeUnwrap()
      expect(value).toMatchObject({
        id: 'REF-test',
        nom: 'Référentiel de test',
        description: 'Description test',
        nombreIndividus: 2,
      })
    }),
  )

  it(
    'rejette quand le référentiel est introuvable',
    integrationTest(async () => {
      await expect(getReferentielByPublicId('REF-inconnu')).rejects.toThrow()
    }),
  )
})
