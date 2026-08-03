import { CollectionPermissionAction, IndicateurPermissionAction } from '@/generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import {
  ensureIndicateurWriteDataPermission,
  ensureIndicateurWriteCommentPermission,
  withIndicateurReadPermission,
} from '@/indicateur/permissions'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds, testCollectionId } from '@/test/randomIds'

const listIndicateursWithReadPermission = async (principalId: string, isAdmin = false) =>
  db().indicateur.findMany({
    where: withIndicateurReadPermission({}, principalId, { isAdmin }),
    select: { publicId: true },
    orderBy: { publicId: 'asc' },
  })

describe.concurrent('withIndicateurReadPermission', () => {
  it(
    'expose un indicateur PUBLIC à un principal sans aucune permission',
    integrationTest(async () => {
      const [pub] = testIndicateurIds(1)
      await fixtures.indicateur({ publicId: pub, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const rows = await listIndicateursWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(pub)
    }),
  )

  it(
    'cache un indicateur PRIVE à un principal sans aucune permission',
    integrationTest(async () => {
      const [priv] = testIndicateurIds(1)
      await fixtures.indicateur({ publicId: priv, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      const rows = await listIndicateursWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).not.toContain(priv)
    }),
  )

  it(
    'expose un indicateur PRIVE à un principal avec permission READ directe',
    integrationTest(async () => {
      const [priv] = testIndicateurIds(1)
      await fixtures.indicateur({ publicId: priv, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: priv }, action: IndicateurPermissionAction.READ }],
      })

      const rows = await listIndicateursWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(priv)
    }),
  )

  it(
    'expose un indicateur PRIVE à un principal avec permission WRITE_DATA directe (WRITE_DATA implique READ)',
    integrationTest(async () => {
      const [priv] = testIndicateurIds(1)
      await fixtures.indicateur({ publicId: priv, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: priv }, action: IndicateurPermissionAction.WRITE_DATA }],
      })

      const rows = await listIndicateursWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(priv)
    }),
  )

  it(
    'expose un indicateur PRIVE à un principal avec permission WRITE_COMMENT directe (WRITE_COMMENT implique READ)',
    integrationTest(async () => {
      const [priv] = testIndicateurIds(1)
      await fixtures.indicateur({ publicId: priv, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: priv }, action: IndicateurPermissionAction.WRITE_COMMENT }],
      })

      const rows = await listIndicateursWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(priv)
    }),
  )

  it(
    'propage READ depuis une collection (action READ sur la collection)',
    integrationTest(async () => {
      const [viaCollection] = testIndicateurIds(1)
      const colRpropR = testCollectionId()
      await fixtures.indicateur({ publicId: viaCollection, visibilite: 'PRIVE' })
      await fixtures.collection({
        publicId: colRpropR,
        visibilite: 'PRIVE',
        indicateurs: [{ publicId: viaCollection }],
      })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [
          { collection: { publicId: colRpropR }, action: CollectionPermissionAction.READ },
        ],
      })

      const rows = await listIndicateursWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(viaCollection)
    }),
  )

  it(
    'propage READ depuis une collection (action WRITE_COMMENT sur la collection)',
    integrationTest(async () => {
      const [viaCollection] = testIndicateurIds(1)
      const colRpropW = testCollectionId()
      await fixtures.indicateur({ publicId: viaCollection, visibilite: 'PRIVE' })
      await fixtures.collection({
        publicId: colRpropW,
        visibilite: 'PRIVE',
        indicateurs: [{ publicId: viaCollection }],
      })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [
          { collection: { publicId: colRpropW }, action: CollectionPermissionAction.WRITE_COMMENT },
        ],
      })

      const rows = await listIndicateursWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(viaCollection)
    }),
  )

  it(
    "ne propage rien depuis une collection auquel le principal n'a pas accès",
    integrationTest(async () => {
      const [hidden] = testIndicateurIds(1)
      const colRpropNone = testCollectionId()
      await fixtures.indicateur({ publicId: hidden, visibilite: 'PRIVE' })
      await fixtures.collection({
        publicId: colRpropNone,
        visibilite: 'PRIVE',
        indicateurs: [{ publicId: hidden }],
      })
      const apiKey = await fixtures.apiKey()

      const rows = await listIndicateursWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).not.toContain(hidden)
    }),
  )

  it(
    'préserve le where externe (AND avec la clause de permission)',
    integrationTest(async () => {
      const [a, b] = testIndicateurIds(2)
      await fixtures.indicateur(
        { publicId: a, nom: 'Cible', visibilite: 'PUBLIC' },
        { publicId: b, nom: 'Autre', visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const rows = await db().indicateur.findMany({
        where: withIndicateurReadPermission({ nom: 'Cible' }, apiKey.id, { isAdmin: false }),
        select: { publicId: true },
      })

      expect(rows.map((r) => r.publicId)).toEqual([a])
    }),
  )

  it(
    'expose un indicateur PRIVE à un principal ADMIN, sans aucune permission (bypass)',
    integrationTest(async () => {
      const [priv] = testIndicateurIds(1)
      await fixtures.indicateur({ publicId: priv, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      const rows = await listIndicateursWithReadPermission(apiKey.id, true)

      expect(rows.map((r) => r.publicId)).toContain(priv)
    }),
  )
})

describe.concurrent('ensureIndicateurWriteDataPermission', () => {
  it(
    'passe quand le principal a la permission WRITE_DATA directe',
    integrationTest(async () => {
      const [pub] = testIndicateurIds(1)
      const indicateur = await fixtures.indicateur({ publicId: pub, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: pub }, action: IndicateurPermissionAction.WRITE_DATA }],
      })

      const result = await ensureIndicateurWriteDataPermission({
        indicateurId: indicateur.id,
        principalId: apiKey.id,
      })

      expect(result.isOk()).toBe(true)
    }),
  )

  it(
    "rejette quand le principal n'a que la permission READ (READ n'implique pas WRITE_DATA)",
    integrationTest(async () => {
      const [pub] = testIndicateurIds(1)
      const indicateur = await fixtures.indicateur({ publicId: pub, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: pub }, action: IndicateurPermissionAction.READ }],
      })

      await expect(
        ensureIndicateurWriteDataPermission({
          indicateurId: indicateur.id,
          principalId: apiKey.id,
        }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    "rejette quand le principal a seulement WRITE_COMMENT (WRITE_COMMENT n'implique pas WRITE_DATA)",
    integrationTest(async () => {
      const [pub] = testIndicateurIds(1)
      const indicateur = await fixtures.indicateur({ publicId: pub, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: pub }, action: IndicateurPermissionAction.WRITE_COMMENT }],
      })

      await expect(
        ensureIndicateurWriteDataPermission({
          indicateurId: indicateur.id,
          principalId: apiKey.id,
        }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    "rejette même si l'indicateur est PUBLIC (PUBLIC ne couvre que la lecture)",
    integrationTest(async () => {
      const [pub] = testIndicateurIds(1)
      const indicateur = await fixtures.indicateur({ publicId: pub, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      await expect(
        ensureIndicateurWriteDataPermission({
          indicateurId: indicateur.id,
          principalId: apiKey.id,
        }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    "rejette même si le principal a WRITE_COMMENT sur une collection qui contient l'indicateur (WRITE_DATA reste direct, pas de propagation)",
    integrationTest(async () => {
      const [viaCollection] = testIndicateurIds(1)
      const colWpropNo = testCollectionId()
      const indicateur = await fixtures.indicateur({ publicId: viaCollection, visibilite: 'PRIVE' })
      await fixtures.collection({
        publicId: colWpropNo,
        visibilite: 'PRIVE',
        indicateurs: [{ publicId: viaCollection }],
      })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [
          { collection: { publicId: colWpropNo }, action: CollectionPermissionAction.WRITE_COMMENT },
        ],
      })

      await expect(
        ensureIndicateurWriteDataPermission({
          indicateurId: indicateur.id,
          principalId: apiKey.id,
        }),
      ).rejects.toThrow(/permission/i)
    }),
  )
})

describe.concurrent('ensureIndicateurWriteCommentPermission', () => {
  it(
    'passe quand le principal a la permission WRITE_COMMENT directe',
    integrationTest(async () => {
      const [pub] = testIndicateurIds(1)
      const indicateur = await fixtures.indicateur({ publicId: pub, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: pub }, action: IndicateurPermissionAction.WRITE_COMMENT }],
      })

      const result = await ensureIndicateurWriteCommentPermission({
        indicateurId: indicateur.id,
        principalId: apiKey.id,
      })

      expect(result.isOk()).toBe(true)
    }),
  )

  it(
    "rejette quand le principal n'a que la permission READ (READ n'implique pas WRITE_COMMENT)",
    integrationTest(async () => {
      const [pub] = testIndicateurIds(1)
      const indicateur = await fixtures.indicateur({ publicId: pub, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: pub }, action: IndicateurPermissionAction.READ }],
      })

      await expect(
        ensureIndicateurWriteCommentPermission({
          indicateurId: indicateur.id,
          principalId: apiKey.id,
        }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    "rejette quand le principal a seulement WRITE_DATA (WRITE_DATA n'implique pas WRITE_COMMENT)",
    integrationTest(async () => {
      const [pub] = testIndicateurIds(1)
      const indicateur = await fixtures.indicateur({ publicId: pub, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: pub }, action: IndicateurPermissionAction.WRITE_DATA }],
      })

      await expect(
        ensureIndicateurWriteCommentPermission({
          indicateurId: indicateur.id,
          principalId: apiKey.id,
        }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    "rejette même si l'indicateur est PUBLIC",
    integrationTest(async () => {
      const [pub] = testIndicateurIds(1)
      const indicateur = await fixtures.indicateur({ publicId: pub, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      await expect(
        ensureIndicateurWriteCommentPermission({
          indicateurId: indicateur.id,
          principalId: apiKey.id,
        }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    "rejette même si le principal a WRITE_COMMENT sur une collection qui contient l'indicateur (WRITE_COMMENT indicateur reste direct, pas de propagation)",
    integrationTest(async () => {
      const [viaCollection] = testIndicateurIds(1)
      const colWpropNo = testCollectionId()
      const indicateur = await fixtures.indicateur({ publicId: viaCollection, visibilite: 'PRIVE' })
      await fixtures.collection({
        publicId: colWpropNo,
        visibilite: 'PRIVE',
        indicateurs: [{ publicId: viaCollection }],
      })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [
          { collection: { publicId: colWpropNo }, action: CollectionPermissionAction.WRITE_COMMENT },
        ],
      })

      await expect(
        ensureIndicateurWriteCommentPermission({
          indicateurId: indicateur.id,
          principalId: apiKey.id,
        }),
      ).rejects.toThrow(/permission/i)
    }),
  )
})
