import { describe, expect, it } from 'vitest'

import { getIndividuByPublicId } from '@/individu/queries/getIndividuByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('getIndividuByPublicId', () => {
  it(
    'retourne l\'individu avec ses référentiels',
    integrationTest(async () => {
      await fixtures.referentiel(
        { publicId: 'REF-DEPT', nom: 'Départements' },
        { publicId: 'REF-PACA', nom: 'PACA' },
      )
      await fixtures.individu({ publicId: 'DEPT-84', nom: 'Vaucluse' })
      await fixtures.referentielIndividu(
        { referentielPublicId: 'REF-DEPT', individuPublicId: 'DEPT-84' },
        { referentielPublicId: 'REF-PACA', individuPublicId: 'DEPT-84' },
      )

      const result = await getIndividuByPublicId('DEPT-84')

      const value = result._unsafeUnwrap()
      expect(value).toMatchObject({
        id: 'DEPT-84',
        nom: 'Vaucluse',
      })
      expect(value.referentiels.sort()).toEqual(['REF-DEPT', 'REF-PACA'])
    }),
  )

  it(
    'rejette quand l\'individu est introuvable',
    integrationTest(async () => {
      await expect(getIndividuByPublicId('INCONNU-1')).rejects.toThrow()
    }),
  )
})
