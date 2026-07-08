import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { ensureDossierWritePermission, withDossierReadPermission } from '@/dossier/permissions'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDossierId } from '@/test/randomIds'

const listDossiersWithReadPermission = async (principalId: string) =>
  db().dossier.findMany({
    where: withDossierReadPermission({}, principalId),
    select: { publicId: true },
    orderBy: { publicId: 'asc' },
  })

describe.concurrent('withDossierReadPermission', () => {
  it(
    'expose un dossier PUBLIC à un principal sans aucune permission',
    integrationTest(async () => {
      const panPub = testDossierId()
      await fixtures.dossier({ publicId: panPub, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const rows = await listDossiersWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(panPub)
    }),
  )

  it(
    'cache un dossier PRIVE à un principal sans permission',
    integrationTest(async () => {
      const panPri = testDossierId()
      await fixtures.dossier({ publicId: panPri, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      const rows = await listDossiersWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).not.toContain(panPri)
    }),
  )

  it(
    'expose un dossier PRIVE à un principal avec permission READ directe',
    integrationTest(async () => {
      const panPriRead = testDossierId()
      await fixtures.dossier({ publicId: panPriRead, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        dossierPermissions: [{ dossier: { publicId: panPriRead }, action: 'READ' }],
      })

      const rows = await listDossiersWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(panPriRead)
    }),
  )

  it(
    'expose un dossier PRIVE à un principal avec permission WRITE directe (WRITE implique READ)',
    integrationTest(async () => {
      const panPriWrite = testDossierId()
      await fixtures.dossier({ publicId: panPriWrite, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        dossierPermissions: [{ dossier: { publicId: panPriWrite }, action: 'WRITE' }],
      })

      const rows = await listDossiersWithReadPermission(apiKey.id)

      expect(rows.map((r) => r.publicId)).toContain(panPriWrite)
    }),
  )

  it(
    'isole les permissions par principal : un dossier PRIVE accessible à A reste caché à B',
    integrationTest(async () => {
      const panIso = testDossierId()
      await fixtures.dossier({ publicId: panIso, visibilite: 'PRIVE' })
      const [a, b] = await fixtures.apiKey(
        { dossierPermissions: [{ dossier: { publicId: panIso }, action: 'READ' }] },
        {},
      )

      const rowsA = await listDossiersWithReadPermission(a!.id)
      const rowsB = await listDossiersWithReadPermission(b!.id)

      expect(rowsA.map((r) => r.publicId)).toContain(panIso)
      expect(rowsB.map((r) => r.publicId)).not.toContain(panIso)
    }),
  )

  it(
    'préserve le where externe (AND avec la clause de permission)',
    integrationTest(async () => {
      const panAndCible = testDossierId()
      const panAndAutre = testDossierId()
      await fixtures.dossier(
        { publicId: panAndCible, nom: 'Cible', visibilite: 'PUBLIC' },
        { publicId: panAndAutre, nom: 'Autre', visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const rows = await db().dossier.findMany({
        where: withDossierReadPermission({ nom: 'Cible' }, apiKey.id),
        select: { publicId: true },
      })

      expect(rows.map((r) => r.publicId)).toEqual([panAndCible])
    }),
  )
})

describe.concurrent('ensureDossierWritePermission', () => {
  it(
    'passe quand le principal a la permission WRITE directe',
    integrationTest(async () => {
      const panEwOk = testDossierId()
      const dossier = await fixtures.dossier({ publicId: panEwOk, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        dossierPermissions: [{ dossier: { publicId: panEwOk }, action: 'WRITE' }],
      })

      const result = await ensureDossierWritePermission({
        dossierId: dossier.id,
        principalId: apiKey.id,
      })

      expect(result.isOk()).toBe(true)
    }),
  )

  it(
    "rejette quand le principal n'a aucune permission",
    integrationTest(async () => {
      const panEwNone = testDossierId()
      const dossier = await fixtures.dossier({ publicId: panEwNone, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      await expect(
        ensureDossierWritePermission({ dossierId: dossier.id, principalId: apiKey.id }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    "rejette quand le principal n'a que la permission READ (READ n'implique pas WRITE)",
    integrationTest(async () => {
      const panEwRonly = testDossierId()
      const dossier = await fixtures.dossier({ publicId: panEwRonly, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        dossierPermissions: [{ dossier: { publicId: panEwRonly }, action: 'READ' }],
      })

      await expect(
        ensureDossierWritePermission({ dossierId: dossier.id, principalId: apiKey.id }),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    'rejette quand le dossier est PUBLIC mais sans permission WRITE explicite (PUBLIC ne couvre que la lecture)',
    integrationTest(async () => {
      const panEwPub = testDossierId()
      const dossier = await fixtures.dossier({ publicId: panEwPub, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      await expect(
        ensureDossierWritePermission({ dossierId: dossier.id, principalId: apiKey.id }),
      ).rejects.toThrow(/permission/i)
    }),
  )
})
