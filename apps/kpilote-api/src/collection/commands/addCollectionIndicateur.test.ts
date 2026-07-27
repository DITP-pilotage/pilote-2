import { describe, expect, it } from 'vitest'

import { addCollectionIndicateur } from '@/collection/commands/addCollectionIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionNumericId, testIndicateurId } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

describe.concurrent('addCollectionIndicateur', () => {
  it(
    'ajoute l’indicateur avec la pondération 1 par défaut',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const indicateurId = testIndicateurId()
      await fixtures.collection({ publicId })
      await fixtures.indicateur({ publicId: indicateurId })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () =>
        addCollectionIndicateur(publicId, { indicateurId }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([{ id: indicateurId, ponderation: 1 }])
    }),
  )

  it(
    'retient la pondération fournie',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const indicateurId = testIndicateurId()
      await fixtures.collection({ publicId })
      await fixtures.indicateur({ publicId: indicateurId })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () =>
        addCollectionIndicateur(publicId, { indicateurId, ponderation: 2.5 }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([{ id: indicateurId, ponderation: 2.5 }])
    }),
  )

  it(
    'refuse un indicateur déjà affecté',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const indicateurId = testIndicateurId()
      await fixtures.collection({ publicId, indicateurs: [{ publicId: indicateurId }] })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      await expect(
        runAsAdmin(apiKey.id, () => addCollectionIndicateur(publicId, { indicateurId })),
      ).rejects.toThrow('Cet indicateur est déjà affecté à la collection')
    }),
  )

  it(
    'refuse un indicateur inconnu',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      await fixtures.collection({ publicId })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      await expect(
        runAsAdmin(apiKey.id, () =>
          addCollectionIndicateur(publicId, { indicateurId: testIndicateurId() }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    'refuse une clé API non ADMIN',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const indicateurId = testIndicateurId()
      await fixtures.collection({ publicId })
      await fixtures.indicateur({ publicId: indicateurId })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsContributor(apiKey.id, () => addCollectionIndicateur(publicId, { indicateurId })),
      ).rejects.toThrow('Cette opération requiert une clé API de rôle ADMIN')
    }),
  )
})
