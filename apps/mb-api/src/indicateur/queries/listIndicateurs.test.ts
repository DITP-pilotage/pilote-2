import { describe, expect, it } from 'vitest'
import { uuidv7 } from 'uuidv7'

import { db } from '@/framework/persistence/dbStore'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'
import { integrationTest } from '@/test/integrationTest'

describe('listIndicateurs', () => {
  it(
    'retourne une liste vide quand aucun indicateur n\'existe',
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
      await db().indicateur.create({ data: { id: uuidv7(), publicId: 'IND-1', nom: 'Alpha' } })
      await db().indicateur.create({ data: { id: uuidv7(), publicId: 'IND-2', nom: 'Bravo' } })
      await db().indicateur.create({ data: { id: uuidv7(), publicId: 'IND-3', nom: 'Charlie' } })

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
    'pagine quand le nombre d\'indicateurs dépasse la taille de page',
    integrationTest(async () => {
      // Given
      for (let n = 1; n <= 6; n++) {
        await db().indicateur.create({
          data: { id: uuidv7(), publicId: `IND-${n}`, nom: `Indicateur ${n}` },
        })
      }

      // When
      const result = await listIndicateurs({})

      // Then
      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual(['IND-1', 'IND-2', 'IND-3', 'IND-4', 'IND-5'])
      expect(value.pagination).toEqual({ cursor: 'IND-5', hasMore: true })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'retourne la page suivante en utilisant le cursor',
    integrationTest(async () => {
      // Given
      for (let n = 1; n <= 6; n++) {
        await db().indicateur.create({
          data: { id: uuidv7(), publicId: `IND-${n}`, nom: `Indicateur ${n}` },
        })
      }

      // When
      const result = await listIndicateurs({ cursor: 'IND-5' })

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
      await db().indicateur.create({
        data: { id: uuidv7(), publicId: 'IND-1', nom: 'Taux de satisfaction' },
      })
      await db().indicateur.create({
        data: { id: uuidv7(), publicId: 'IND-2', nom: 'Délai moyen' },
      })
      await db().indicateur.create({
        data: { id: uuidv7(), publicId: 'IND-3', nom: 'SATISFACTION client' },
      })

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
      for (let n = 1; n <= 6; n++) {
        await db().indicateur.create({
          data: { id: uuidv7(), publicId: `IND-${n}`, nom: `Satisfaction ${n}` },
        })
      }
      await db().indicateur.create({
        data: { id: uuidv7(), publicId: 'IND-99', nom: 'Délai moyen' },
      })

      // When
      const result = await listIndicateurs({ recherche: 'satisfaction' })

      // Then
      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual(['IND-1', 'IND-2', 'IND-3', 'IND-4', 'IND-5'])
      expect(value.pagination).toEqual({ cursor: 'IND-5', hasMore: true })
      expect(value.total).toBe(6)
    }),
  )
})
