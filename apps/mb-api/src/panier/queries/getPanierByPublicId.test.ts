import { describe, expect, it } from 'vitest'

import { getPanierByPublicId } from '@/panier/queries/getPanierByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('getPanierByPublicId', () => {
  it(
    "retourne le panier PUBLIC avec ses indicateurs triés par ordre d'insertion",
    integrationTest(async () => {
      const [indA, indB] = testIndicateurIds(2)
      const panier = await fixtures.panier({
        publicId: 'PAN-DETAIL-1',
        nom: 'Panier de détail',
        description: 'Une description',
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }, { publicId: indB }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierByPublicId('PAN-DETAIL-1'))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        id: 'PAN-DETAIL-1',
        nom: 'Panier de détail',
        description: 'Une description',
        visibilite: 'PUBLIC',
        indicateurIds: [indA, indB],
        createdAt: panier.createdAt.toISOString(),
        updatedAt: panier.updatedAt.toISOString(),
      })
    }),
  )

  it(
    'retourne un panier sans indicateurs avec un tableau vide',
    integrationTest(async () => {
      await fixtures.panier({
        publicId: 'PAN-DETAIL-EMPTY',
        nom: 'Sans indicateurs',
        visibilite: 'PUBLIC',
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierByPublicId('PAN-DETAIL-EMPTY'))

      expect(result._unsafeUnwrap()).toMatchObject({
        id: 'PAN-DETAIL-EMPTY',
        indicateurIds: [],
        description: null,
      })
    }),
  )

  it(
    "retourne un panier PRIVE quand le principal dispose d'une permission",
    integrationTest(async () => {
      await fixtures.panier({ publicId: 'PAN-DETAIL-PRIV', visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: 'PAN-DETAIL-PRIV' }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getPanierByPublicId('PAN-DETAIL-PRIV'))

      expect(result._unsafeUnwrap().id).toBe('PAN-DETAIL-PRIV')
    }),
  )

  it(
    'lève une erreur quand un panier PRIVE est demandé sans permission',
    integrationTest(async () => {
      await fixtures.panier({ publicId: 'PAN-DETAIL-NOACL', visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => getPanierByPublicId('PAN-DETAIL-NOACL')),
      ).rejects.toThrow()
    }),
  )

  it(
    'lève une erreur quand aucun panier ne correspond',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => getPanierByPublicId('PAN-NOPE-001')),
      ).rejects.toThrow()
    }),
  )
})
