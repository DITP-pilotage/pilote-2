import { describe, expect, it } from 'vitest'

import { getPanierByPublicId } from '@/panier/queries/getPanierByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds } from '@/test/randomIds'

describe.concurrent('getPanierByPublicId', () => {
  it(
    "retourne le panier avec ses indicateurs triés par ordre d'insertion",
    integrationTest(async () => {
      const [indA, indB] = testIndicateurIds(2)
      const panier = await fixtures.panier({
        publicId: 'PAN-DETAIL-1',
        nom: 'Panier de détail',
        description: 'Une description',
        indicateurs: [{ publicId: indA }, { publicId: indB }],
      })

      const result = await getPanierByPublicId('PAN-DETAIL-1')

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        id: 'PAN-DETAIL-1',
        nom: 'Panier de détail',
        description: 'Une description',
        indicateurIds: [indA, indB],
        createdAt: panier.createdAt.toISOString(),
        updatedAt: panier.updatedAt.toISOString(),
      })
    }),
  )

  it(
    'retourne un panier sans indicateurs avec un tableau vide',
    integrationTest(async () => {
      await fixtures.panier({ publicId: 'PAN-DETAIL-EMPTY', nom: 'Sans indicateurs' })

      const result = await getPanierByPublicId('PAN-DETAIL-EMPTY')

      expect(result._unsafeUnwrap()).toMatchObject({
        id: 'PAN-DETAIL-EMPTY',
        indicateurIds: [],
        description: null,
      })
    }),
  )

  it(
    'lève une erreur quand aucun panier ne correspond',
    integrationTest(async () => {
      await expect(getPanierByPublicId('PAN-NOPE-001')).rejects.toThrow()
    }),
  )
})
