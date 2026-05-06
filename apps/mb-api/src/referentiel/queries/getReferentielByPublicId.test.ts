import { describe, expect, it } from 'vitest'

import { getReferentielByPublicId } from '@/referentiel/queries/getReferentielByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('getReferentielByPublicId', () => {
  it(
    'retourne le référentiel avec sa population',
    integrationTest(async () => {
      await fixtures.referentiel({
        publicId: 'REF-TEST',
        nom: 'Référentiel de test',
        description: 'Description test',
      })
      await fixtures.individu({ publicId: 'X-1' }, { publicId: 'X-2' })
      await fixtures.referentielIndividu(
        { referentielPublicId: 'REF-TEST', individuPublicId: 'X-1' },
        { referentielPublicId: 'REF-TEST', individuPublicId: 'X-2' },
      )

      const result = await getReferentielByPublicId('REF-TEST')

      const value = result._unsafeUnwrap()
      expect(value).toMatchObject({
        id: 'REF-TEST',
        nom: 'Référentiel de test',
        description: 'Description test',
        nombreIndividus: 2,
      })
    }),
  )

  it(
    'rejette quand le référentiel est introuvable',
    integrationTest(async () => {
      await expect(getReferentielByPublicId('REF-INCONNU')).rejects.toThrow()
    }),
  )
})
