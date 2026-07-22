import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import {
  ensureIndicateurWritePermission,
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
        permissions: [{ indicateur: { publicId: priv }, action: 'READ' }],
      })

      const rows = await listIndicateursWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(priv)
    }),
  )

  it(
    'expose un indicateur PRIVE à un principal avec permission WRITE directe (WRITE implique READ)',
    integrationTest(async () => {
      const [priv] = testIndicateurIds(1)
      await fixtures.indicateur({ publicId: priv, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: priv }, action: 'WRITE' }],
      })

      const rows = await listIndicateursWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(priv)
    }),
  )

  it(
    'propage READ depuis un collection (action READ sur le collection)',
    integrationTest(async () => {
      const [viaCollection] = testIndicateurIds(1)
      const panRpropR = testCollectionId()
      await fixtures.indicateur({ publicId: viaCollection, visibilite: 'PRIVE' })
      await fixtures.collection({
        publicId: panRpropR,
        visibilite: 'PRIVE',
        indicateurs: [{ publicId: viaCollection }],
      })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [{ collection: { publicId: panRpropR }, action: 'READ' }],
      })

      const rows = await listIndicateursWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(viaCollection)
    }),
  )

  it(
    'propage READ depuis un collection (action WRITE sur le collection)',
    integrationTest(async () => {
      const [viaCollection] = testIndicateurIds(1)
      const panRpropW = testCollectionId()
      await fixtures.indicateur({ publicId: viaCollection, visibilite: 'PRIVE' })
      await fixtures.collection({
        publicId: panRpropW,
        visibilite: 'PRIVE',
        indicateurs: [{ publicId: viaCollection }],
      })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [{ collection: { publicId: panRpropW }, action: 'WRITE' }],
      })

      const rows = await listIndicateursWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(viaCollection)
    }),
  )

  it(
    "ne propage rien depuis un collection auquel le principal n'a pas accès",
    integrationTest(async () => {
      const [hidden] = testIndicateurIds(1)
      const panRpropNone = testCollectionId()
      await fixtures.indicateur({ publicId: hidden, visibilite: 'PRIVE' })
      await fixtures.collection({
        publicId: panRpropNone,
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

describe.concurrent('ensureIndicateurWritePermission', () => {
  it(
    'passe quand le principal a la permission WRITE directe',
    integrationTest(async () => {
      const [pub] = testIndicateurIds(1)
      const indicateur = await fixtures.indicateur({ publicId: pub, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: pub }, action: 'WRITE' }],
      })

      const result = await ensureIndicateurWritePermission({
        indicateurId: indicateur.id,
        principalId: apiKey.id,
      })

      expect(result.isOk()).toBe(true)
    }),
  )

  it(
    "rejette quand le principal n'a que la permission READ (READ n'implique pas WRITE)",
    integrationTest(async () => {
      const [pub] = testIndicateurIds(1)
      const indicateur = await fixtures.indicateur({ publicId: pub, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: pub }, action: 'READ' }],
      })

      await expect(
        ensureIndicateurWritePermission({
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
        ensureIndicateurWritePermission({
          indicateurId: indicateur.id,
          principalId: apiKey.id,
        }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    "rejette même si le principal a WRITE sur un collection qui contient l'indicateur (WRITE indicateur reste direct, pas de propagation)",
    integrationTest(async () => {
      const [viaCollection] = testIndicateurIds(1)
      const panWpropNo = testCollectionId()
      const indicateur = await fixtures.indicateur({ publicId: viaCollection, visibilite: 'PRIVE' })
      await fixtures.collection({
        publicId: panWpropNo,
        visibilite: 'PRIVE',
        indicateurs: [{ publicId: viaCollection }],
      })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [{ collection: { publicId: panWpropNo }, action: 'WRITE' }],
      })

      await expect(
        ensureIndicateurWritePermission({
          indicateurId: indicateur.id,
          principalId: apiKey.id,
        }),
      ).rejects.toThrow(/permission/i)
    }),
  )
})
