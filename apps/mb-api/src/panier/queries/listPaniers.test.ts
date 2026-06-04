import { describe, expect, it } from 'vitest'

import { encodeCursor } from '@/framework/persistence/paginate'
import { listPaniers } from '@/panier/queries/listPaniers'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listPaniers', () => {
  it(
    "retourne une liste vide quand aucun panier n'existe",
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      const result = await runAsPrincipal(apiKey.id, () => listPaniers({}))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )

  it(
    'retourne tous les paniers PUBLIC quand leur nombre est inférieur à la taille de page',
    integrationTest(async () => {
      await fixtures.panier(
        { publicId: 'PAN-LIST-1', nom: 'Panier 1', visibilite: 'PUBLIC' },
        { publicId: 'PAN-LIST-2', nom: 'Panier 2', visibilite: 'PUBLIC' },
        { publicId: 'PAN-LIST-3', nom: 'Panier 3', visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listPaniers({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual(['PAN-LIST-1', 'PAN-LIST-2', 'PAN-LIST-3'])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(3)
    }),
  )

  it(
    "n'inclut que les paniers sur lesquels le principal a une permission",
    integrationTest(async () => {
      await fixtures.panier(
        { publicId: 'PAN-PERM-ACC', visibilite: 'PRIVE' },
        { publicId: 'PAN-PERM-HID', visibilite: 'PRIVE' },
      )
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: 'PAN-PERM-ACC' }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listPaniers({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual(['PAN-PERM-ACC'])
      expect(value.total).toBe(1)
    }),
  )

  it(
    "inclut les paniers PUBLIC sur lesquels le principal n'a aucune permission",
    integrationTest(async () => {
      await fixtures.panier(
        { publicId: 'PAN-VIS-PUB', visibilite: 'PUBLIC' },
        { publicId: 'PAN-VIS-PRI', visibilite: 'PRIVE' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listPaniers({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual(['PAN-VIS-PUB'])
      expect(value.items.map((p) => p.visibilite)).toEqual(['PUBLIC'])
    }),
  )

  it(
    "expose les indicateurs du panier triés par ordre d'insertion (createdAt ASC)",
    integrationTest(async () => {
      const [indA, indB, indC] = testIndicateurIds(3)
      await fixtures.panier({
        publicId: 'PAN-ORDER-001',
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }, { publicId: indB }, { publicId: indC }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listPaniers({}))

      const value = result._unsafeUnwrap()
      const panier = value.items.find((p) => p.id === 'PAN-ORDER-001')
      expect(panier?.indicateurIds).toEqual([indA, indB, indC])
    }),
  )

  it(
    'retourne un panier sans indicateurs avec un tableau vide',
    integrationTest(async () => {
      await fixtures.panier({ publicId: 'PAN-EMPTY-001', visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listPaniers({}))

      const value = result._unsafeUnwrap()
      const panier = value.items.find((p) => p.id === 'PAN-EMPTY-001')
      expect(panier?.indicateurIds).toEqual([])
    }),
  )

  it(
    'pagine quand le nombre de paniers dépasse la taille de page',
    integrationTest(async () => {
      const created = await fixtures.panier(
        { publicId: 'PAN-PAGE-1', visibilite: 'PUBLIC' },
        { publicId: 'PAN-PAGE-2', visibilite: 'PUBLIC' },
        { publicId: 'PAN-PAGE-3', visibilite: 'PUBLIC' },
        { publicId: 'PAN-PAGE-4', visibilite: 'PUBLIC' },
        { publicId: 'PAN-PAGE-5', visibilite: 'PUBLIC' },
        { publicId: 'PAN-PAGE-6', visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listPaniers({ pageSize: 5 }))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([
        'PAN-PAGE-1',
        'PAN-PAGE-2',
        'PAN-PAGE-3',
        'PAN-PAGE-4',
        'PAN-PAGE-5',
      ])
      expect(value.pagination).toEqual({ cursor: encodeCursor(created[4]!.id), hasMore: true })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'retourne la page suivante en utilisant le cursor',
    integrationTest(async () => {
      const created = await fixtures.panier(
        { publicId: 'PAN-CURSOR-1', visibilite: 'PUBLIC' },
        { publicId: 'PAN-CURSOR-2', visibilite: 'PUBLIC' },
        { publicId: 'PAN-CURSOR-3', visibilite: 'PUBLIC' },
        { publicId: 'PAN-CURSOR-4', visibilite: 'PUBLIC' },
        { publicId: 'PAN-CURSOR-5', visibilite: 'PUBLIC' },
        { publicId: 'PAN-CURSOR-6', visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listPaniers({ cursor: encodeCursor(created[4]!.id) }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual(['PAN-CURSOR-6'])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(6)
    }),
  )
})
