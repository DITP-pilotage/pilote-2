import { describe, expect, it } from 'vitest'

import { listerMesPermissions } from '@/me/queries/listerMesPermissions'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds, testCollectionId } from '@/test/randomIds'
import { runAsAdmin, runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listerMesPermissions', () => {
  it(
    'renvoie des listes vides quand le principal n’a aucune permission',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      expect(result._unsafeUnwrap()).toEqual({ collections: [], indicateurs: [] })
    }),
  )

  it(
    'renvoie isAdmin: true et des listes vides pour une API key ADMIN',
    integrationTest(async () => {
      const collectionId = testCollectionId()
      const [indicateurId] = testIndicateurIds(1)
      // On crée des permissions explicites pour vérifier qu'elles sont quand même
      // ignorées (le client doit s'appuyer uniquement sur isAdmin).
      await fixtures.collection({
        publicId: collectionId,
        indicateurs: [{ publicId: indicateurId }],
      })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [{ collection: { publicId: collectionId }, action: 'WRITE' }],
      })

      const result = await runAsAdmin(apiKey.id, () => listerMesPermissions())

      expect(result._unsafeUnwrap()).toEqual({
        isAdmin: true,
        collections: [],
        indicateurs: [],
      })
    }),
  )

  it(
    'inclut les permissions directes sur les collections et les indicateurs',
    integrationTest(async () => {
      const collectionId = testCollectionId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.collection({ publicId: collectionId })
      await fixtures.indicateur({ publicId: indicateurId })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [{ collection: { publicId: collectionId }, action: 'READ' }],
        permissions: [{ indicateur: { publicId: indicateurId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      expect(result._unsafeUnwrap()).toEqual({
        collections: [{ id: collectionId, actions: ['READ'] }],
        indicateurs: [{ id: indicateurId, actions: ['WRITE'] }],
      })
    }),
  )

  it(
    'fusionne READ et WRITE directs sur la même ressource en une seule entrée triée READ avant WRITE',
    integrationTest(async () => {
      const collectionId = testCollectionId()
      await fixtures.collection({ publicId: collectionId })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [
          { collection: { publicId: collectionId }, action: 'WRITE' },
          { collection: { publicId: collectionId }, action: 'READ' },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      expect(result._unsafeUnwrap().collections).toEqual([
        { id: collectionId, actions: ['READ', 'WRITE'] },
      ])
    }),
  )

  it(
    'propage READ collection → READ sur tous ses indicateurs (depuis READ ou WRITE collection)',
    integrationTest(async () => {
      const collectionWriteId = testCollectionId()
      const collectionReadId = testCollectionId()
      const [indWrite1, indWrite2, indRead] = testIndicateurIds(3)
      await fixtures.collection(
        {
          publicId: collectionWriteId,
          indicateurs: [{ publicId: indWrite1 }, { publicId: indWrite2 }],
        },
        { publicId: collectionReadId, indicateurs: [{ publicId: indRead }] },
      )
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [
          { collection: { publicId: collectionWriteId }, action: 'WRITE' },
          { collection: { publicId: collectionReadId }, action: 'READ' },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      // Les 3 indicateurs liés sont propagés en READ. WRITE collection ne propage jamais WRITE.
      const indicateurs = result._unsafeUnwrap().indicateurs
      expect(indicateurs).toEqual(
        [
          { id: indWrite1, actions: ['READ'] },
          { id: indWrite2, actions: ['READ'] },
          { id: indRead, actions: ['READ'] },
        ].sort((a, b) => a.id.localeCompare(b.id)),
      )
    }),
  )

  it(
    'fusionne une permission directe et la propagation collection en une seule entrée dédupliquée',
    integrationTest(async () => {
      const collectionId = testCollectionId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.collection({
        publicId: collectionId,
        indicateurs: [{ publicId: indicateurId }],
      })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [{ collection: { publicId: collectionId }, action: 'WRITE' }],
        permissions: [{ indicateur: { publicId: indicateurId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      // READ direct + READ propagé via collectionWrite → une seule entrée, pas de doublon.
      expect(result._unsafeUnwrap().indicateurs).toEqual([{ id: indicateurId, actions: ['READ'] }])
    }),
  )

  it(
    'combine WRITE direct sur indicateur et READ propagé en une entrée triée READ avant WRITE',
    integrationTest(async () => {
      const collectionId = testCollectionId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.collection({
        publicId: collectionId,
        indicateurs: [{ publicId: indicateurId }],
      })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [{ collection: { publicId: collectionId }, action: 'READ' }],
        permissions: [{ indicateur: { publicId: indicateurId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      expect(result._unsafeUnwrap().indicateurs).toEqual([
        { id: indicateurId, actions: ['READ', 'WRITE'] },
      ])
    }),
  )

  it(
    'trie collections et indicateurs par id ASC indépendamment de l’ordre de création',
    integrationTest(async () => {
      const indicateurs = testIndicateurIds(3) // tuple trié ASC
      const collections = [testCollectionId(), testCollectionId(), testCollectionId()].sort()
      await fixtures.collection(
        { publicId: collections[2]! },
        { publicId: collections[0]! },
        { publicId: collections[1]! },
      )
      await fixtures.indicateur(
        { publicId: indicateurs[2] },
        { publicId: indicateurs[0] },
        { publicId: indicateurs[1] },
      )
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [
          { collection: { publicId: collections[2]! }, action: 'READ' },
          { collection: { publicId: collections[0]! }, action: 'READ' },
          { collection: { publicId: collections[1]! }, action: 'READ' },
        ],
        permissions: [
          { indicateur: { publicId: indicateurs[2] }, action: 'WRITE' },
          { indicateur: { publicId: indicateurs[0] }, action: 'WRITE' },
          { indicateur: { publicId: indicateurs[1] }, action: 'WRITE' },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      const value = result._unsafeUnwrap()
      expect(value.collections.map((p) => p.id)).toEqual(collections)
      expect(value.indicateurs.map((i) => i.id)).toEqual(indicateurs)
    }),
  )
})
