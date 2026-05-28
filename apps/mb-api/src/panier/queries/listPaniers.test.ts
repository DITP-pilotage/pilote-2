import { describe, expect, it } from 'vitest'

import { encodeCursor } from '@/framework/persistence/paginate'
import { listPaniers } from '@/panier/queries/listPaniers'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds } from '@/test/randomIds'

describe.concurrent('listPaniers', () => {
  it(
    "retourne une liste vide quand aucun panier n'existe",
    integrationTest(async () => {
      const result = await listPaniers({})

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )

  it(
    'retourne tous les paniers quand leur nombre est inférieur à la taille de page',
    integrationTest(async () => {
      await fixtures.panier(
        { publicId: 'PAN-LIST-1', nom: 'Panier 1' },
        { publicId: 'PAN-LIST-2', nom: 'Panier 2' },
        { publicId: 'PAN-LIST-3', nom: 'Panier 3' },
      )

      const result = await listPaniers({})

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual(['PAN-LIST-1', 'PAN-LIST-2', 'PAN-LIST-3'])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(3)
    }),
  )

  it(
    "expose les indicateurs du panier triés par ordre d'insertion (createdAt ASC)",
    integrationTest(async () => {
      const [indA, indB, indC] = testIndicateurIds(3)
      await fixtures.panier({
        publicId: 'PAN-ORDER-001',
        indicateurs: [{ publicId: indA }, { publicId: indB }, { publicId: indC }],
      })

      const result = await listPaniers({})

      const value = result._unsafeUnwrap()
      const panier = value.items.find((p) => p.id === 'PAN-ORDER-001')
      expect(panier?.indicateurIds).toEqual([indA, indB, indC])
    }),
  )

  it(
    'retourne un panier sans indicateurs avec un tableau vide',
    integrationTest(async () => {
      await fixtures.panier({ publicId: 'PAN-EMPTY-001' })

      const result = await listPaniers({})

      const value = result._unsafeUnwrap()
      const panier = value.items.find((p) => p.id === 'PAN-EMPTY-001')
      expect(panier?.indicateurIds).toEqual([])
    }),
  )

  it(
    'pagine quand le nombre de paniers dépasse la taille de page',
    integrationTest(async () => {
      const created = await fixtures.panier(
        { publicId: 'PAN-PAGE-1' },
        { publicId: 'PAN-PAGE-2' },
        { publicId: 'PAN-PAGE-3' },
        { publicId: 'PAN-PAGE-4' },
        { publicId: 'PAN-PAGE-5' },
        { publicId: 'PAN-PAGE-6' },
      )

      const result = await listPaniers({ pageSize: 5 })

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
        { publicId: 'PAN-CURSOR-1' },
        { publicId: 'PAN-CURSOR-2' },
        { publicId: 'PAN-CURSOR-3' },
        { publicId: 'PAN-CURSOR-4' },
        { publicId: 'PAN-CURSOR-5' },
        { publicId: 'PAN-CURSOR-6' },
      )

      const result = await listPaniers({ cursor: encodeCursor(created[4]!.id) })

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual(['PAN-CURSOR-6'])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(6)
    }),
  )
})
