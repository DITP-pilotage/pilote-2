import { describe, expect, it } from 'vitest'

import { listIndividus } from '@/individu/queries/listIndividus'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds, testReferentielId, testRegIds } from '@/test/randomIds'

describe.concurrent('listIndividus', () => {
  it(
    'trie les individus par nom croissant, tous référentiels confondus',
    integrationTest(async () => {
      const refA = testReferentielId()
      const refB = testReferentielId()
      const [d1, d2] = testDeptIds(2)
      const [r1] = testRegIds(1)
      await fixtures.individu(
        { publicId: d2, nom: 'Zzbeta', referentiel: { publicId: refA } },
        { publicId: r1, nom: 'Zzgamma', referentiel: { publicId: refB } },
        { publicId: d1, nom: 'Zzalpha', referentiel: { publicId: refA } },
      )

      const result = await listIndividus({ recherche: 'Zz' })

      expect(result._unsafeUnwrap().items.map((individu) => individu.nom)).toEqual([
        'Zzalpha',
        'Zzbeta',
        'Zzgamma',
      ])
    }),
  )

  it(
    'expose les parents de chaque individu, ce qui permet de repérer ceux déjà rattachés',
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [reg] = testRegIds(1)
      await fixtures.relation({
        parent: { publicId: reg, nom: 'Zzparent' },
        child: { publicId: dept, nom: 'Zzenfant' },
      })

      const result = await listIndividus({ recherche: 'Zzenfant' })

      expect(result._unsafeUnwrap().items[0]?.parents).toEqual([reg])
    }),
  )

  it(
    'pagine les résultats',
    integrationTest(async () => {
      const ref = testReferentielId()
      const [i1, i2, i3] = testDeptIds(3)
      await fixtures.individu(
        { publicId: i1, nom: 'Zzpage0', referentiel: { publicId: ref } },
        { publicId: i2, nom: 'Zzpage1', referentiel: { publicId: ref } },
        { publicId: i3, nom: 'Zzpage2', referentiel: { publicId: ref } },
      )

      const premiere = await listIndividus({ recherche: 'Zzpage', pageSize: 2 })
      const page1 = premiere._unsafeUnwrap()

      expect(page1.items).toHaveLength(2)
      expect(page1.pagination.hasMore).toBe(true)
      expect(page1.total).toBe(3)
    }),
  )
})
