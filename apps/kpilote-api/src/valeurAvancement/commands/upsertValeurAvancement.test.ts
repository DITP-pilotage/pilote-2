import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { upsertValeurAvancement } from '@/valeurAvancement/commands/upsertValeurAvancement'
import { fixtures } from '@/test/fixtures'
import {
  indicateurWithoutAxe,
  indicateurWithTwoAxes,
  modalitesKey,
  valeursByModalites,
} from '@/test/indicateurWithAxes'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testIndicateurId, testModaliteId, testReferentielId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('upsertValeurAvancement', () => {
  it(
    "crée la valeur quand le triplet (indicateur, individu, date) n'existe pas",
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
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeurAvancement({
          indicateurPublicId: indId,
          body: { individu: individu.publicId, date: '2025-03-01', valeur: 12.34 },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        indicateur: indId,
        individu: individuId,
        date: '2025-03-01',
        valeur: 12.34,
        type: 'saisie',
      })
      const row = await db().valeurAvancement.findFirstOrThrow({
        where: {
          indicateurId: link.indicateurId,
          individuId: individu.id,
          date: '2025-03-01',
        },
      })
      expect(row.valeur.toNumber()).toBe(12.34)
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
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: individuId, referentiel: { publicId: refId } },
        date: '2025-03-01',
        valeur: 5,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeurAvancement({
          indicateurPublicId: indId,
          body: { individu: individu.publicId, date: '2025-03-01', valeur: 42.5 },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().valeur).toBe(42.5)
      const rows = await db().valeurAvancement.findMany({
        where: {
          indicateurId: link.indicateurId,
          individuId: individu.id,
          date: '2025-03-01',
        },
      })
      expect(rows).toHaveLength(1)
      expect(rows[0]!.valeur.toNumber()).toBe(42.5)
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
          upsertValeurAvancement({
            indicateurPublicId: indId,
            body: { individu: individuId, date: '2025-03-01', valeur: 1 },
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
          upsertValeurAvancement({
            indicateurPublicId: indId,
            body: { individu: individuId, date: '2025-03-01', valeur: 1 },
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
        permissions: [{ indicateur: { publicId: indId }, action: IndicateurPermissionAction.READ }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertValeurAvancement({
            indicateurPublicId: indId,
            body: { individu: individuId, date: '2025-03-01', valeur: 1 },
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
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeurAvancement({
          indicateurPublicId: indId,
          body: { individu: 'DEPT-999', date: '2025-03-01', valeur: 1 },
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
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeurAvancement({
          indicateurPublicId: indId,
          body: { individu: individuId, date: '2025-03-01', valeur: 1 },
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

describe.concurrent('saisie unitaire avec modalités', () => {
  const DATE = '2025-03-01'

  it(
    'saisit sur une cellule complète et renvoie les modalités dans l’ordre des axes',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, ids } = await indicateurWithTwoAxes()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeurAvancement({
          indicateurPublicId: indicateurId,
          body: { individu: individuId, modalites: [ids.tva, ids.orange], date: DATE, valeur: 42 },
        }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        indicateur: indicateurId,
        individu: individuId,
        modalites: [ids.orange, ids.tva],
        date: DATE,
        valeur: 42,
        type: 'saisie',
      })
      expect(await valeursByModalites(indicateurId)).toEqual(
        new Map([[modalitesKey(ids.orange, ids.tva), 42]]),
      )
    }),
  )

  it(
    'remplace la valeur de la même cellule, sans recréer la combinaison',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, ids } = await indicateurWithTwoAxes()
      const upsert = (valeur: number) =>
        runAsPrincipal(apiKey.id, () =>
          upsertValeurAvancement({
            indicateurPublicId: indicateurId,
            body: { individu: individuId, modalites: [ids.orange, ids.ir], date: DATE, valeur },
          }),
        )

      await upsert(1)
      await upsert(2)

      expect(await valeursByModalites(indicateurId)).toEqual(
        new Map([[modalitesKey(ids.orange, ids.ir), 2]]),
      )
    }),
  )

  it(
    'refuse chaque saisie incomplète ou invalide',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, axes, ids } = await indicateurWithTwoAxes()
      const unknownModalite = testModaliteId()
      const upsert = (modalites: string[] | undefined) =>
        runAsPrincipal(apiKey.id, () =>
          upsertValeurAvancement({
            indicateurPublicId: indicateurId,
            body: { individu: individuId, modalites, date: DATE, valeur: 1 },
          }),
        )

      expect((await upsert(undefined))._unsafeUnwrapErr()).toEqual({
        type: 'MODALITE_MANQUANTE',
        axes: [axes.operateur.publicId, axes.fraude.publicId],
      })
      expect((await upsert([ids.orange]))._unsafeUnwrapErr()).toEqual({
        type: 'MODALITE_MANQUANTE',
        axes: [axes.fraude.publicId],
      })
      expect((await upsert([ids.orange, unknownModalite]))._unsafeUnwrapErr()).toEqual({
        type: 'MODALITE_INCONNUE',
        modalites: [unknownModalite],
      })
      expect((await upsert([ids.orange, ids.tva, ids.autre]))._unsafeUnwrapErr()).toEqual({
        type: 'AXE_NON_DECLARE',
        modalites: [ids.autre],
      })
      expect((await upsert([ids.orange, ids.sfr, ids.tva]))._unsafeUnwrapErr()).toEqual({
        type: 'MODALITES_MEME_AXE',
        axe: axes.operateur.publicId,
        modalites: [ids.orange, ids.sfr].sort(),
      })
      expect((await upsert([ids.orange, ids.fiscale]))._unsafeUnwrapErr()).toEqual({
        type: 'MODALITE_NON_FEUILLE',
        modalites: [ids.fiscale],
      })
      expect(await valeursByModalites(indicateurId)).toEqual(new Map())
    }),
  )

  it(
    'garde le format historique pour un indicateur sans axe',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, orange } = await indicateurWithoutAxe()
      const upsert = (modalites: string[] | undefined) =>
        runAsPrincipal(apiKey.id, () =>
          upsertValeurAvancement({
            indicateurPublicId: indicateurId,
            body: { individu: individuId, modalites, date: DATE, valeur: 5 },
          }),
        )

      expect((await upsert([]))._unsafeUnwrap()).not.toHaveProperty('modalites')
      expect((await upsert(undefined))._unsafeUnwrap()).not.toHaveProperty('modalites')
      expect((await upsert([orange]))._unsafeUnwrapErr()).toEqual({
        type: 'AXE_NON_DECLARE',
        modalites: [orange],
      })
    }),
  )
})
