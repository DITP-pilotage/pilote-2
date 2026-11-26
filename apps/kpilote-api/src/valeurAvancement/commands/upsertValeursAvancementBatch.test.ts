import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { upsertValeursAvancementBatch } from '@/valeurAvancement/commands/upsertValeursAvancementBatch'
import { fixtures } from '@/test/fixtures'
import {
  indicateurWithoutAxe,
  indicateurWithTwoAxes,
  modalitesKey,
  valeursByModalites,
} from '@/test/indicateurWithAxes'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds, testIndicateurId, testModaliteId, testReferentielId } from '@/test/randomIds'
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
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA },
        ],
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
        include: { individu: { select: { publicId: true } } },
      })
      const valeurParPublicId = new Map(
        rows.map((row) => [row.individu.publicId, row.valeur.toNumber()]),
      )
      expect(valeurParPublicId).toEqual(
        new Map([
          [deptA, 10],
          [deptB, 20],
          [deptC, 30],
        ]),
      )
    }),
  )

  it(
    "détecte les doublons (individu, date) du payload et n'applique rien",
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
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA },
        ],
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
    "remonte INDIVIDU_INCONNU agrégé par individu et n'applique rien",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refLie = testReferentielId()
      // Référentiel qui existe mais n'a pas de lien IndicateurReferentiel avec `indId` :
      // les individus rattachés à ce référentiel doivent donc être rejetés en INDIVIDU_INCONNU.
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
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeursAvancementBatch({
          indicateurPublicId: indId,
          body: {
            items: [
              { individu: deptLie, date: '2025-03-01', valeur: 1 },
              { individu: deptInconnu, date: '2025-03-01', valeur: 2 },
              { individu: deptDansRefNonLie, date: '2025-03-01', valeur: 3 },
              { individu: deptInconnu, date: '2025-04-01', valeur: 4 },
            ],
          },
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
      const deptInconnu = 'DEPT-YY'
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.individu(
        { publicId: deptA, referentiel: { publicId: refId } },
        { publicId: deptB, referentiel: { publicId: refId } },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeursAvancementBatch({
          indicateurPublicId: indId,
          body: {
            items: [
              { individu: deptA, date: '2025-03-01', valeur: 1 },
              { individu: deptA, date: '2025-03-01', valeur: 2 },
              { individu: deptInconnu, date: '2025-04-01', valeur: 3 },
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
          { code: 'INDIVIDU_INCONNU', individu: deptInconnu, indices: [2] },
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
            body: {
              items: [{ individu: deptA, date: '2025-03-01', valeur: 1 }],
            },
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
        permissions: [{ indicateur: { publicId: indId }, action: IndicateurPermissionAction.READ }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertValeursAvancementBatch({
            indicateurPublicId: indId,
            body: {
              items: [{ individu: deptA, date: '2025-03-01', valeur: 1 }],
            },
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
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA },
        ],
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
      expect(rows.map((row) => row.valeur.toNumber()).sort((a, b) => a - b)).toEqual([11, 22])
    }),
  )
})

describe.concurrent('saisie en lot avec modalités', () => {
  const DATE = '2025-03-01'

  it(
    'écrit chaque cellule sur sa combinaison, et met à jour au second passage',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, ids } = await indicateurWithTwoAxes()
      const batch = (valeur: number) =>
        runAsPrincipal(apiKey.id, () =>
          upsertValeursAvancementBatch({
            indicateurPublicId: indicateurId,
            body: {
              items: [
                { individu: individuId, modalites: [ids.orange, ids.tva], date: DATE, valeur },
                { individu: individuId, modalites: [ids.sfr, ids.tva], date: DATE, valeur },
                { individu: individuId, modalites: [ids.ir, ids.sfr], date: DATE, valeur },
              ],
            },
          }),
        )

      expect((await batch(1))._unsafeUnwrap()).toEqual({ total: 3, created: 3, updated: 0 })
      expect((await batch(2))._unsafeUnwrap()).toEqual({ total: 3, created: 0, updated: 3 })
      expect(await valeursByModalites(indicateurId)).toEqual(
        new Map([
          [modalitesKey(ids.orange, ids.tva), 2],
          [modalitesKey(ids.sfr, ids.tva), 2],
          [modalitesKey(ids.sfr, ids.ir), 2],
        ]),
      )
    }),
  )

  it(
    'agrège les erreurs de modalités par cause et n’applique rien',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, axes, ids } = await indicateurWithTwoAxes()
      const unknownModalite = testModaliteId()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeursAvancementBatch({
          indicateurPublicId: indicateurId,
          body: {
            items: [
              {
                individu: individuId,
                modalites: [ids.orange, unknownModalite],
                date: DATE,
                valeur: 1,
              },
              { individu: individuId, modalites: [ids.orange], date: DATE, valeur: 1 },
              {
                individu: individuId,
                modalites: [ids.sfr, unknownModalite],
                date: '2025-04-01',
                valeur: 1,
              },
              { individu: individuId, modalites: [ids.sfr, ids.fiscale], date: DATE, valeur: 1 },
              { individu: individuId, modalites: [ids.sfr, ids.orange], date: DATE, valeur: 1 },
              { individu: individuId, modalites: [ids.autre], date: DATE, valeur: 1 },
              { individu: individuId, modalites: [ids.sfr, ids.ir], date: DATE, valeur: 1 },
            ],
          },
        }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'BATCH_INVALID',
        errors: [
          { code: 'MODALITE_INCONNUE', indices: [0, 2], modalite: unknownModalite },
          { code: 'MODALITE_MANQUANTE', indices: [1], axe: axes.fraude.publicId },
          { code: 'MODALITE_NON_FEUILLE', indices: [3], modalite: ids.fiscale },
          { code: 'MODALITES_MEME_AXE', indices: [4], axe: axes.operateur.publicId },
          { code: 'AXE_NON_DECLARE', indices: [5], modalite: ids.autre },
        ],
      })
      expect(await valeursByModalites(indicateurId)).toEqual(new Map())
    }),
  )

  it(
    'refuse un doublon de cellule, quel que soit l’ordre des modalités',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, ids } = await indicateurWithTwoAxes()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeursAvancementBatch({
          indicateurPublicId: indicateurId,
          body: {
            items: [
              { individu: individuId, modalites: [ids.orange, ids.tva], date: DATE, valeur: 1 },
              { individu: individuId, modalites: [ids.sfr, ids.tva], date: DATE, valeur: 2 },
              { individu: individuId, modalites: [ids.tva, ids.orange], date: DATE, valeur: 3 },
            ],
          },
        }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'BATCH_INVALID',
        errors: [
          {
            code: 'DUPLICATE_KEY',
            indices: [0, 2],
            individu: individuId,
            modalites: [ids.orange, ids.tva],
            date: DATE,
          },
        ],
      })
    }),
  )

  it(
    'refuse des modalités sur un indicateur sans axe',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, orange } = await indicateurWithoutAxe()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeursAvancementBatch({
          indicateurPublicId: indicateurId,
          body: {
            items: [
              { individu: individuId, date: DATE, valeur: 1 },
              { individu: individuId, modalites: [orange], date: '2025-04-01', valeur: 1 },
            ],
          },
        }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'BATCH_INVALID',
        errors: [{ code: 'AXE_NON_DECLARE', indices: [1], modalite: orange }],
      })
    }),
  )
})
