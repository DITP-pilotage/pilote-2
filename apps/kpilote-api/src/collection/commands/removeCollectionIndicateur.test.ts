import { describe, expect, it } from 'vitest'

import { removeCollectionIndicateur } from '@/collection/commands/removeCollectionIndicateur'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionNumericId, testIndicateurId } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

describe.concurrent('removeCollectionIndicateur', () => {
  it(
    'retire le lien sans supprimer l’indicateur',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const indicateurId = testIndicateurId()
      const collection = await fixtures.collection({
        publicId,
        indicateurs: [{ publicId: indicateurId }],
      })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      await runAsAdmin(apiKey.id, () => removeCollectionIndicateur(publicId, indicateurId))

      expect(await db().collectionIndicateur.count({ where: { collectionId: collection.id } })).toBe(
        0,
      )
      expect(await db().indicateur.findUnique({ where: { publicId: indicateurId } })).not.toBeNull()
    }),
  )

  it(
    'reste idempotent sur un lien absent',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const indicateurId = testIndicateurId()
      await fixtures.collection({ publicId })
      await fixtures.indicateur({ publicId: indicateurId })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () =>
        removeCollectionIndicateur(publicId, indicateurId),
      )

      expect(result.isOk()).toBe(true)
    }),
  )

  it(
    'refuse une clé API non ADMIN',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const indicateurId = testIndicateurId()
      await fixtures.collection({ publicId, indicateurs: [{ publicId: indicateurId }] })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsContributor(apiKey.id, () => removeCollectionIndicateur(publicId, indicateurId)),
      ).rejects.toThrow('Cette opération requiert une clé API de rôle ADMIN')
    }),
  )
})
