import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { upsertObjectifsIndicateurBatch } from '@/objectifIndicateurIndividu/commands/upsertObjectifsIndicateurBatch'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds, testIndicateurId, testReferentielId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('upsertObjectifsIndicateurBatch', () => {
  it(
    'applique le lot complet en distinguant created/updated',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const [deptA, deptB, deptC] = testDeptIds(3)
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.individu(
        { publicId: deptA, referentiel: { publicId: refId } },
        { publicId: deptB, referentiel: { publicId: refId } },
        { publicId: deptC, referentiel: { publicId: refId } },
      )
      // deptA a déjà un objectif existant → sera updated
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptA, referentiel: { publicId: refId } },
        dateCible: '2025-12-31',
        valeurCible: 50,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertObjectifsIndicateurBatch(indId, {
          items: [
            { individu: deptA, dateCible: '2025-12-31', valeurCible: 100 },
            { individu: deptB, dateCible: '2025-12-31', valeurCible: 200 },
            { individu: deptC, dateCible: '2025-12-31', valeurCible: 300 },
          ],
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({ total: 3, created: 2, updated: 1 })
      const rows = await db().objectifIndicateurIndividu.findMany({
        where: { indicateur: { publicId: indId } },
        include: { individu: { select: { publicId: true } } },
      })
      const valeurParPublicId = new Map(
        rows.map((row) => [row.individu.publicId, row.valeurCible.toNumber()]),
      )
      expect(valeurParPublicId).toEqual(
        new Map([
          [deptA, 100],
          [deptB, 200],
          [deptC, 300],
        ]),
      )
    }),
  )

  it(
    "détecte les doublons (individu, dateCible) du payload et n'applique rien",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const [deptA, deptB] = testDeptIds(2)
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.individu(
        { publicId: deptA, referentiel: { publicId: refId } },
        { publicId: deptB, referentiel: { publicId: refId } },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertObjectifsIndicateurBatch(indId, {
          items: [
            { individu: deptA, dateCible: '2025-12-31', valeurCible: 10 },
            { individu: deptB, dateCible: '2025-12-31', valeurCible: 20 },
            { individu: deptA, dateCible: '2025-12-31', valeurCible: 99 },
          ],
        }),
      )

      expect(result.isErr()).toBe(true)
      const err = result._unsafeUnwrapErr()
      expect(err.type).toBe('BATCH_INVALID')
      expect(err.errors).toEqual([
        { code: 'DUPLICATE_KEY', indices: [0, 2], individu: deptA, date: '2025-12-31' },
      ])
      const count = await db().objectifIndicateurIndividu.count({
        where: { indicateur: { publicId: indId } },
      })
      expect(count).toBe(0)
    }),
  )

  it(
    "remonte INDIVIDU_INCONNU agrégé par individu et n'applique rien",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refLie = testReferentielId()
      const refNonLieAIndicateur = testReferentielId()
      const [deptLie, deptDansRefNonLie] = testDeptIds(2)
      const deptInconnu = 'DEPT-XX'
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refLie },
      })
      await fixtures.individu({ publicId: deptLie, referentiel: { publicId: refLie } })
      await fixtures.individu({
        publicId: deptDansRefNonLie,
        referentiel: { publicId: refNonLieAIndicateur },
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertObjectifsIndicateurBatch(indId, {
          items: [
            { individu: deptLie, dateCible: '2025-12-31', valeurCible: 1 },
            { individu: deptInconnu, dateCible: '2025-12-31', valeurCible: 2 },
            { individu: deptDansRefNonLie, dateCible: '2025-12-31', valeurCible: 3 },
            { individu: deptInconnu, dateCible: '2026-12-31', valeurCible: 4 },
          ],
        }),
      )

      expect(result.isErr()).toBe(true)
      const err = result._unsafeUnwrapErr()
      expect(err.type).toBe('BATCH_INVALID')
      expect(err.errors).toEqual(
        expect.arrayContaining([
          { code: 'INDIVIDU_INCONNU', individu: deptInconnu, indices: [1, 3] },
          { code: 'INDIVIDU_INCONNU', individu: deptDansRefNonLie, indices: [2] },
        ]),
      )
      expect(err.errors).toHaveLength(2)
      const count = await db().objectifIndicateurIndividu.count({
        where: { indicateur: { publicId: indId } },
      })
      expect(count).toBe(0)
    }),
  )

  it(
    'remplace plusieurs objectifs existants en un seul appel (idempotence du rejeu)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const [deptA, deptB] = testDeptIds(2)
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.individu(
        { publicId: deptA, referentiel: { publicId: refId } },
        { publicId: deptB, referentiel: { publicId: refId } },
      )
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptA, referentiel: { publicId: refId } },
          dateCible: '2025-12-31',
          valeurCible: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptB, referentiel: { publicId: refId } },
          dateCible: '2025-12-31',
          valeurCible: 20,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertObjectifsIndicateurBatch(indId, {
          items: [
            { individu: deptA, dateCible: '2025-12-31', valeurCible: 110 },
            { individu: deptB, dateCible: '2025-12-31', valeurCible: 220 },
          ],
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({ total: 2, created: 0, updated: 2 })
      const rows = await db().objectifIndicateurIndividu.findMany({
        where: { indicateur: { publicId: indId } },
      })
      expect(rows).toHaveLength(2)
      expect(rows.map((row) => row.valeurCible.toNumber()).sort((a, b) => a - b)).toEqual([
        110, 220,
      ])
    }),
  )

  it(
    "rejette avec 404 quand l'indicateur n'existe pas",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const [deptA] = testDeptIds(1)
      await fixtures.individu({ publicId: deptA, referentiel: { publicId: refId } })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertObjectifsIndicateurBatch(indId, {
            items: [{ individu: deptA, dateCible: '2025-12-31', valeurCible: 1 }],
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
      const [deptA] = testDeptIds(1)
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.individu({ publicId: deptA, referentiel: { publicId: refId } })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertObjectifsIndicateurBatch(indId, {
            items: [{ individu: deptA, dateCible: '2025-12-31', valeurCible: 1 }],
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})
