import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { upsertIndicateur } from '@/indicateur/commands/upsertIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId } from '@/test/randomIds'

describe.concurrent('upsertIndicateur', () => {
  it(
    'crée un indicateur quand le publicId est libre',
    integrationTest(async () => {
      // Given
      const indId = testIndicateurId()

      // When
      const result = await upsertIndicateur({ publicId: indId, nom: 'Nouvel indicateur' })

      // Then
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toMatchObject({
        id: indId,
        nom: 'Nouvel indicateur',
      })
      const persisted = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
      expect(persisted.nom).toBe('Nouvel indicateur')
    }),
  )

  it(
    "met à jour le nom et updatedAt quand l'indicateur existe déjà",
    integrationTest(async () => {
      // Given
      const indId = testIndicateurId()
      const original = await fixtures.indicateur({ publicId: indId, nom: 'Ancien nom' })

      // When
      const result = await upsertIndicateur({ publicId: indId, nom: 'Nom mis à jour' })

      // Then
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toMatchObject({
        id: indId,
        nom: 'Nom mis à jour',
        createdAt: original.createdAt.toISOString(),
      })
      expect(result._unsafeUnwrap().updatedAt >= original.updatedAt.toISOString()).toBe(true)
    }),
  )
})
