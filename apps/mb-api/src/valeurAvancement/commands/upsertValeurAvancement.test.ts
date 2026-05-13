import { describe, expect, it } from 'vitest'

import {
  EntityNotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { upsertValeurAvancement } from '@/valeurAvancement/commands/upsertValeurAvancement'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('upsertValeurAvancement', () => {
  it(
    "crée la valeur quand le triplet (indicateur, individu, date) n'existe pas",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const ref = await fixtures.referentiel({ publicId: 'REF-UPSERT-CREATE' })
      const individu = await fixtures.individu({
        publicId: 'DEPT-UC-1',
        referentiel: { publicId: ref.publicId },
      })
      const indicateur = await fixtures.indicateur({ publicId: indId })
      await db().indicateurReferentiel.create({
        data: { indicateurId: indicateur.id, referentielId: ref.id },
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
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
        individu: 'DEPT-UC-1',
        date: '2025-03-01',
        valeur: 12.34,
      })
      const row = await db().valeurAvancement.findFirstOrThrow({
        where: { indicateurId: indicateur.id, individuId: individu.id, date: '2025-03-01' },
      })
      expect(row.valeur.toNumber()).toBe(12.34)
    }),
  )

  it(
    'met à jour la valeur existante quand le triplet est déjà présent',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const ref = await fixtures.referentiel({ publicId: 'REF-UPSERT-UPDATE' })
      const individu = await fixtures.individu({
        publicId: 'DEPT-UU-1',
        referentiel: { publicId: ref.publicId },
      })
      const indicateur = await fixtures.indicateur({ publicId: indId })
      await db().indicateurReferentiel.create({
        data: { indicateurId: indicateur.id, referentielId: ref.id },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: individu.publicId, referentiel: { publicId: ref.publicId } },
        date: '2025-03-01',
        valeur: 5,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
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
        where: { indicateurId: indicateur.id, individuId: individu.id, date: '2025-03-01' },
      })
      expect(rows).toHaveLength(1)
      expect(rows[0]!.valeur.toNumber()).toBe(42.5)
    }),
  )

  it(
    "rejette avec 404 quand l'indicateur n'existe pas",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const ref = await fixtures.referentiel({ publicId: 'REF-UPSERT-404' })
      const individu = await fixtures.individu({
        publicId: 'DEPT-404-1',
        referentiel: { publicId: ref.publicId },
      })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertValeurAvancement({
            indicateurPublicId: indId,
            body: { individu: individu.publicId, date: '2025-03-01', valeur: 1 },
          }),
        ),
      ).rejects.toBeInstanceOf(EntityNotFoundError)
    }),
  )

  it(
    "rejette avec 403 quand le principal n'a pas la permission WRITE",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const ref = await fixtures.referentiel({ publicId: 'REF-UPSERT-403' })
      const individu = await fixtures.individu({
        publicId: 'DEPT-403-1',
        referentiel: { publicId: ref.publicId },
      })
      const indicateur = await fixtures.indicateur({ publicId: indId })
      await db().indicateurReferentiel.create({
        data: { indicateurId: indicateur.id, referentielId: ref.id },
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertValeurAvancement({
            indicateurPublicId: indId,
            body: { individu: individu.publicId, date: '2025-03-01', valeur: 1 },
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    "rejette avec 400 quand l'individu n'existe pas",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const ref = await fixtures.referentiel({ publicId: 'REF-UPSERT-UNKNOWN' })
      const indicateur = await fixtures.indicateur({ publicId: indId })
      await db().indicateurReferentiel.create({
        data: { indicateurId: indicateur.id, referentielId: ref.id },
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertValeurAvancement({
            indicateurPublicId: indId,
            body: { individu: 'DEPT-UNKNOWN-99', date: '2025-03-01', valeur: 1 },
          }),
        ),
      ).rejects.toMatchObject({
        constructor: ValidationError,
        details: { unknownOrUnauthorizedIndividu: 'DEPT-UNKNOWN-99' },
      })
    }),
  )

  it(
    "rejette avec 400 quand l'individu n'est pas dans un référentiel lié à l'indicateur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refLie = await fixtures.referentiel({ publicId: 'REF-UPSERT-LINKED' })
      const refOrphelin = await fixtures.referentiel({ publicId: 'REF-UPSERT-ORPHAN' })
      const individu = await fixtures.individu({
        publicId: 'DEPT-ORPH-1',
        referentiel: { publicId: refOrphelin.publicId },
      })
      const indicateur = await fixtures.indicateur({ publicId: indId })
      await db().indicateurReferentiel.create({
        data: { indicateurId: indicateur.id, referentielId: refLie.id },
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertValeurAvancement({
            indicateurPublicId: indId,
            body: { individu: individu.publicId, date: '2025-03-01', valeur: 1 },
          }),
        ),
      ).rejects.toMatchObject({
        constructor: ValidationError,
        details: { unknownOrUnauthorizedIndividu: 'DEPT-ORPH-1' },
      })
    }),
  )
})
