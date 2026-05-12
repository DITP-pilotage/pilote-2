import { describe, expect, it } from 'vitest'

import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { upsertIndicateur } from '@/indicateur/commands/upsertIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

const getReferentielPublicIds = async (publicId: string): Promise<string[]> => {
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId },
    include: { referentiels: { include: { referentiel: { select: { publicId: true } } } } },
  })
  return indicateur.referentiels.map((link) => link.referentiel.publicId).sort()
}

describe.concurrent('upsertIndicateur', () => {
  it(
    'crée un indicateur avec ses référentiels liés et auto-grant READ+WRITE au créateur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()
      const refA = await fixtures.referentiel({ publicId: 'REF-CREATE-A' })
      const refB = await fixtures.referentiel({ publicId: 'REF-CREATE-B' })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({
          publicId: indId,
          body: { nom: 'Nouvel indicateur', referentielIds: [refA.publicId, refB.publicId] },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await getReferentielPublicIds(indId)).toEqual(['REF-CREATE-A', 'REF-CREATE-B'])
      const grants = await db().indicateurPermission.findMany({
        where: { principalId: apiKey.id, indicateur: { publicId: indId } },
        orderBy: { action: 'asc' },
      })
      expect(grants.map((g) => g.action)).toEqual(['READ', 'WRITE'])
    }),
  )

  it(
    "remplace l'ensemble des liens à chaque PUT (ajout + suppression)",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel(
        { publicId: 'REF-REPLACE-A' },
        { publicId: 'REF-REPLACE-B' },
        { publicId: 'REF-REPLACE-C' },
      )
      const apiKey = await fixtures.apiKey()
      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({
          publicId: indId,
          body: { nom: 'I', referentielIds: ['REF-REPLACE-A', 'REF-REPLACE-B'] },
        }),
      )

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({
          publicId: indId,
          body: { nom: 'I', referentielIds: ['REF-REPLACE-B', 'REF-REPLACE-C'] },
        }),
      )

      expect(await getReferentielPublicIds(indId)).toEqual(['REF-REPLACE-B', 'REF-REPLACE-C'])
    }),
  )

  it(
    'accepte un tableau vide (supprime tous les liens)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-EMPTY-A' })
      const apiKey = await fixtures.apiKey()
      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({
          publicId: indId,
          body: { nom: 'I', referentielIds: ['REF-EMPTY-A'] },
        }),
      )

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({ publicId: indId, body: { nom: 'I', referentielIds: [] } }),
      )

      expect(await getReferentielPublicIds(indId)).toEqual([])
    }),
  )

  it(
    'dédoublonne silencieusement les referentielIds en double',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-DEDUP-A' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({
          publicId: indId,
          body: { nom: 'I', referentielIds: ['REF-DEDUP-A', 'REF-DEDUP-A'] },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await getReferentielPublicIds(indId)).toEqual(['REF-DEDUP-A'])
    }),
  )

  it(
    'rejette quand un referentielId est inconnu, avec la liste des IDs manquants',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-UNKNOWN-A' })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertIndicateur({
            publicId: indId,
            body: {
              nom: 'I',
              referentielIds: ['REF-UNKNOWN-A', 'REF-UNKNOWN-X', 'REF-UNKNOWN-Y'],
            },
          }),
        ),
      ).rejects.toMatchObject({
        constructor: ValidationError,
        details: { unknownReferentielIds: ['REF-UNKNOWN-X', 'REF-UNKNOWN-Y'] },
      })

      const created = await db().indicateur.findUnique({ where: { publicId: indId } })
      expect(created).toBeNull()
    }),
  )

  it(
    "rejette la mise à jour quand le principal n'a pas la permission WRITE",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId, nom: 'Ancien' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertIndicateur({ publicId: indId, body: { nom: 'X', referentielIds: [] } }),
        ),
      ).rejects.toThrow(/permission/i)
    }),
  )
})
