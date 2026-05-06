import { describe, expect, it } from 'vitest'

import { getIndividuByPublicId } from '@/individu/queries/getIndividuByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId } from '@/test/randomIds'

describe.concurrent('getIndividuByPublicId', () => {
  it(
    'retourne l\'individu avec ses référentiels',
    integrationTest(async () => {
      const deptId = testDeptId()
      await fixtures.referentielIndividu(
        {
          referentiel: { publicId: 'REF-DEPT', nom: 'Départements' },
          individu: { publicId: deptId, nom: 'Vaucluse' },
        },
        {
          referentiel: { publicId: 'REF-PACA', nom: 'PACA' },
          individu: { publicId: deptId },
        },
      )

      const result = await getIndividuByPublicId(deptId)

      const value = result._unsafeUnwrap()
      expect(value).toMatchObject({
        id: deptId,
        nom: 'Vaucluse',
      })
      expect(value.referentiels.sort()).toEqual(['REF-DEPT', 'REF-PACA'])
    }),
  )

  it(
    'rejette quand l\'individu est introuvable',
    integrationTest(async () => {
      await expect(getIndividuByPublicId(testDeptId())).rejects.toThrow()
    }),
  )
})
