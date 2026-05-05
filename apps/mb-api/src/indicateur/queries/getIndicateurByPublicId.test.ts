import { describe, expect, it } from 'vitest'

import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe('getIndicateurByPublicId', () => {
  it(
    "retourne l'indicateur correspondant au publicId",
    integrationTest(async () => {
      // Given
      const created = await fixtures.indicateur({ publicId: 'IND-1', nom: 'Indicateur de test' })

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
