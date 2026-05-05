import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import { integrationTest } from '@/test/integrationTest'

describe('getIndicateurByPublicId', () => {
  it(
    "retourne l'indicateur correspondant au publicId",
    integrationTest(async () => {
      // Given
      const publicId = `IND-${Math.floor(Math.random() * 1_000_000)}`
      const created = await db().indicateur.create({
        data: { id: randomUUID(), publicId, nom: 'Indicateur de test' },
      })

      // When
      const result = await getIndicateurByPublicId(publicId)

      // Then
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        id: publicId,
        nom: 'Indicateur de test',
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      })
    }),
  )

  it(
    'lève une erreur Prisma quand aucun indicateur ne correspond',
    integrationTest(async () => {
      // Given
      const publicId = `IND-${Math.floor(Math.random() * 1_000_000)}`

      // When / Then
      await expect(getIndicateurByPublicId(publicId)).rejects.toThrow()
    }),
  )
})
