import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { upsertObjectifAvancement } from '@/objectifAvancement/commands/upsertObjectifAvancement'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testIndicateurId, testReferentielId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('upsertObjectifAvancement', () => {
  it(
    "crée l'objectif quand le triplet (indicateur, individu, date) n'existe pas",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const individuId = testDeptId()
      const link = await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      const individu = await fixtures.individu({
        publicId: individuId,
        referentiel: { publicId: refId },
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertObjectifAvancement({
          indicateurPublicId: indId,
          body: { individu: individu.publicId, date: '2025-01-01', valeur: 100 },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        indicateur: indId,
        individu: individuId,
        date: '2025-01-01',
        valeur: 100,
      })
      const row = await db().objectifAvancement.findFirstOrThrow({
        where: {
          indicateurId: link.indicateurId,
          individuId: individu.id,
          date: '2025-01-01',
        },
      })
      expect(row.valeur.toNumber()).toBe(100)
    }),
  )

  it(
    'met à jour la valeur existante quand le triplet est déjà présent',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const individuId = testDeptId()
      const link = await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      const individu = await fixtures.individu({
        publicId: individuId,
        referentiel: { publicId: refId },
      })
      await fixtures.objectifAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: individuId, referentiel: { publicId: refId } },
        date: '2025-01-01',
        valeur: 50,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertObjectifAvancement({
          indicateurPublicId: indId,
          body: { individu: individu.publicId, date: '2025-01-01', valeur: 200 },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().valeur).toBe(200)
      const rows = await db().objectifAvancement.findMany({
        where: {
          indicateurId: link.indicateurId,
          individuId: individu.id,
          date: '2025-01-01',
        },
      })
      expect(rows).toHaveLength(1)
      expect(rows[0]!.valeur.toNumber()).toBe(200)
    }),
  )

  it(
    "rejette avec 404 quand l'indicateur n'existe pas",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const individuId = testDeptId()
      await fixtures.individu({ publicId: individuId, referentiel: { publicId: refId } })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertObjectifAvancement({
            indicateurPublicId: indId,
            body: { individu: individuId, date: '2025-01-01', valeur: 100 },
          }),
        ),
      ).rejects.toMatchObject({
        constructor: Prisma.PrismaClientKnownRequestError,
        code: 'P2025',
      })
    }),
  )

  it(
    "rejette avec 403 quand le principal n'a que la permission READ",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const individuId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.individu({ publicId: individuId, referentiel: { publicId: refId } })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertObjectifAvancement({
            indicateurPublicId: indId,
            body: { individu: individuId, date: '2025-01-01', valeur: 100 },
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    "rejette avec INDIVIDU_INCONNU quand l'individu n'existe pas",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertObjectifAvancement({
          indicateurPublicId: indId,
          body: { individu: 'DEPT-999', date: '2025-01-01', valeur: 100 },
        }),
      )

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'INDIVIDU_INCONNU',
        individu: 'DEPT-999',
      })
    }),
  )

  it(
    "rejette avec INDIVIDU_INCONNU quand l'individu n'est pas dans un référentiel lié à l'indicateur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refLie = testReferentielId()
      const refOrphelin = testReferentielId()
      const individuId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refLie },
      })
      await fixtures.individu({ publicId: individuId, referentiel: { publicId: refOrphelin } })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertObjectifAvancement({
          indicateurPublicId: indId,
          body: { individu: individuId, date: '2025-01-01', valeur: 100 },
        }),
      )

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'INDIVIDU_INCONNU',
        individu: individuId,
      })
    }),
  )
})
