import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { deleteValeurAvancement } from '@/valeurAvancement/commands/deleteValeurAvancement'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testIndicateurId, testReferentielId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('deleteValeurAvancement', () => {
  it(
    'supprime la valeur existante pour le triplet (indicateur, individu, date)',
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
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: individuId, referentiel: { publicId: refId } },
        date: '2025-03-01',
        valeur: 12.34,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE_DATA' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        deleteValeurAvancement({
          indicateurPublicId: indId,
          body: { individu: individu.publicId, date: '2025-03-01' },
        }),
      )

      expect(result.isOk()).toBe(true)
      const rows = await db().valeurAvancement.findMany({
        where: {
          indicateurId: link.indicateurId,
          individuId: individu.id,
          date: '2025-03-01',
        },
      })
      expect(rows).toHaveLength(0)
    }),
  )

  it(
    "ne touche pas aux autres dates de l'individu pour cet indicateur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const individuId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      const individu = await fixtures.individu({
        publicId: individuId,
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: individuId, referentiel: { publicId: refId } },
        date: '2025-03-01',
        valeur: 10,
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: individuId, referentiel: { publicId: refId } },
        date: '2025-04-01',
        valeur: 20,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE_DATA' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        deleteValeurAvancement({
          indicateurPublicId: indId,
          body: { individu: individu.publicId, date: '2025-03-01' },
        }),
      )

      expect(result.isOk()).toBe(true)
      const rows = await db().valeurAvancement.findMany({
        where: { individuId: individu.id },
        orderBy: { date: 'asc' },
      })
      expect(rows).toHaveLength(1)
      expect(rows[0]!.date).toBe('2025-04-01')
    }),
  )

  it(
    "est idempotent : succès même si aucune valeur n'existe pour le triplet",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const individuId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      const individu = await fixtures.individu({
        publicId: individuId,
        referentiel: { publicId: refId },
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE_DATA' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        deleteValeurAvancement({
          indicateurPublicId: indId,
          body: { individu: individu.publicId, date: '2025-03-01' },
        }),
      )

      expect(result.isOk()).toBe(true)
    }),
  )

  it(
    "rejette avec 404 quand l'indicateur n'existe pas",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const individuId = testDeptId()
      await fixtures.individu({
        publicId: individuId,
        referentiel: { publicId: refId },
      })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          deleteValeurAvancement({
            indicateurPublicId: indId,
            body: { individu: individuId, date: '2025-03-01' },
          }),
        ),
      ).rejects.toMatchObject({
        constructor: Prisma.PrismaClientKnownRequestError,
        code: 'P2025',
      })
    }),
  )

  it(
    "rejette avec 404 quand le principal n'a aucune permission sur l'indicateur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const individuId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.individu({
        publicId: individuId,
        referentiel: { publicId: refId },
      })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          deleteValeurAvancement({
            indicateurPublicId: indId,
            body: { individu: individuId, date: '2025-03-01' },
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
      await fixtures.individu({
        publicId: individuId,
        referentiel: { publicId: refId },
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          deleteValeurAvancement({
            indicateurPublicId: indId,
            body: { individu: individuId, date: '2025-03-01' },
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
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE_DATA' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        deleteValeurAvancement({
          indicateurPublicId: indId,
          body: { individu: 'DEPT-999', date: '2025-03-01' },
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
      await fixtures.individu({
        publicId: individuId,
        referentiel: { publicId: refOrphelin },
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE_DATA' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        deleteValeurAvancement({
          indicateurPublicId: indId,
          body: { individu: individuId, date: '2025-03-01' },
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
