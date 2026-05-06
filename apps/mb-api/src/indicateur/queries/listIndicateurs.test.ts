import { describe, expect, it } from 'vitest'

import { encodeCursor } from '@/framework/persistence/paginate'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('listIndicateurs', () => {
  it(
    "retourne une liste vide quand aucun indicateur n'existe",
    integrationTest(async () => {
      // When
      const result = await listIndicateurs({})

      // Then
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )

  it(
    'retourne tous les indicateurs quand leur nombre est inférieur à la taille de page',
    integrationTest(async () => {
      // Given
      await fixtures.indicateur(
        { publicId: 'IND-1', nom: 'Alpha' },
        { publicId: 'IND-2', nom: 'Bravo' },
        { publicId: 'IND-3', nom: 'Charlie' },
      )

      // When
      const result = await listIndicateurs({})

      // Then
      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual(['IND-1', 'IND-2', 'IND-3'])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(3)
    }),
  )

  it(
    "pagine quand le nombre d'indicateurs dépasse la taille de page",
    integrationTest(async () => {
      // Given
      await fixtures.indicateur(
        { publicId: 'IND-1' },
        { publicId: 'IND-2' },
        { publicId: 'IND-3' },
        { publicId: 'IND-4' },
        { publicId: 'IND-5' },
        { publicId: 'IND-6' },
      )

      // When
      const result = await listIndicateurs({})

      // Then
      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual(['IND-1', 'IND-2', 'IND-3', 'IND-4', 'IND-5'])
      expect(value.pagination).toEqual({ cursor: encodeCursor('IND-5'), hasMore: true })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'retourne la page suivante en utilisant le cursor',
    integrationTest(async () => {
      // Given
      await fixtures.indicateur(
        { publicId: 'IND-1' },
        { publicId: 'IND-2' },
        { publicId: 'IND-3' },
        { publicId: 'IND-4' },
        { publicId: 'IND-5' },
        { publicId: 'IND-6' },
      )

      // When
      const result = await listIndicateurs({ cursor: encodeCursor('IND-5') })

      // Then
      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual(['IND-6'])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'filtre les indicateurs par recherche de manière case-insensitive',
    integrationTest(async () => {
      // Given
      await fixtures.indicateur(
        { publicId: 'IND-1', nom: 'Taux de satisfaction' },
        { publicId: 'IND-2', nom: 'Délai moyen' },
        { publicId: 'IND-3', nom: 'SATISFACTION client' },
      )

      // When
      const result = await listIndicateurs({ recherche: 'satisfaction' })

      // Then
      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual(['IND-1', 'IND-3'])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(2)
    }),
  )

  it(
    'combine la recherche et la pagination',
    integrationTest(async () => {
      // Given
      await fixtures.indicateur(
        { publicId: 'IND-1', nom: 'Satisfaction 1' },
        { publicId: 'IND-2', nom: 'Satisfaction 2' },
        { publicId: 'IND-3', nom: 'Satisfaction 3' },
        { publicId: 'IND-4', nom: 'Satisfaction 4' },
        { publicId: 'IND-5', nom: 'Satisfaction 5' },
        { publicId: 'IND-6', nom: 'Satisfaction 6' },
        { publicId: 'IND-99', nom: 'Délai moyen' },
      )

      // When
      const result = await listIndicateurs({ recherche: 'satisfaction' })

      // Then
      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual(['IND-1', 'IND-2', 'IND-3', 'IND-4', 'IND-5'])
      expect(value.pagination).toEqual({ cursor: encodeCursor('IND-5'), hasMore: true })
      expect(value.total).toBe(6)
    }),
  )
})
