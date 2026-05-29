import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { upsertValeursAvancementBatch } from '@/valeurAvancement/commands/upsertValeursAvancementBatch'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds, testIndicateurId, testReferentielId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('upsertValeursAvancementBatch', () => {
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
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptA, referentiel: { publicId: refId } },
        date: '2025-03-01',
        valeur: 1,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeursAvancementBatch({
          indicateurPublicId: indId,
          body: {
            items: [
              { individu: deptA, date: '2025-03-01', valeur: 10 },
              { individu: deptB, date: '2025-03-01', valeur: 20 },
              { individu: deptC, date: '2025-03-01', valeur: 30 },
            ],
          },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({ total: 3, created: 2, updated: 1 })
      const rows = await db().valeurAvancement.findMany({
        where: { indicateur: { publicId: indId } },
        orderBy: [{ individu: { publicId: 'asc' } }],
      })
      expect(rows).toHaveLength(3)
      const valeurParPublicId = new Map<string, number>()
      for (const row of rows) {
        const individu = await db().individu.findUniqueOrThrow({
          where: { id: row.individuId },
          select: { publicId: true },
        })
        valeurParPublicId.set(individu.publicId, row.valeur.toNumber())
      }
      expect(valeurParPublicId.get(deptA)).toBe(10)
      expect(valeurParPublicId.get(deptB)).toBe(20)
      expect(valeurParPublicId.get(deptC)).toBe(30)
    }),
  )

  it(
    'détecte les doublons (individu, date) du payload et n\'applique rien',
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
        upsertValeursAvancementBatch({
          indicateurPublicId: indId,
          body: {
            items: [
              { individu: deptA, date: '2025-03-01', valeur: 10 },
              { individu: deptB, date: '2025-03-01', valeur: 20 },
              { individu: deptA, date: '2025-03-01', valeur: 99 },
            ],
          },
        }),
      )

      expect(result.isErr()).toBe(true)
      const err = result._unsafeUnwrapErr()
      expect(err.type).toBe('BATCH_INVALID')
      expect(err.errors).toEqual([
        { code: 'DUPLICATE_KEY', indices: [0, 2], individu: deptA, date: '2025-03-01' },
      ])
      const count = await db().valeurAvancement.count({
        where: { indicateur: { publicId: indId } },
      })
      expect(count).toBe(0)
    }),
  )

  it(
    'remonte INDIVIDU_INCONNU agrégé par individu et n\'applique rien',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const refOrphelin = testReferentielId()
      const [deptA, deptOrphelin] = testDeptIds(2)
      const inconnu = `DEPT-XX`
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.individu({ publicId: deptA, referentiel: { publicId: refId } })
      await fixtures.individu({
        publicId: deptOrphelin,
        referentiel: { publicId: refOrphelin },
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeursAvancementBatch({
          indicateurPublicId: indId,
          body: {
            items: [
              { individu: deptA, date: '2025-03-01', valeur: 1 },
              { individu: inconnu, date: '2025-03-01', valeur: 2 },
              { individu: deptOrphelin, date: '2025-03-01', valeur: 3 },
              { individu: inconnu, date: '2025-04-01', valeur: 4 },
            ],
          },
        }),
      )

      expect(result.isErr()).toBe(true)
      const err = result._unsafeUnwrapErr()
      expect(err.type).toBe('BATCH_INVALID')
      expect(err.errors).toEqual(
        expect.arrayContaining([
          { code: 'INDIVIDU_INCONNU', individu: inconnu, indices: [1, 3] },
          { code: 'INDIVIDU_INCONNU', individu: deptOrphelin, indices: [2] },
        ]),
      )
      expect(err.errors).toHaveLength(2)
      const count = await db().valeurAvancement.count({
        where: { indicateur: { publicId: indId } },
      })
      expect(count).toBe(0)
    }),
  )

  it(
    'agrège plusieurs causes en une seule réponse',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const [deptA, deptB] = testDeptIds(2)
      const inconnu = `DEPT-YY`
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
        upsertValeursAvancementBatch({
          indicateurPublicId: indId,
          body: {
            items: [
              { individu: deptA, date: '2025-03-01', valeur: 1 },
              { individu: deptA, date: '2025-03-01', valeur: 2 },
              { individu: inconnu, date: '2025-04-01', valeur: 3 },
              { individu: deptB, date: '2025-04-01', valeur: 4 },
            ],
          },
        }),
      )

      expect(result.isErr()).toBe(true)
      const err = result._unsafeUnwrapErr()
      expect(err.errors).toEqual(
        expect.arrayContaining([
          { code: 'DUPLICATE_KEY', indices: [0, 1], individu: deptA, date: '2025-03-01' },
          { code: 'INDIVIDU_INCONNU', individu: inconnu, indices: [2] },
        ]),
      )
      expect(err.errors).toHaveLength(2)
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
          upsertValeursAvancementBatch({
            indicateurPublicId: indId,
            body: { items: [{ individu: deptA, date: '2025-03-01', valeur: 1 }] },
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
          upsertValeursAvancementBatch({
            indicateurPublicId: indId,
            body: { items: [{ individu: deptA, date: '2025-03-01', valeur: 1 }] },
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    'remplace plusieurs valeurs existantes en un seul appel (idempotence du rejeu)',
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
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptA, referentiel: { publicId: refId } },
        date: '2025-03-01',
        valeur: 1,
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptB, referentiel: { publicId: refId } },
        date: '2025-03-01',
        valeur: 2,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeursAvancementBatch({
          indicateurPublicId: indId,
          body: {
            items: [
              { individu: deptA, date: '2025-03-01', valeur: 11 },
              { individu: deptB, date: '2025-03-01', valeur: 22 },
            ],
          },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({ total: 2, created: 0, updated: 2 })
      const rows = await db().valeurAvancement.findMany({
        where: { indicateur: { publicId: indId } },
      })
      expect(rows).toHaveLength(2)
      expect(rows.map((row) => row.valeur.toNumber()).sort()).toEqual([11, 22])
    }),
  )
})
