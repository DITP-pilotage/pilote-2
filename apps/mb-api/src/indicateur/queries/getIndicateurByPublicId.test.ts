import { describe, expect, it } from 'vitest'

import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId } from '@/test/randomIds'

describe.concurrent('getIndicateurByPublicId', () => {
  it(
    "retourne l'indicateur correspondant au publicId",
    integrationTest(async () => {
      // Given
      const indId = testIndicateurId()
      const created = await fixtures.indicateur({ publicId: indId, nom: 'Indicateur de test' })

      // When
      const result = await getIndicateurByPublicId(indId)

      // Then
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        id: indId,
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
      await expect(getIndicateurByPublicId(testIndicateurId())).rejects.toThrow()
    }),
  )
})
