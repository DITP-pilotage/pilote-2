import { describe, expect, it } from 'vitest'
import { uuidv7 } from 'uuidv7'

import { db } from '@/framework/persistence/dbStore'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import { integrationTest } from '@/test/integrationTest'

describe('getIndicateurByPublicId', () => {
  it(
    "retourne l'indicateur correspondant au publicId",
    integrationTest(async () => {
      // Given
      const created = await db().indicateur.create({
        data: { id: uuidv7(), publicId: 'IND-1', nom: 'Indicateur de test' },
      })

      // When
      const result = await getIndicateurByPublicId('IND-1')

      // Then
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        id: 'IND-1',
        nom: 'Indicateur de test',
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      })
    }),
  )

  it(
    'lève une erreur Prisma quand aucun indicateur ne correspond',
    integrationTest(async () => {
      // When / Then
      await expect(getIndicateurByPublicId('IND-404')).rejects.toThrow()
    }),
  )
})
