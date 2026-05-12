import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { upsertIndicateur } from '@/indicateur/commands/upsertIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('upsertIndicateur', () => {
  it(
    'crée un indicateur quand le publicId est libre et auto-grant READ+WRITE au créateur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, { nom: 'Nouvel indicateur' }),
      )

      expect(result.isOk()).toBe(true)
      const persisted = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
      expect(persisted.nom).toBe('Nouvel indicateur')
      const grants = await db().indicateurPermission.findMany({
        where: { principalId: apiKey.id, indicateurId: persisted.id },
        orderBy: { action: 'asc' },
      })
      expect(grants.map((g) => g.action)).toEqual(['READ', 'WRITE'])
    }),
  )

  it(
    'met à jour le nom quand le principal a la permission WRITE',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const original = await fixtures.indicateur({ publicId: indId, nom: 'Ancien nom' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, { nom: 'Nom mis à jour' }),
      )

      expect(result.isOk()).toBe(true)
      const persisted = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
      expect(persisted.nom).toBe('Nom mis à jour')
      expect(persisted.createdAt).toEqual(original.createdAt)
      expect(persisted.updatedAt >= original.updatedAt).toBe(true)
    }),
  )

  it(
    "rejette la mise à jour quand le principal n'a pas la permission WRITE",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId, nom: 'Ancien nom' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () => upsertIndicateur(indId, { nom: 'Nom mis à jour' })),
      ).rejects.toThrow(/permission/i)
    }),
  )
})
