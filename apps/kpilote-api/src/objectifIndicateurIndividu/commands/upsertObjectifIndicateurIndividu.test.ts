import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { upsertObjectifIndicateurIndividu } from '@/objectifIndicateurIndividu/commands/upsertObjectifIndicateurIndividu'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testIndicateurId, testReferentielId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('upsertObjectifIndicateurIndividu', () => {
  it(
    "crée l'objectif quand le triplet (indicateur, individu, dateCible) n'existe pas",
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
        permissions: [{ indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertObjectifIndicateurIndividu({
          indicateurPublicId: indId,
          body: { individu: individu.publicId, dateCible: '2025-01-01', valeurCible: 100 },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        indicateur: indId,
        individu: individuId,
        dateCible: '2025-01-01',
        valeurCible: 100,
        type: 'saisie',
      })
      const row = await db().objectifIndicateurIndividu.findFirstOrThrow({
        where: {
          indicateurId: link.indicateurId,
          individuId: individu.id,
          dateCible: '2025-01-01',
        },
      })
      expect(row.valeurCible.toNumber()).toBe(100)
    }),
  )

  it(
    'met à jour la valeurCible existante quand le triplet est déjà présent',
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
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: individuId, referentiel: { publicId: refId } },
        dateCible: '2025-01-01',
        valeurCible: 50,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertObjectifIndicateurIndividu({
          indicateurPublicId: indId,
          body: { individu: individu.publicId, dateCible: '2025-01-01', valeurCible: 200 },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().valeurCible).toBe(200)
      const rows = await db().objectifIndicateurIndividu.findMany({
        where: {
          indicateurId: link.indicateurId,
          individuId: individu.id,
          dateCible: '2025-01-01',
        },
      })
      expect(rows).toHaveLength(1)
      expect(rows[0]!.valeurCible.toNumber()).toBe(200)
    }),
  )

  it(
    "throw PrismaClientKnownRequestError P2025 quand l'indicateur n'existe pas",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const individuId = testDeptId()
      await fixtures.individu({ publicId: individuId, referentiel: { publicId: refId } })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertObjectifIndicateurIndividu({
            indicateurPublicId: indId,
            body: { individu: individuId, dateCible: '2025-01-01', valeurCible: 100 },
          }),
        ),
      ).rejects.toMatchObject({
        constructor: Prisma.PrismaClientKnownRequestError,
        code: 'P2025',
      })
    }),
  )

  it(
    "throw ForbiddenError quand le principal n'a que la permission READ",
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
        permissions: [{ indicateur: { publicId: indId }, action: IndicateurPermissionAction.READ }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertObjectifIndicateurIndividu({
            indicateurPublicId: indId,
            body: { individu: individuId, dateCible: '2025-01-01', valeurCible: 100 },
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    "retourne Err INDIVIDU_INCONNU quand l'individu n'existe pas",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertObjectifIndicateurIndividu({
          indicateurPublicId: indId,
          body: { individu: 'DEPT-999', dateCible: '2025-01-01', valeurCible: 100 },
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
    "retourne Err INDIVIDU_INCONNU quand l'individu n'est pas dans un référentiel lié à l'indicateur",
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
        permissions: [{ indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertObjectifIndicateurIndividu({
          indicateurPublicId: indId,
          body: { individu: individuId, dateCible: '2025-01-01', valeurCible: 100 },
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
