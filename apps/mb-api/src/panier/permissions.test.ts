import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { ensurePanierWritePermission, withPanierReadPermission } from '@/panier/permissions'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testPanierId } from '@/test/randomIds'

const listPaniersWithReadPermission = async (principalId: string) =>
  db().panier.findMany({
    where: withPanierReadPermission({}, principalId),
    select: { publicId: true },
    orderBy: { publicId: 'asc' },
  })

describe.concurrent('withPanierReadPermission', () => {
  it(
    'expose un panier PUBLIC à un principal sans aucune permission',
    integrationTest(async () => {
      const panPub = testPanierId()
      await fixtures.panier({ publicId: panPub, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const rows = await listPaniersWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(panPub)
    }),
  )

  it(
    'cache un panier PRIVE à un principal sans permission',
    integrationTest(async () => {
      const panPri = testPanierId()
      await fixtures.panier({ publicId: panPri, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      const rows = await listPaniersWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).not.toContain(panPri)
    }),
  )

  it(
    'expose un panier PRIVE à un principal avec permission READ directe',
    integrationTest(async () => {
      const panPriRead = testPanierId()
      await fixtures.panier({ publicId: panPriRead, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: panPriRead }, action: 'READ' }],
      })

      const rows = await listPaniersWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(panPriRead)
    }),
  )

  it(
    'expose un panier PRIVE à un principal avec permission WRITE directe (WRITE implique READ)',
    integrationTest(async () => {
      const panPriWrite = testPanierId()
      await fixtures.panier({ publicId: panPriWrite, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: panPriWrite }, action: 'WRITE' }],
      })

      const rows = await listPaniersWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(panPriWrite)
    }),
  )

  it(
    'isole les permissions par principal : un panier PRIVE accessible à A reste caché à B',
    integrationTest(async () => {
      const panIso = testPanierId()
      await fixtures.panier({ publicId: panIso, visibilite: 'PRIVE' })
      const [a, b] = await fixtures.apiKey(
        { panierPermissions: [{ panier: { publicId: panIso }, action: 'READ' }] },
        {},
      )

      const rowsA = await listPaniersWithReadPermission(a!.id)
      const rowsB = await listPaniersWithReadPermission(b!.id)

      expect(rowsA.map((r) => r.publicId)).toContain(panIso)
      expect(rowsB.map((r) => r.publicId)).not.toContain(panIso)
    }),
  )

  it(
    'préserve le where externe (AND avec la clause de permission)',
    integrationTest(async () => {
      const panAndCible = testPanierId()
      const panAndAutre = testPanierId()
      await fixtures.panier(
        { publicId: panAndCible, nom: 'Cible', visibilite: 'PUBLIC' },
        { publicId: panAndAutre, nom: 'Autre', visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const rows = await db().panier.findMany({
        where: withPanierReadPermission({ nom: 'Cible' }, apiKey.id),
        select: { publicId: true },
      })

      expect(rows.map((r) => r.publicId)).toEqual([panAndCible])
    }),
  )
})

describe.concurrent('ensurePanierWritePermission', () => {
  it(
    'passe quand le principal a la permission WRITE directe',
    integrationTest(async () => {
      const panEwOk = testPanierId()
      const panier = await fixtures.panier({ publicId: panEwOk, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: panEwOk }, action: 'WRITE' }],
      })

      const result = await ensurePanierWritePermission({
        panierId: panier.id,
        principalId: apiKey.id,
      })

      expect(result.isOk()).toBe(true)
    }),
  )

  it(
    "rejette quand le principal n'a aucune permission",
    integrationTest(async () => {
      const panEwNone = testPanierId()
      const panier = await fixtures.panier({ publicId: panEwNone, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      await expect(
        ensurePanierWritePermission({ panierId: panier.id, principalId: apiKey.id }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    "rejette quand le principal n'a que la permission READ (READ n'implique pas WRITE)",
    integrationTest(async () => {
      const panEwRonly = testPanierId()
      const panier = await fixtures.panier({ publicId: panEwRonly, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: panEwRonly }, action: 'READ' }],
      })

      await expect(
        ensurePanierWritePermission({ panierId: panier.id, principalId: apiKey.id }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    'rejette quand le panier est PUBLIC mais sans permission WRITE explicite (PUBLIC ne couvre que la lecture)',
    integrationTest(async () => {
      const panEwPub = testPanierId()
      const panier = await fixtures.panier({ publicId: panEwPub, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      await expect(
        ensurePanierWritePermission({ panierId: panier.id, principalId: apiKey.id }),
      ).rejects.toThrow(/permission/i)
    }),
  )
})
