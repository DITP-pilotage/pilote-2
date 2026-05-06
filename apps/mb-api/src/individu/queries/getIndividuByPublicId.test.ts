import { describe, expect, it } from 'vitest'

import { getIndividuByPublicId } from '@/individu/queries/getIndividuByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('getIndividuByPublicId', () => {
  it(
    'retourne l\'individu avec ses référentiels',
    integrationTest(async () => {
      await fixtures.referentiel(
        { publicId: 'REF-departements', nom: 'Départements' },
        { publicId: 'REF-paca', nom: 'PACA' },
      )
      await fixtures.individu({ publicId: 'Dept-84', nom: 'Vaucluse' })
      await fixtures.referentielIndividu(
        { referentielPublicId: 'REF-departements', individuPublicId: 'Dept-84' },
        { referentielPublicId: 'REF-paca', individuPublicId: 'Dept-84' },
      )

      const result = await getIndividuByPublicId('Dept-84')

      const value = result._unsafeUnwrap()
      expect(value).toMatchObject({
        id: 'Dept-84',
        nom: 'Vaucluse',
        metadata: null,
      })
      expect(value.referentiels.sort()).toEqual(['REF-departements', 'REF-paca'])
    }),
  )

  it(
    'rejette quand l\'individu est introuvable',
    integrationTest(async () => {
      await expect(getIndividuByPublicId('Inconnu-1')).rejects.toThrow()
    }),
  )
})
