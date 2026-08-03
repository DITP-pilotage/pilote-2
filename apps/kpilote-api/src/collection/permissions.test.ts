import { PermissionAction } from '@/generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import {
  ensureCollectionWriteCommentPermission,
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
    'expose une collection PUBLIC à un principal sans aucune permission',
    integrationTest(async () => {
      const colPub = testCollectionId()
      await fixtures.collection({ publicId: colPub, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const rows = await listCollectionsWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(colPub)
    }),
  )

  it(
    'cache une collection PRIVE à un principal sans permission',
    integrationTest(async () => {
      const colPri = testCollectionId()
      await fixtures.collection({ publicId: colPri, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      const rows = await listCollectionsWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).not.toContain(colPri)
    }),
  )

  it(
    'expose une collection PRIVE à un principal avec permission READ directe',
    integrationTest(async () => {
      const colPriRead = testCollectionId()
      await fixtures.collection({ publicId: colPriRead, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [
          { collection: { publicId: colPriRead }, action: PermissionAction.READ },
        ],
      })

      const rows = await listCollectionsWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(colPriRead)
    }),
  )

  it(
    'expose une collection PRIVE à un principal avec permission WRITE directe (WRITE implique READ)',
    integrationTest(async () => {
      const colPriWrite = testCollectionId()
      await fixtures.collection({ publicId: colPriWrite, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [
          { collection: { publicId: colPriWrite }, action: PermissionAction.WRITE_COMMENT },
        ],
      })

      const rows = await listCollectionsWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(colPriWrite)
    }),
  )

  it(
    'isole les permissions par principal : une collection PRIVE accessible à A reste caché à B',
    integrationTest(async () => {
      const colIso = testCollectionId()
      await fixtures.collection({ publicId: colIso, visibilite: 'PRIVE' })
      const [a, b] = await fixtures.apiKey(
        {
          collectionPermissions: [
            { collection: { publicId: colIso }, action: PermissionAction.READ },
          ],
        },
        {},
      )

      const rowsA = await listCollectionsWithReadPermission(a!.id)
      const rowsB = await listCollectionsWithReadPermission(b!.id)

      expect(rowsA.map((r) => r.publicId)).toContain(colIso)
      expect(rowsB.map((r) => r.publicId)).not.toContain(colIso)
    }),
  )

  it(
    'préserve le where externe (AND avec la clause de permission)',
    integrationTest(async () => {
      const colAndCible = testCollectionId()
      const colAndAutre = testCollectionId()
      await fixtures.collection(
        { publicId: colAndCible, nom: 'Cible', visibilite: 'PUBLIC' },
        { publicId: colAndAutre, nom: 'Autre', visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const rows = await db().collection.findMany({
        where: withCollectionReadPermission({ nom: 'Cible' }, apiKey.id),
        select: { publicId: true },
      })

      expect(rows.map((r) => r.publicId)).toEqual([colAndCible])
    }),
  )
})

describe.concurrent('ensureCollectionWriteCommentPermission', () => {
  it(
    'passe quand le principal a la permission WRITE directe',
    integrationTest(async () => {
      const colEwOk = testCollectionId()
      const collection = await fixtures.collection({ publicId: colEwOk, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [
          { collection: { publicId: colEwOk }, action: PermissionAction.WRITE_COMMENT },
        ],
      })

      const result = await ensureCollectionWriteCommentPermission({
        collectionId: collection.id,
        principalId: apiKey.id,
      })

      expect(result.isOk()).toBe(true)
    }),
  )

  it(
    "rejette quand le principal n'a aucune permission",
    integrationTest(async () => {
      const colEwNone = testCollectionId()
      const collection = await fixtures.collection({ publicId: colEwNone, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      await expect(
        ensureCollectionWriteCommentPermission({
          collectionId: collection.id,
          principalId: apiKey.id,
        }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    "rejette quand le principal n'a que la permission READ (READ n'implique pas WRITE)",
    integrationTest(async () => {
      const colEwRonly = testCollectionId()
      const collection = await fixtures.collection({ publicId: colEwRonly, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [
          { collection: { publicId: colEwRonly }, action: PermissionAction.READ },
        ],
      })

      await expect(
        ensureCollectionWriteCommentPermission({
          collectionId: collection.id,
          principalId: apiKey.id,
        }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    'rejette quand la collection est PUBLIC mais sans permission WRITE explicite (PUBLIC ne couvre que la lecture)',
    integrationTest(async () => {
      const colEwPub = testCollectionId()
      const collection = await fixtures.collection({ publicId: colEwPub, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      await expect(
        ensureCollectionWriteCommentPermission({
          collectionId: collection.id,
          principalId: apiKey.id,
        }),
      ).rejects.toThrow(/permission/i)
    }),
  )
})
