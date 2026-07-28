import { describe, expect, it } from 'vitest'

import { addCollectionResponsable } from '@/collection/commands/addCollectionResponsable'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionNumericId, testEmail } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

describe.concurrent('addCollectionResponsable', () => {
  it(
    'ajoute l’utilisateur aux responsables',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      await fixtures.collection({ publicId })
      const utilisateur = await fixtures.utilisateur({ email: testEmail() })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () =>
        addCollectionResponsable(publicId, { utilisateurId: utilisateur.id }),
      )

      expect(result._unsafeUnwrap().responsables).toEqual([
        expect.objectContaining({ id: utilisateur.id, email: utilisateur.email }),
      ])
    }),
  )

  it(
    'refuse un utilisateur déjà responsable',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const utilisateur = await fixtures.utilisateur({ email: testEmail() })
      await fixtures.collectionResponsable({
        collection: { publicId },
        utilisateur: { id: utilisateur.id, email: utilisateur.email },
      })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      await expect(
        runAsAdmin(apiKey.id, () =>
          addCollectionResponsable(publicId, { utilisateurId: utilisateur.id }),
        ),
      ).rejects.toThrow('Cet utilisateur est déjà responsable de la collection')
    }),
  )

  it(
    'refuse un utilisateur inconnu',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      await fixtures.collection({ publicId })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      await expect(
        runAsAdmin(apiKey.id, () =>
          addCollectionResponsable(publicId, {
            utilisateurId: '00000000-0000-4000-8000-000000000000',
          }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    'refuse une clé API non ADMIN',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      await fixtures.collection({ publicId })
      const utilisateur = await fixtures.utilisateur({ email: testEmail() })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsContributor(apiKey.id, () =>
          addCollectionResponsable(publicId, { utilisateurId: utilisateur.id }),
        ),
      ).rejects.toThrow('Cette opération requiert une clé API de rôle ADMIN')
    }),
  )
})
