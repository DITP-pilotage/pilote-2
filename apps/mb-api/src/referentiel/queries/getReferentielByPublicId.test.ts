import { describe, expect, it } from 'vitest'

import { getReferentielByPublicId } from '@/referentiel/queries/getReferentielByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds } from '@/test/randomIds'

describe.concurrent('getReferentielByPublicId', () => {
  it(
    'retourne le référentiel avec sa population',
    integrationTest(async () => {
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.individu(
        {
          publicId: dept1,
          referentiel: {
            publicId: 'REF-TEST',
            nom: 'Référentiel de test',
            description: 'Description test',
          },
        },
        {
          publicId: dept2,
          referentiel: { publicId: 'REF-TEST' },
        },
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
