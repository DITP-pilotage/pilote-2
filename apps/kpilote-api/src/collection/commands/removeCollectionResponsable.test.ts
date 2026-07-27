import { describe, expect, it } from 'vitest'

import { removeCollectionResponsable } from '@/collection/commands/removeCollectionResponsable'
import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionNumericId, testEmail } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

describe.concurrent('removeCollectionResponsable', () => {
  it(
    'retire le responsable sans supprimer l’utilisateur',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const utilisateur = await fixtures.utilisateur({ email: testEmail() })
      await fixtures.collectionResponsable({
        collection: { publicId },
        utilisateur: { id: utilisateur.id, email: utilisateur.email },
      })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      await runAsAdmin(apiKey.id, () => removeCollectionResponsable(publicId, utilisateur.id))

      const collection = await runAsAdmin(apiKey.id, () => getCollectionByPublicId(publicId))
      expect(collection._unsafeUnwrap().responsables).toEqual([])
      expect(await db().utilisateur.findUnique({ where: { id: utilisateur.id } })).not.toBeNull()
    }),
  )

  it(
    'reste idempotent sur un utilisateur non responsable',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      await fixtures.collection({ publicId })
      const utilisateur = await fixtures.utilisateur({ email: testEmail() })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () =>
        removeCollectionResponsable(publicId, utilisateur.id),
      )

      expect(result.isOk()).toBe(true)
    }),
  )

  it(
    'refuse une clé API non ADMIN',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const utilisateur = await fixtures.utilisateur({ email: testEmail() })
      await fixtures.collectionResponsable({
        collection: { publicId },
        utilisateur: { id: utilisateur.id, email: utilisateur.email },
      })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsContributor(apiKey.id, () => removeCollectionResponsable(publicId, utilisateur.id)),
      ).rejects.toThrow('Cette opération requiert une clé API de rôle ADMIN')
    }),
  )
})
