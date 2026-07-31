import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { Prisma } from '@/generated/prisma/client'
import { resolveIndicateurAndIndividuForWriteData } from '@/indicateur/resolveIndicateurAndIndividuForWriteData'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testIndicateurId, testReferentielId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('resolveIndicateurAndIndividuForWriteData', () => {
  it(
    "retourne le contexte résolu quand le principal a la permission WRITE et que l'individu est connu",
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
        resolveIndicateurAndIndividuForWriteData({
          indicateurPublicId: indId,
          individuPublicId: individuId,
        }),
      )

      expect(result.isOk()).toBe(true)
      const ctx = result._unsafeUnwrap()
      expect(ctx.indicateur.publicId).toBe(indId)
      expect(ctx.individu.publicId).toBe(individuId)
      expect(ctx.individu.id).toBe(individu.id)
      expect(ctx.principalId).toBe(apiKey.id)
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
          resolveIndicateurAndIndividuForWriteData({
            indicateurPublicId: indId,
            individuPublicId: individuId,
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
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          resolveIndicateurAndIndividuForWriteData({
            indicateurPublicId: indId,
            individuPublicId: individuId,
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
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE_DATA' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        resolveIndicateurAndIndividuForWriteData({
          indicateurPublicId: indId,
          individuPublicId: 'DEPT-999',
        }),
      )

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({ type: 'INDIVIDU_INCONNU', individu: 'DEPT-999' })
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
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE_DATA' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        resolveIndicateurAndIndividuForWriteData({
          indicateurPublicId: indId,
          individuPublicId: individuId,
        }),
      )

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({ type: 'INDIVIDU_INCONNU', individu: individuId })
    }),
  )
})
