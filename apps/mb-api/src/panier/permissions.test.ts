import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { ensurePanierWritePermission, withPanierReadPermission } from '@/panier/permissions'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

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
      await fixtures.panier({ publicId: 'PAN-W-PUB-001', visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const rows = await listPaniersWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain('PAN-W-PUB-001')
    }),
  )

  it(
    'cache un panier PRIVE à un principal sans permission',
    integrationTest(async () => {
      await fixtures.panier({ publicId: 'PAN-W-PRI-001', visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      const rows = await listPaniersWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).not.toContain('PAN-W-PRI-001')
    }),
  )

  it(
    'expose un panier PRIVE à un principal avec permission READ directe',
    integrationTest(async () => {
      await fixtures.panier({ publicId: 'PAN-W-PRI-READ', visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: 'PAN-W-PRI-READ' }, action: 'READ' }],
      })

      const rows = await listPaniersWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain('PAN-W-PRI-READ')
    }),
  )

  it(
    'expose un panier PRIVE à un principal avec permission WRITE directe (WRITE implique READ)',
    integrationTest(async () => {
      await fixtures.panier({ publicId: 'PAN-W-PRI-WRITE', visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: 'PAN-W-PRI-WRITE' }, action: 'WRITE' }],
      })

      const rows = await listPaniersWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain('PAN-W-PRI-WRITE')
    }),
  )

  it(
    'isole les permissions par principal : un panier PRIVE accessible à A reste caché à B',
    integrationTest(async () => {
      await fixtures.panier({ publicId: 'PAN-W-ISO-001', visibilite: 'PRIVE' })
      const [a, b] = await fixtures.apiKey(
        { panierPermissions: [{ panier: { publicId: 'PAN-W-ISO-001' }, action: 'READ' }] },
        {},
      )

      const rowsA = await listPaniersWithReadPermission(a!.id)
      const rowsB = await listPaniersWithReadPermission(b!.id)

      expect(rowsA.map((r) => r.publicId)).toContain('PAN-W-ISO-001')
      expect(rowsB.map((r) => r.publicId)).not.toContain('PAN-W-ISO-001')
    }),
  )

  it(
    'préserve le where externe (AND avec la clause de permission)',
    integrationTest(async () => {
      await fixtures.panier(
        { publicId: 'PAN-W-AND-A', nom: 'Cible', visibilite: 'PUBLIC' },
        { publicId: 'PAN-W-AND-B', nom: 'Autre', visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const rows = await db().panier.findMany({
        where: withPanierReadPermission({ nom: 'Cible' }, apiKey.id),
        select: { publicId: true },
      })

      expect(rows.map((r) => r.publicId)).toEqual(['PAN-W-AND-A'])
    }),
  )
})

describe.concurrent('ensurePanierWritePermission', () => {
  it(
    'passe quand le principal a la permission WRITE directe',
    integrationTest(async () => {
      const panier = await fixtures.panier({ publicId: 'PAN-EW-OK', visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: 'PAN-EW-OK' }, action: 'WRITE' }],
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
      const panier = await fixtures.panier({ publicId: 'PAN-EW-NONE', visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      await expect(
        ensurePanierWritePermission({ panierId: panier.id, principalId: apiKey.id }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    "rejette quand le principal n'a que la permission READ (READ n'implique pas WRITE)",
    integrationTest(async () => {
      const panier = await fixtures.panier({ publicId: 'PAN-EW-RONLY', visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: 'PAN-EW-RONLY' }, action: 'READ' }],
      })

      await expect(
        ensurePanierWritePermission({ panierId: panier.id, principalId: apiKey.id }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    'rejette quand le panier est PUBLIC mais sans permission WRITE explicite (PUBLIC ne couvre que la lecture)',
    integrationTest(async () => {
      const panier = await fixtures.panier({ publicId: 'PAN-EW-PUB', visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      await expect(
        ensurePanierWritePermission({ panierId: panier.id, principalId: apiKey.id }),
      ).rejects.toThrow(/permission/i)
    }),
  )
})
