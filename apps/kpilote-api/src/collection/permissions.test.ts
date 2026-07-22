import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import {
  ensureCollectionWritePermission,
  withCollectionReadPermission,
} from '@/collection/permissions'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionId } from '@/test/randomIds'

const listCollectionsWithReadPermission = async (principalId: string) =>
  db().collection.findMany({
    where: withCollectionReadPermission({}, principalId),
    select: { publicId: true },
    orderBy: { publicId: 'asc' },
  })

describe.concurrent('withCollectionReadPermission', () => {
  it(
    'expose un collection PUBLIC à un principal sans aucune permission',
    integrationTest(async () => {
      const panPub = testCollectionId()
      await fixtures.collection({ publicId: panPub, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const rows = await listCollectionsWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(panPub)
    }),
  )

  it(
    'cache un collection PRIVE à un principal sans permission',
    integrationTest(async () => {
      const panPri = testCollectionId()
      await fixtures.collection({ publicId: panPri, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      const rows = await listCollectionsWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).not.toContain(panPri)
    }),
  )

  it(
    'expose un collection PRIVE à un principal avec permission READ directe',
    integrationTest(async () => {
      const panPriRead = testCollectionId()
      await fixtures.collection({ publicId: panPriRead, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [{ collection: { publicId: panPriRead }, action: 'READ' }],
      })

      const rows = await listCollectionsWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(panPriRead)
    }),
  )

  it(
    'expose un collection PRIVE à un principal avec permission WRITE directe (WRITE implique READ)',
    integrationTest(async () => {
      const panPriWrite = testCollectionId()
      await fixtures.collection({ publicId: panPriWrite, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [{ collection: { publicId: panPriWrite }, action: 'WRITE' }],
      })

      const rows = await listCollectionsWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(panPriWrite)
    }),
  )

  it(
    'isole les permissions par principal : un collection PRIVE accessible à A reste caché à B',
    integrationTest(async () => {
      const panIso = testCollectionId()
      await fixtures.collection({ publicId: panIso, visibilite: 'PRIVE' })
      const [a, b] = await fixtures.apiKey(
        { collectionPermissions: [{ collection: { publicId: panIso }, action: 'READ' }] },
        {},
      )

      const rowsA = await listCollectionsWithReadPermission(a!.id)
      const rowsB = await listCollectionsWithReadPermission(b!.id)

      expect(rowsA.map((r) => r.publicId)).toContain(panIso)
      expect(rowsB.map((r) => r.publicId)).not.toContain(panIso)
    }),
  )

  it(
    'préserve le where externe (AND avec la clause de permission)',
    integrationTest(async () => {
      const panAndCible = testCollectionId()
      const panAndAutre = testCollectionId()
      await fixtures.collection(
        { publicId: panAndCible, nom: 'Cible', visibilite: 'PUBLIC' },
        { publicId: panAndAutre, nom: 'Autre', visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const rows = await db().collection.findMany({
        where: withCollectionReadPermission({ nom: 'Cible' }, apiKey.id),
        select: { publicId: true },
      })

      expect(rows.map((r) => r.publicId)).toEqual([panAndCible])
    }),
  )
})

describe.concurrent('ensureCollectionWritePermission', () => {
  it(
    'passe quand le principal a la permission WRITE directe',
    integrationTest(async () => {
      const panEwOk = testCollectionId()
      const collection = await fixtures.collection({ publicId: panEwOk, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [{ collection: { publicId: panEwOk }, action: 'WRITE' }],
      })

      const result = await ensureCollectionWritePermission({
        collectionId: collection.id,
        principalId: apiKey.id,
      })

      expect(result.isOk()).toBe(true)
    }),
  )

  it(
    "rejette quand le principal n'a aucune permission",
    integrationTest(async () => {
      const panEwNone = testCollectionId()
      const collection = await fixtures.collection({ publicId: panEwNone, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      await expect(
        ensureCollectionWritePermission({ collectionId: collection.id, principalId: apiKey.id }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    "rejette quand le principal n'a que la permission READ (READ n'implique pas WRITE)",
    integrationTest(async () => {
      const panEwRonly = testCollectionId()
      const collection = await fixtures.collection({ publicId: panEwRonly, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [{ collection: { publicId: panEwRonly }, action: 'READ' }],
      })

      await expect(
        ensureCollectionWritePermission({ collectionId: collection.id, principalId: apiKey.id }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    'rejette quand le collection est PUBLIC mais sans permission WRITE explicite (PUBLIC ne couvre que la lecture)',
    integrationTest(async () => {
      const panEwPub = testCollectionId()
      const collection = await fixtures.collection({ publicId: panEwPub, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      await expect(
        ensureCollectionWritePermission({ collectionId: collection.id, principalId: apiKey.id }),
      ).rejects.toThrow(/permission/i)
    }),
  )
})
