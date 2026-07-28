import { describe, expect, it } from 'vitest'

import { upsertCollection } from '@/collection/commands/upsertCollection'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionNumericId, testIndicateurId } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

describe.concurrent('upsertCollection', () => {
  it(
    'crée la collection quand l’identifiant est libre',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () =>
        upsertCollection(publicId, {
          nom: 'Créée par PUT',
          description: 'Description',
          visibilite: 'PRIVE',
        }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        id: publicId,
        nom: 'Créée par PUT',
        description: 'Description',
        visibilite: 'PRIVE',
      })
    }),
  )

  it(
    'remplace les champs scalaires sans toucher aux indicateurs affectés',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const indicateurId = testIndicateurId()
      await fixtures.collection({
        publicId,
        nom: 'Ancien nom',
        description: 'Ancienne description',
        visibilite: 'PRIVE',
        indicateurs: [{ publicId: indicateurId }],
      })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () =>
        upsertCollection(publicId, {
          nom: 'Nouveau nom',
          description: null,
          visibilite: 'PUBLIC',
        }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        nom: 'Nouveau nom',
        description: null,
        visibilite: 'PUBLIC',
        indicateurs: [{ id: indicateurId, ponderation: 1 }],
      })
    }),
  )

  it(
    'refuse une clé API non ADMIN',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsContributor(apiKey.id, () =>
          upsertCollection(testCollectionNumericId(), {
            nom: 'X',
            description: null,
            visibilite: 'PUBLIC',
          }),
        ),
      ).rejects.toThrow('Cette opération requiert une clé API de rôle ADMIN')
    }),
  )
})
