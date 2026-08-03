import { PermissionAction } from '@/generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { listCollectionPermissions } from '@/collection/queries/listCollectionPermissions'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionNumericId, testEmail } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

describe.concurrent('listCollectionPermissions', () => {
  it(
    'retourne une liste vide quand personne n’a de permission directe',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      await fixtures.collection({ publicId })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () => listCollectionPermissions(publicId))

      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  it(
    'regroupe les actions d’un utilisateur en une seule entrée, READ avant WRITE',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const email = testEmail()
      const utilisateur = await fixtures.utilisateur({
        email,
        collectionPermissions: [
          { collection: { publicId }, action: PermissionAction.WRITE_COMMENT },
          { collection: { publicId }, action: PermissionAction.READ },
        ],
      })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () => listCollectionPermissions(publicId))

      expect(result._unsafeUnwrap().items).toEqual([
        {
          principalId: utilisateur.id,
          type: 'UTILISATEUR',
          libelle: email,
          actions: [PermissionAction.READ, PermissionAction.WRITE_COMMENT],
        },
      ])
    }),
  )

  it(
    'trie par type puis libellé, clés API et utilisateurs confondus',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const email = testEmail()
      const cle = await fixtures.apiKey({
        label: 'sync-ppg',
        collectionPermissions: [{ collection: { publicId }, action: PermissionAction.READ }],
      })
      const utilisateur = await fixtures.utilisateur({
        email,
        collectionPermissions: [{ collection: { publicId }, action: PermissionAction.READ }],
      })
      const admin = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(admin.id, () => listCollectionPermissions(publicId))

      expect(result._unsafeUnwrap().items).toEqual([
        {
          principalId: cle.id,
          type: 'API_KEY',
          libelle: 'sync-ppg',
          actions: [PermissionAction.READ],
        },
        {
          principalId: utilisateur.id,
          type: 'UTILISATEUR',
          libelle: email,
          actions: [PermissionAction.READ],
        },
      ])
    }),
  )

  it(
    'refuse la lecture à une clé non ADMIN',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      await fixtures.collection({ publicId })
      await fixtures.utilisateur({
        email: testEmail(),
        collectionPermissions: [{ collection: { publicId }, action: PermissionAction.READ }],
      })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsContributor(apiKey.id, () => listCollectionPermissions(publicId)),
      ).rejects.toThrow('Cette opération requiert une clé API de rôle ADMIN')
    }),
  )
})
