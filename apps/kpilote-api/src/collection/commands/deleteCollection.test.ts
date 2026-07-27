import { describe, expect, it } from 'vitest'

import { deleteCollection } from '@/collection/commands/deleteCollection'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionNumericId, testIndicateurId } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

describe.concurrent('deleteCollection', () => {
  it(
    'supprime la collection et ses affectations, sans toucher aux indicateurs',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const indicateurId = testIndicateurId()
      const collection = await fixtures.collection({
        publicId,
        indicateurs: [{ publicId: indicateurId }],
      })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      await runAsAdmin(apiKey.id, () => deleteCollection(publicId))

      expect(await db().collection.findUnique({ where: { publicId } })).toBeNull()
      expect(await db().collectionIndicateur.count({ where: { collectionId: collection.id } })).toBe(
        0,
      )
      expect(await db().indicateur.findUnique({ where: { publicId: indicateurId } })).not.toBeNull()
    }),
  )

  it(
    'reste idempotent sur une collection inexistante',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () =>
        deleteCollection(testCollectionNumericId()),
      )

      expect(result.isOk()).toBe(true)
    }),
  )

  it(
    'refuse une clé API non ADMIN',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      await fixtures.collection({ publicId })
      const apiKey = await fixtures.apiKey()

      await expect(runAsContributor(apiKey.id, () => deleteCollection(publicId))).rejects.toThrow(
        'Cette opération requiert une clé API de rôle ADMIN',
      )
    }),
  )
})
