import { describe, expect, it } from 'vitest'

import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('getIndicateurByPublicId', () => {
  it(
    "retourne l'indicateur quand le principal a la permission READ",
    integrationTest(async () => {
      // Given
      const indId = testIndicateurId()
      const created = await fixtures.indicateur({ publicId: indId, nom: 'Indicateur de test' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      // When
      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))

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
    "retourne l'indicateur quand le principal a la permission WRITE (WRITE implique READ)",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))

      expect(result.isOk()).toBe(true)
    }),
  )

  it(
    "lève une erreur quand le principal n'a aucune permission sur l'indicateur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId)),
      ).rejects.toThrow()
    }),
  )

  it(
    'lève une erreur quand aucun indicateur ne correspond',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      await expect(
        runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(testIndicateurId())),
      ).rejects.toThrow()
    }),
  )
})
